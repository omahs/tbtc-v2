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

contract RelayMaintainerProxy is Ownable, Reimbursable {
    IRelay public relay;

    /// @notice Gas that is meant to balance the retarget overall cost. Can be
    //          updated by the governance based on the current market conditions.
    uint256 public retargetGasOffset;

    event RelayUpdated(address newRelay);

    constructor(IRelay _relay, ReimbursementPool _reimbursementPool) {
        relay = _relay;
        reimbursementPool = _reimbursementPool;

        // TODO: Set the proper value or remove completely.
        retargetGasOffset = 0;
    }

    function retarget(bytes memory headers) external {
        uint256 gasStart = gasleft();

        relay.retarget(headers);

        reimbursementPool.refund(
            (gasStart - gasleft()) + retargetGasOffset,
            msg.sender
        );
    }

    function updateRelay(IRelay _relay) external onlyOwner {
        relay = _relay;

        emit RelayUpdated(address(_relay));
    }

    // TODO: Most likely `onlyReimbursableAdmin()` needs to be overridden.
    // TODO: If the `ReimbursementPool` is used, the Relay needs to be authorized in it.
}
