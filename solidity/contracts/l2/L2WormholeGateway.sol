// SPDX-License-Identifier: GPL-3.0-only

// ██████████████     ▐████▌     ██████████████
// ██████████████     ▐████▌     ██████████████
//               ▐████▌    ▐████▌
//               ▐████▌    ▐████▌
// ██████████████     ▐████▌     ██████████████
// ██████████████     ▐████▌     ██████████████
//               ▐████▌    ▐████▌
//               ▐████▌    ▐████▌
//               ▐████▌    ▐████▌
//               ▐████▌    ▐████▌
//               ▐████▌    ▐████▌
//               ▐████▌    ▐████▌

pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

import "./L2TBTC.sol";

/// @title IWormholeTokenBridge
/// @notice Wormhole Token Bridge interface. Contains only selected functions
///         used by L2WormholeGateway.
interface IWormholeTokenBridge {
    function completeTransferWithPayload(bytes memory encodedVm)
        external
        returns (bytes memory);

    function parseTransferWithPayload(bytes memory encoded)
        external
        pure
        returns (TransferWithPayload memory transfer);

    function transferTokens(
        address token,
        uint256 amount,
        uint16 recipientChain,
        bytes32 recipient,
        uint256 arbiterFee,
        uint32 nonce
    ) external payable returns (uint64 sequence);

    function transferTokensWithPayload(
        address token,
        uint256 amount,
        uint16 recipientChain,
        bytes32 recipient,
        uint32 nonce,
        bytes memory payload
    ) external payable returns (uint64 sequence);

    struct TransferWithPayload {
        uint8 payloadID;
        uint256 amount;
        bytes32 tokenAddress;
        uint16 tokenChain;
        bytes32 to;
        uint16 toChain;
        bytes32 fromAddress;
        bytes payload;
    }
}

