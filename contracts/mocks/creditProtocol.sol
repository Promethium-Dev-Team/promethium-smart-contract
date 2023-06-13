// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./interestBearning.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract creditProtocol is Ownable {
    struct userInfo {
        bool isHolder;
        uint256 lastCalculated;
        uint256 unclaimedAmount;
    }

    event InterestBearningTokenDeployed(address tokenAddress);
    event Deposited(address account, uint256 amount);
    event Withdrawed(address account, uint256 amount);
    event RateChanged(address changer, uint256 newRate);

    interestBearning public IBToken;
    IERC20 public mainToken;

    uint256 public supplyRatePerSecond; //1e18 == 100% APR

    mapping(address => userInfo) accounts;
    address[] holders;

    constructor(
        address _mainToken,
        string memory _name,
        string memory _symbol
    ) {
        supplyRatePerSecond = 1e16;
        mainToken = IERC20(_mainToken);
        IBToken = new interestBearning(_name, _symbol);

        emit InterestBearningTokenDeployed(address(IBToken));
    }

    function getAvailableIncome(address account) public view returns (uint256) {
        return accounts[account].unclaimedAmount + getNewIncome(account);
    }

    function getUserBalance(address account) public view returns (uint256) {
        return IBToken.balanceOf(account);
    }

    function getNewIncome(address account) public view returns (uint256) {
        return
            (IBToken.balanceOf(account) *
                supplyRatePerSecond *
                (block.timestamp - accounts[account].lastCalculated)) / 1e18;
    }

    function deposit(uint256 amount) public {
        require(amount > 0, "Can`t deposit 0");

        mainToken.transferFrom(msg.sender, address(this), amount);
        IBToken.mint(msg.sender, amount);

        if (!accounts[msg.sender].isHolder) {
            accounts[msg.sender].isHolder = true;
            accounts[msg.sender].lastCalculated = block.timestamp;

            holders.push(msg.sender);
        }

        _updateInterest(msg.sender);
        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint256 amount) public {
        require(amount > 0, "Can`t unstake 0");
        _updateInterest(msg.sender);

        IBToken.burn(msg.sender, amount);
        mainToken.transfer(msg.sender, amount);

        emit Withdrawed(msg.sender, amount);
    }

    function claimRewards() public {
        _updateInterest(msg.sender);
        require(accounts[msg.sender].unclaimedAmount > 0, "Nothing to claim");

        IBToken.mint(msg.sender, accounts[msg.sender].unclaimedAmount);
        accounts[msg.sender].unclaimedAmount = 0;
    }

    function setSupplyRatePerSecond(uint256 _supplyRatePerSecond) public {
        supplyRatePerSecond = _supplyRatePerSecond;
        for (uint256 i = 0; i < holders.length; i++) {
            _updateInterest(holders[i]);
        }

        emit RateChanged(msg.sender, _supplyRatePerSecond);
    }

    function _updateInterest(address account) internal {
        accounts[account].unclaimedAmount = getAvailableIncome(account);
        accounts[account].lastCalculated = block.timestamp;
    }
}
