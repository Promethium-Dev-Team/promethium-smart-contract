// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IDForceDistributor {
    /**
     * @notice Claim reward accrued in all iTokens by the holders
     * @param _holders The account to claim for
     */
    function claimAllReward(address[] memory _holders) external;
}
