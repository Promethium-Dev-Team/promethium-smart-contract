// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.8.0;

interface IMulticall {
    function multicall(bytes[] calldata data) external payable returns (bytes[] memory results);
}
