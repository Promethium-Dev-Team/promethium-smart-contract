// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "contracts/interfaces/IPriceRouter.sol";

//need to make the contract upgredable
contract PriceRouterMock {
    function getTokenValue(address token, address itoken, uint256 amount) public view returns (uint256) {
        return amount;
    }
}
