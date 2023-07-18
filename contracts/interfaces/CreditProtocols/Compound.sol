// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract compound {
    function getUtilization() public view returns (uint256) {}

    function getSupplyRate(uint256 utilization) public view returns (uint256) {}

    function getBorrowRate(uint256 utilization) public view returns (uint256) {}
}
