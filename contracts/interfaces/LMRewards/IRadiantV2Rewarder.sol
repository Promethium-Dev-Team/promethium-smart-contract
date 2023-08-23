// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IRadiantV2Rewarder {
    /**
     * @notice Claim all pending staking rewards.
     */
    function getReward(address[] memory _rewardTokens) external;
}
