// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract dforce {
    /**
     * @dev Returns the current per-block supply interest rate.
     *  Calculates the supply rate:
     *  underlying = totalSupply × exchangeRate
     *  borrowsPer = totalBorrows ÷ underlying
     *  supplyRate = borrowRate × (1-reserveFactor) × borrowsPer
     */
    function supplyRatePerBlock() public view returns (uint256) {}

    /**
     * @dev Caller deposits assets into the market and `_recipient` receives iToken in exchange.
     * @param _recipient The account that would receive the iToken.
     * @param _mintAmount The amount of the underlying token to deposit.
     */
    function mint(address _recipient, uint256 _mintAmount) external {}

    /**
     * @dev Caller redeems specified underlying from `_from` to get underlying token.
     * @param _from The account that would burn the iToken.
     * @param _redeemUnderlying The number of underlying to redeem.
     */
    function redeemUnderlying(
        address _from,
        uint256 _redeemUnderlying
    ) external {}
}
