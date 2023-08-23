// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IGranaryRewarder {
    function claimAllRewardsToSelf(
        address[] calldata assets
    ) external returns (address[] memory rewardsList, uint256[] memory claimedAmounts);
}
