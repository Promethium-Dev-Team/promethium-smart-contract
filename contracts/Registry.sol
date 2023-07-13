// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./DataTypes.sol";
import "./RBAC.sol";

contract Registry is RBAC {
    address[] public positions;
    address[] public ibTokens;

    mapping(address => bool) isAdaptorSetup;

    event AdaptorAdded(address position, bool ibToken, address admin);
    event PositionRemoved(address position, address admin);
    event IbTokenRemoved(address position, address admin);

    function getPositions() public view returns (address[] memory) {
        return positions;
    }

    function getIbTokens() public view returns (address[] memory) {
        return ibTokens;
    }

    function addPosition(address position, bool ibToken) public onlyOwner {
        require(!isAdaptorSetup[position], "Already added");

        ibToken ? ibTokens.push(position) : positions.push(position);
        isAdaptorSetup[position] = true;

        emit AdaptorAdded(position, ibToken, msg.sender);
    }

    function removePosition(uint256 index) public onlyOwner {
        address positionAddress = positions[index];
        isAdaptorSetup[positionAddress] = false;

        for (uint256 i = index; i < positions.length - 1; i++) {
            positions[i] = positions[i + 1];
        }
        positions.pop;

        emit PositionRemoved(positionAddress, msg.sender);
    }

    function removeIbToken(uint256 index) public onlyOwner {
        address positionAddress = positions[index];
        require(
            IERC20(positionAddress).balanceOf(address(this)) == 0,
            "IB token balance should be 0."
        );
        isAdaptorSetup[positionAddress] = false;

        for (uint256 i = index; i < ibTokens.length - 1; i++) {
            ibTokens[i] = ibTokens[i + 1];
        }
        ibTokens.pop;

        emit IbTokenRemoved(positionAddress, msg.sender);
    }

    function _isTransactionAllowed(address adaptor) public view returns (bool) {
        return isAdaptorSetup[adaptor];
    }
}
