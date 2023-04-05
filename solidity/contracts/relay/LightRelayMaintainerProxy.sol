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

pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@keep-network/random-beacon/contracts/Reimbursable.sol";
import "@keep-network/random-beacon/contracts/ReimbursementPool.sol";

import "./LightRelay.sol";

/// @title LightRelayMaintainerProxy
/// @notice The proxy contract that allows the relay maintainers to be refunded
///         for the spent gas from the `ReimbursementPool`. When proving the
///         next Bitcoin difficulty epoch, the maintainer calls the
///         `LightRelayMaintainerProxy` which in turn calls the actual `LightRelay`
///         contract.
contract LightRelayMaintainerProxy is Ownable, Reimbursable {
    ILightRelay public lightRelay;

    /// @notice Stores addresses that can maintain the relay.
    mapping(address => bool) public isAuthorized;

    /// @notice Gas that is meant to balance the retarget overall cost. Can be
    //          updated by the governance based on the current market conditions.
    uint256 public retargetGasOffset;

    event LightRelayUpdated(address newRelay);

    event MaintainerAuthorized(address indexed maintainer);

    event MaintainerDeauthorized(address indexed maintainer);

    modifier onlyRelayMaintainer() {
        require(isAuthorized[msg.sender], "Caller is not authorized");
        _;
    }

    constructor(ILightRelay _lightRelay, ReimbursementPool _reimbursementPool) {
        lightRelay = _lightRelay;
        reimbursementPool = _reimbursementPool;

        // TODO: Set the proper value or remove completely.
        retargetGasOffset = 0;
    }

    /// @notice Wraps `LightRelay.retarget` call and reimburses the caller's
    ///         transaction cost. Can only be called by an authorized relay
    ///         maintainer.
    /// @dev See `LightRelay.retarget` function documentation.
    function retarget(bytes memory headers) external onlyRelayMaintainer {
        uint256 gasStart = gasleft();

        lightRelay.retarget(headers);

        reimbursementPool.refund(
            (gasStart - gasleft()) + retargetGasOffset,
            msg.sender
        );
    }

    /// @notice Allows the governance to upgrade the `LightRelay` address.
    /// @dev The function does not implement any governance delay and does not
    ///      check the status of the `LightRelay`. The Governance implementation
    ///      needs to ensure all requirements for the upgrade are satisfied
    ///      before executing this function.
    function updateLightRelay(ILightRelay _lightRelay) external onlyOwner {
        lightRelay = _lightRelay;

        emit LightRelayUpdated(address(_lightRelay));
    }

    /// @notice Authorizes the given address as a maintainer. Can only be called
    ///         by the owner.
    /// @param maintainer The address of the maintainer to be authorized.
    function authorize(address maintainer) external onlyOwner {
        isAuthorized[maintainer] = true;
        emit MaintainerAuthorized(maintainer);
    }

    /// @notice Deauthorizes the given address as a maintainer. Can only be called
    ///         by the owner.
    /// @param maintainer The address of the maintainer to be deauthorized.
    function deauthorize(address maintainer) external onlyOwner {
        isAuthorized[maintainer] = false;
        emit MaintainerDeauthorized(maintainer);
    }

    // TODO: Most likely `onlyReimbursableAdmin()` needs to be overridden.
    // TODO: If the `ReimbursementPool` is used, the Relay needs to be authorized in it.
}
