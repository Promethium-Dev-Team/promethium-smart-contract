// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract interestBearning is ERC20 {
    struct userInfo {
        bool isHolder;
        uint256 lastCalculated;
        uint256 unclaimedAmount;
    }

    event Deposited(address account, uint256 amount);
    event Withdrawed(address account, uint256 amount);
    event RateChanged(address changer, uint256 newRate);

    IERC20 public mainToken;

    uint256 public supplyRatePerSecond; //1e18 == 100% APR

    mapping(address => userInfo) accounts;
    address[] holders;

    constructor(address _mainToken, string memory _name, string memory _symbol) ERC20(_name, _symbol) {
        supplyRatePerSecond = 1e12;
        mainToken = IERC20(_mainToken);
    }

    function balanceOf(address account) public view override returns (uint256) {
        return super.balanceOf(account) + getAvailableIncome(account);
    }

    function getAvailableIncome(address account) public view returns (uint256) {
        return accounts[account].unclaimedAmount + getNewIncome(account);
    }

    function getNewIncome(address account) public view returns (uint256) {
        return (super.balanceOf(account) * supplyRatePerSecond * (block.timestamp - accounts[account].lastCalculated)) / 1e18;
    }

    function deposit(uint256 amount) public {
        require(amount > 0, "Can`t deposit 0");

        mainToken.transferFrom(msg.sender, address(this), amount);
        _mint(msg.sender, amount);

        if (!accounts[msg.sender].isHolder) {
            accounts[msg.sender].isHolder = true;
            accounts[msg.sender].lastCalculated = block.timestamp;

            holders.push(msg.sender);
        }

        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint256 amount) public {
        require(amount > 0, "Can`t unstake 0");
        claimRewards();

        _burn(msg.sender, amount);
        mainToken.transfer(msg.sender, amount);

        emit Withdrawed(msg.sender, amount);
    }

    function claimRewards() public {
        _updateInterest(msg.sender);

        _mint(msg.sender, accounts[msg.sender].unclaimedAmount);
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
