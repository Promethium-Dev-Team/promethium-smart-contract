// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "contracts/interfaces/IPriceRouter.sol";

contract PriceRouterMock {
    function getTokenValue(address token, address itoken, uint256 amount) public view returns (uint256) {
        if (itoken == address(0)) {
            revert("Not supported token");
        }
        return amount;
    }
}