/// @title L2WormholeGateway
/// @notice Selected cross-ecosystem bridges are given the minting authority for
///         tBTC token on L2 and sidechains. This contract gives a minting
///         authority to the Wormhole Bridge.
///
///         The process of bridging from L1 to L2 (or sidechain) looks as
///         follows:
///         1. There is a tBTC holder on L1. The holder goes to the Wormhole
///            Portal and selects the chain they want to bridge to.
///         2. The holder submits one transaction to L1 locking their tBTC
///            tokens in the bridge’s smart contract. After the transaction is
///            mined, they wait about 15 minutes for the Ethereum block
///            finality.
///         3. The holder submits one transaction to L2 that is minting tokens.
///            After that transaction is mined, they have their tBTC on L2.
///
///         The process of bridging from L2 (or sidechain) to L1 looks as
///         follows:
///         1. There is a tBTC holder on L2. That holder goes to the Wormhole
///            Portal and selects one of the L2 chains they want to bridge from.
///         2. The holder submits one transaction to L2 that is burning the
///            token. After the transaction is mined, they wait about 15 minutes
///            for the L2 block finality.
///         3. The holder submits one transaction to L1 unlocking their tBTC
///            tokens from the bridge’s smart contract. After that transaction
///            is mined, they have their tBTC on L1.
///
///         This smart contract is integrated with step 3 of L1->L2 bridging and
///         step 1 of L2->L1 or L2->L2 bridging. When the user redeems token on
///         L2, this contract receives the Wormhole tBTC representation and
///         mints the canonical tBTC in an equal amount. When user sends their
///         token from L1, this contract burns the canonical tBTC and sends
///         Wormhole tBTC representation through the bridge in an equal amount.
/// @dev This contract is supposed to be deployed behind a transparent
///      upgradeable proxy.
contract L2WormholeGateway is
    Initializable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeERC20Upgradeable for IERC20Upgradeable;

    /// @notice Reference to the Wormhole Token Bridge contract.
    IWormholeTokenBridge public bridge;

    /// @notice Wormhole tBTC token representation.
    IERC20Upgradeable public bridgeToken;

    /// @notice Canonical tBTC token.
    L2TBTC public tbtc;

    /// @notice Maps Wormhole chain ID to the Wormhole tBTC gateway address on
    ///         that chain. For example, this chain's ID should be mapped to
    ///         this contract's address. If there is no Wormhole tBTC gateway
    ///         address on the given chain, there is no entry in this mapping.
    ///         The mapping holds addresses in a Wormhole-specific format, where
    ///         Ethereum address is left-padded with zeros.
    mapping(uint16 => bytes32) public gateways;

    /// @notice Minting limit for this gateway. Useful for early days of testing
    ///         the system. The gateway can not mint more canonical tBTC than
    ///         this limit.
    uint256 public mintingLimit;

    /// @notice The amount of tBTC minted by this contract. tBTC burned by this
    ///         contract decreases this amount.
    uint256 public mintedAmount;

    event WormholeTbtcReceived(address receiver, uint256 amount);

    event WormholeTbtcSent(
        uint256 amount,
        uint16 recipientChain,
        bytes32 gateway,
        bytes32 recipient,
        uint256 arbiterFee,
        uint32 nonce
    );

    event WormholeTbtcDeposited(address depositor, uint256 amount);

    event GatewayAddressUpdated(uint16 chainId, bytes32 gateway);

    event MintingLimitUpdated(uint256 mintingLimit);

    function initialize(
        IWormholeTokenBridge _bridge,
        IERC20Upgradeable _bridgeToken,
        L2TBTC _tbtc
    ) external initializer {
        __Ownable_init();
        __ReentrancyGuard_init();

        require(
            address(_bridge) != address(0),
            "Wormhole bridge address must not be 0x0"
        );
        require(
            address(_bridgeToken) != address(0),
            "Bridge token address must not be 0x0"
        );
        require(
            address(_tbtc) != address(0),
            "L2TBTC token address must not be 0x0"
        );

        bridge = _bridge;
        bridgeToken = _bridgeToken;
        tbtc = _tbtc;
        mintingLimit = type(uint256).max;
    }

    /// @notice This function is called when the user sends their token from L2.
    ///         The contract burns the canonical tBTC from the user and sends
    ///         wormhole tBTC representation over the bridge.
    ///         Keep in mind that when multiple bridges receive a minting
    ///         authority on the canonical tBTC, this function may not be able
    ///         to send all amounts of tBTC through the Wormhole bridge. The
    ///         capability of Wormhole Bridge to send tBTC from the chain is
    ///         limited to the amount of tBTC bridged through Wormhole to that
    ///         chain.
    /// @dev Requirements:
    ///      - The sender must have at least `amount` of the canonical tBTC and
    ///        it has to be approved for L2WormholeGateway.
    ///      - The L2WormholeGateway must have at least `amount` of the wormhole
    ///        tBTC.
    ///      - The recipient must not be 0x0.
    ///      - The amount to transfer must not be 0.
    ///      Depending if Wormhole tBTC gateway is registered on the target
    ///      chain, this function uses transfer or transfer with payload over
    ///      the Wormhole bridge.
    /// @param amount The amount of tBTC to be sent.
    /// @param recipientChain The Wormhole recipient chain ID.
    /// @param recipient The address of the recipient in the Wormhole format.
    /// @param arbiterFee The Wormhole arbiter fee. Ignored if sending
    ///                   tBTC to chain with Wormhole tBTC gateway.
    /// @param nonce The Wormhole nonce used to batch messages together.
    /// @return The Wormhole sequence number.
    function sendTbtc(
        uint256 amount,
        uint16 recipientChain,
        bytes32 recipient,
        uint256 arbiterFee,
        uint32 nonce
    ) external payable nonReentrant returns (uint64) {
        require(
            bridgeToken.balanceOf(address(this)) >= amount,
            "Not enough wormhole tBTC in the gateway to bridge"
        );

        require(recipient != bytes32(0), "0x0 recipient not allowed");
        require(amount != 0, "Amount must not be 0");

        bytes32 gateway = gateways[recipientChain];

        emit WormholeTbtcSent(
            amount,
            recipientChain,
            gateway,
            recipient,
            arbiterFee,
            nonce
        );

        mintedAmount -= amount;
        tbtc.burnFrom(msg.sender, amount);
        bridgeToken.safeApprove(address(bridge), amount);

        if (gateway == bytes32(0)) {
            // No Wormhole tBTC gateway on the target chain. The token minted
            // by Wormhole should be considered canonical.
            return
                bridge.transferTokens{value: msg.value}(
                    address(bridgeToken),
                    amount,
                    recipientChain,
                    recipient,
                    arbiterFee,
                    nonce
                );
        } else {
            // There is a Wormhole tBTC gateway on the target chain.
            // The gateway needs to mint canonical tBTC for the recipient
            // encoded in the payload.
            return
                bridge.transferTokensWithPayload{value: msg.value}(
                    address(bridgeToken),
                    amount,
                    recipientChain,
                    gateway,
                    nonce,
                    abi.encode(recipient)
                );
        }
    }

    /// @notice This function is called when the user redeems their token on L2.
    ///         The contract receives Wormhole tBTC representation and mints the
    ///         canonical tBTC for the user.
    ///         If the tBTC minting limit has been reached by this contract,
    ///         instead of minting tBTC the receiver address receives Wormhole
    ///         tBTC representation.
    /// @dev Requirements:
    ///      - The receiver of Wormhole tBTC should be the L2WormholeGateway
    ///        contract.
    ///      - The receiver of the canonical tBTC should be abi-encoded in the
    ///        payload.
    ///      - The receiver of the canonical tBTC must not be the zero address.
    ///      The Wormhole Token Bridge contract has protection against redeeming
    ///      the same VAA again. When a Token Bridge VAA is redeemed, its
    ///      message body hash is stored in a map. This map is used to check
    ///      whether the hash has already been set in this map. For this reason,
    ///      this function does not have to be nonReentrant.
    /// @param encodedVm A byte array containing a Wormhole VAA signed by the
    ///        guardians.
    function receiveTbtc(bytes calldata encodedVm) external {
        // ITokenBridge.completeTransferWithPayload completes a contract-controlled
        // transfer of an ERC20 token. Calling this function is not enough to
        // ensure L2WormholeGateway received Wormhole tBTC representation.
        // Instead of going too deep into the ITokenBridge implementation,
        // asserting who is the receiver of the token, and which token it is,
        // we check the balance before the ITokenBridge call and the balance
        // after ITokenBridge call. This way, we are sure this contract received
        // Wormhole tBTC token in the given amount. This is transparent to
        // all potential upgrades of ITokenBridge implementation and no other
        // validations are needed.
        uint256 balanceBefore = bridgeToken.balanceOf(address(this));
        bytes memory encoded = bridge.completeTransferWithPayload(encodedVm);
        uint256 balanceAfter = bridgeToken.balanceOf(address(this));

        uint256 amount = balanceAfter - balanceBefore;
        // Protect against the custody of irrelevant tokens.
        require(amount > 0, "No tBTC transferred");

        address receiver = fromWormholeAddress(
            bytes32(bridge.parseTransferWithPayload(encoded).payload)
        );
        require(receiver != address(0), "0x0 receiver not allowed");

        // We send wormhole tBTC OR mint canonical tBTC. We do not want to send
        // dust. Sending wormhole tBTC is an exceptional situation and we want
        // to keep it simple.
        if (mintedAmount + amount > mintingLimit) {
            bridgeToken.safeTransfer(receiver, amount);
        } else {
            // The function is non-reentrant given bridge.completeTransferWithPayload
            // call that does not allow to use the same VAA again.
            // slither-disable-next-line reentrancy-benign
            mintedAmount += amount;
            tbtc.mint(receiver, amount);
        }

        // The function is non-reentrant given bridge.completeTransferWithPayload
        // call that does not allow to use the same VAA again.
        // slither-disable-next-line reentrancy-events
        emit WormholeTbtcReceived(receiver, amount);
    }

    /// @notice Allows to deposit Wormhole tBTC token in exchange for canonical
    ///         tBTC. Useful in a situation when user received wormhole tBTC
    ///         instead of canonical tBTC. One example of such situation is
    ///         when the minting limit was exceeded but the user minted anyway.
    /// @dev Requirements:
    ///      - The sender must have at least `amount` of the Wormhole tBTC and
    ///        it has to be approved for L2WormholeGateway.
    ///      - The minting limit must allow for minting the given amount.
    /// @param amount The amount of Wormhole tBTC to deposit.
    function depositWormholeTbtc(uint256 amount) external {
        require(
            mintedAmount + amount <= mintingLimit,
            "Minting limit exceeded"
        );

        emit WormholeTbtcDeposited(msg.sender, amount);
        mintedAmount += amount;
        bridgeToken.safeTransferFrom(msg.sender, address(this), amount);
        tbtc.mint(msg.sender, amount);
    }

    /// @notice Lets the governance to update the tBTC gateway address on the
    ///         chain with the given Wormhole ID.
    /// @dev Use toWormholeAddress function to convert between Ethereum and
    ///      Wormhole address formats.
    /// @param chainId Wormhole ID of the chain.
    /// @param gateway Address of tBTC gateway on the given chain in a Wormhole
    ///                format.
    function updateGatewayAddress(uint16 chainId, bytes32 gateway)
        external
        onlyOwner
    {
        gateways[chainId] = gateway;
        emit GatewayAddressUpdated(chainId, gateway);
    }

    /// @notice Lets the governance to update the tBTC minting limit for this
    ///         contract.
    /// @param _mintingLimit The new minting limit.
    function updateMintingLimit(uint256 _mintingLimit) external onlyOwner {
        mintingLimit = _mintingLimit;
        emit MintingLimitUpdated(_mintingLimit);
    }

    /// @notice Converts Ethereum address into Wormhole format.
    /// @param _address The address to convert.
    function toWormholeAddress(address _address)
        external
        pure
        returns (bytes32)
    {
        return bytes32(uint256(uint160(_address)));
    }

    /// @notice Converts Wormhole address into Ethereum format.
    /// @param _address The address to convert.
    function fromWormholeAddress(bytes32 _address)
        public
        pure
        returns (address)
    {
        return address(uint160(uint256(_address)));
    }
}
