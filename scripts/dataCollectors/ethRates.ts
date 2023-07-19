import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { Pool__factory } from "../../typechain-types";
import { Sonne__factory } from "../../typechain-types";
import { Dolomite__factory } from "../../typechain-types";

const secondsPerYear = 60 * 60 * 24 * 365;

export const getAAVEV3Rate = async (currentBlockNumber: number) => {
    const poolAddress = "0x794a61358d6845594f94dc1db02a252b5b4814ad";
    const token = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1";

    const [signer] = await ethers.getSigners();
    const pool = Pool__factory.connect(poolAddress, signer);

    let reserveData = await pool.getReserveData(token, {
        blockTag: currentBlockNumber,
    });
    let supplyRatePerBlock = reserveData[2];

    const ratePerSecond = supplyRatePerBlock
        .div(ethers.utils.parseUnits("1", 9))
        .div(BigNumber.from(secondsPerYear))
        .toNumber();

    return ratePerSecond;
};

export const getRadiantV2Rate = async (currentBlockNumber: number) => {
    const poolAddress = "0xF4B1486DD74D07706052A33d31d7c0AAFD0659E1";
    const token = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1";

    const [signer] = await ethers.getSigners();
    const pool = Pool__factory.connect(poolAddress, signer);

    let reserveData = await pool.getReserveData(token, {
        blockTag: currentBlockNumber,
    });
    let supplyRatePerBlock = reserveData[3];

    const ratePerSecond = supplyRatePerBlock
        .div(ethers.utils.parseUnits("1", 9))
        .div(BigNumber.from(secondsPerYear))
        .toNumber();

    return ratePerSecond;
};

export const getTenderRate = async (currentBlockNumber: number) => {
    const token = "0x0706905b2b21574defcf00b5fc48068995fcdcdf";
    const pathe = "tenderETH.csv";

    const [signer] = await ethers.getSigners();
    const contract = Sonne__factory.connect(token, signer);

    let supplyRatePerBlock = await contract.supplyRatePerBlock({
        blockTag: currentBlockNumber,
    });

    const ratePerSecond = supplyRatePerBlock.toNumber();

    return ratePerSecond;
};

export const getDolomiteRate = async (currentBlockNumber: number) => {
    const token = "0";
    const marginAddress = "0x6bd780e7fdf01d77e4d475c821f1e7ae05409072";

    const [signer] = await ethers.getSigners();
    const contract = Dolomite__factory.connect(marginAddress, signer);

    let borrowRatePerSecond = await contract.getMarketInterestRate(token, {
        blockTag: currentBlockNumber,
    });

    let temp = await contract.getMarketTotalPar(token, {
        blockTag: currentBlockNumber,
    });
    let borrowed = temp[0];
    let supply = temp[1];

    let earningsRate = await contract.getEarningsRate({
        blockTag: currentBlockNumber,
    });

    let ratePerSecond = borrowRatePerSecond
        .mul(earningsRate)
        .mul(borrowed)
        .div(1e15)
        .div(supply)
        .div(1e2)
        .toNumber();

    return ratePerSecond;
};

export const getWePiggyRate = async (currentBlockNumber: number) => {
    const token = "0x17933112E9780aBd0F27f2B7d9ddA9E840D43159";

    const [signer] = await ethers.getSigners();

    const contract = Sonne__factory.connect(token, signer);
    let supplyRatePerBlock = await contract.supplyRatePerBlock({
        blockTag: currentBlockNumber,
    });

    const ratePerSecond = supplyRatePerBlock.div(15).toNumber();

    return ratePerSecond;
};
