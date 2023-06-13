// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./Registry.sol";

contract Rebalancer is ERC4626, Registry, ReentrancyGuard {
    using Address for address;

    /**
     * @dev Distribution matrix defines what percentage
     * of the token will be stored in each position.
     * The last element of the matrix always responds about
     * the token percentage in vault reserve.
     */

    DataTypes.AdaptorCall[] public distributionMatrix;
    DataTypes.AdaptorCall[] public autocompoundMatrix;

    constructor(
        address _asset,
        string memory _name,
        string memory _symbol
    ) ERC4626(IERC20(_asset)) ERC20(_name, _symbol) {}

    function setAutocompoundMatrix(
        DataTypes.AdaptorCall[] memory _newMatrix
    ) public onlyOwner {
        delete autocompoundMatrix;
        for (uint8 i = 0; i < _newMatrix.length; ++i) {
            require(
                isAdaptorSetup[_newMatrix[i].adaptor],
                "Adaptor is not whitelisted"
            );
            autocompoundMatrix.push(_newMatrix[i]);
        }
    }

    function setDistributionMatrix(
        DataTypes.AdaptorCall[] memory _newMatrix
    ) public onlyOwner {
        delete distributionMatrix;
        for (uint8 i = 0; i < _newMatrix.length; ++i) {
            require(
                isAdaptorSetup[_newMatrix[i].adaptor],
                "Adaptor is not whitelisted"
            );
            distributionMatrix.push(_newMatrix[i]);
        }
    }

    function rebalance() external nonReentrant {
        for (uint8 i = 0; i < autocompoundMatrix.length; ++i) {
            address adaptor = autocompoundMatrix[i].adaptor;
            adaptor.call(autocompoundMatrix[i].callData);
        }
    }

    function harvest() external nonReentrant {
        for (uint8 i = 0; i < distributionMatrix.length; ++i) {
            address adaptor = distributionMatrix[i].adaptor;
            adaptor.call(distributionMatrix[i].callData);
        }
    }
}
