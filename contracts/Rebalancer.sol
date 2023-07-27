// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./Registry.sol";

contract Rebalancer is ERC4626, Registry, ReentrancyGuard {
    /**
     * @dev Distribution matrix defines what percentage
     * of the token will be stored in each position.
     * The last element of the matrix always responds about
     * the token percentage in vault reserve.
     */

    event DistributionMatrixUpdated(
        address provider,
        DataTypes.AdaptorCall[] _newMatrix
    );

    event AutocompoundMatrixUpdated(
        address provider,
        DataTypes.AdaptorCall[] _newMatrix
    );

    event FeesChanged(address owner, DataTypes.feeData newFeeData);
    DataTypes.feeData public FeeData;
    address public poolToken;

    DataTypes.AdaptorCall[] public distributionMatrix;
    DataTypes.AdaptorCall[] public autocompoundMatrix;

    bool public distributionMatrixExecuted;
    bool public autocompoundMatrixExecuted;

    uint64 public MAX_PLATFORM_FEE = 0.3 * 1e18;
    uint64 public MAX_WITHDRAW_FEE = 0.05 * 1e18;
    uint256 public constant feeDecimals = 18;

    constructor(
        address _asset,
        string memory _name,
        string memory _symbol,
        address _treasury
    ) ERC4626(IERC20(_asset)) ERC20(_name, _symbol) {
        poolToken = _asset;

        FeeData = DataTypes.feeData({
            platformFee: 0.05 * 1e18,
            withDrawFee: 0.0001 * 1e18,
            treasury: _treasury
        });
    }

    function setDistributionMatrix(
        DataTypes.AdaptorCall[] memory _newMatrix
    ) public onlyRebalanceProvider {
        delete distributionMatrix;
        distributionMatrixExecuted = false;

        for (uint8 i = 0; i < _newMatrix.length; ++i) {
            require(
                isAdaptorSetup[_newMatrix[i].adaptor],
                "Adaptor is not whitelisted"
            );
            distributionMatrix.push(_newMatrix[i]);
        }

        emit DistributionMatrixUpdated(msg.sender, _newMatrix);
    }

    function setAutocompoundMatrix(
        DataTypes.AdaptorCall[] memory _newMatrix
    ) public onlyAutocompoundProvider {
        delete autocompoundMatrix;
        autocompoundMatrixExecuted = false;

        for (uint8 i = 0; i < _newMatrix.length; ++i) {
            require(
                isAdaptorSetup[_newMatrix[i].adaptor],
                "Adaptor is not whitelisted"
            );
            autocompoundMatrix.push(_newMatrix[i]);
        }

        emit AutocompoundMatrixUpdated(msg.sender, _newMatrix);
    }

    function harvest() external nonReentrant {
        require(!autocompoundMatrixExecuted, "Matrix already executed");
        uint256 balanceBefore = totalAssets();
        _executeTransactions(autocompoundMatrix);
        uint256 balanceAfter = totalAssets();

        require(
            balanceBefore < balanceAfter,
            "Balance after should be greater"
        );
        IERC20(poolToken).transfer(
            FeeData.treasury,
            (((balanceAfter - balanceBefore) * FeeData.platformFee) / 10) ^
                feeDecimals
        );
        autocompoundMatrixExecuted = true;
    }

    function rebalance() external nonReentrant {
        require(!distributionMatrixExecuted, "Matrix already executed");
        _executeTransactions(distributionMatrix);
        distributionMatrixExecuted = true;
    }

    function _executeTransactions(
        DataTypes.AdaptorCall[] memory _matrix
    ) internal {
        for (uint8 i = 0; i < _matrix.length; ++i) {
            address adaptor = _matrix[i].adaptor;
            (bool success, ) = adaptor.call(_matrix[i].callData);
            require(success, "transaction failed");
        }
    }

    function totalAssets() public view override returns (uint256) {
        uint256 _totalAssets = IERC20(asset()).balanceOf(address(this));
        for (uint i = 0; i < iBTokens.length; i++) {
            _totalAssets += IERC20(iBTokens[i]).balanceOf(address(this));
        }
        return _totalAssets;
    }

    function setFee(DataTypes.feeData memory newFeeData) public onlyOwner {
        require(
            newFeeData.platformFee <= MAX_PLATFORM_FEE,
            "Platform fee limit exceeded."
        );
        require(
            newFeeData.withDrawFee <= MAX_WITHDRAW_FEE,
            "Withdraw fee limit exceeded."
        );
        FeeData = newFeeData;

        emit FeesChanged(msg.sender, newFeeData);
    }
}
