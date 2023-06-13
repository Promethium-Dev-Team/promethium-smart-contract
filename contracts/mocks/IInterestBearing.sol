// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.8.9;

interface IInterestBearning {
    function mint(address, uint256) external;

    function burn(address, uint256) external;
}
