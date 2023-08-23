// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IWePiggyRewarder {
    /**
     * @notice Claim all the wpc accrued by holder in all markets
     * @param holder The address to claim WPC for
     */
    function claimWpc(address holder) external;
}
