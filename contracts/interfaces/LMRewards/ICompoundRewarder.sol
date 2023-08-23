// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface ICompoundRewarder {
    /**
     * @notice Claim rewards of token type from a comet instance to owner address
     * @param comet The protocol instance
     * @param src The owner to claim for
     * @param shouldAccrue Whether or not to call accrue first
     */
    function claim(address comet, address src, bool shouldAccrue) external;
}
