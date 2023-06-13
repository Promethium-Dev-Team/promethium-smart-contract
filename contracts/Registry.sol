// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./DataTypes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Registry is Ownable {
    address[] public positions;
    mapping(address => bool) isAdaptorSetup;

    event PositionAdded(address position, address admin);
    event PositionRemoved(uint256 index, address admin);

    function getPositions() public view returns (address[] memory) {
        return positions;
    }

    function addPosition(address position) public onlyOwner {
        require(!isAdaptorSetup[position], "Already added");

        positions.push(position);
        isAdaptorSetup[position] = true;

        emit PositionAdded(position, msg.sender);
    }

    function removePosition(uint256 index) public onlyOwner {
        isAdaptorSetup[positions[index]] = false;

        for (uint256 i = index; i < positions.length - 1; i++) {
            positions[i] = positions[i + 1];
        }
        positions.pop;

        emit PositionRemoved(index, msg.sender);
    }
}
