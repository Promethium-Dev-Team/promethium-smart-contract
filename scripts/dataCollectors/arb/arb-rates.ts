import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { Dforce__factory, Pool__factory } from "../../../typechain-types";
import { Sonne__factory } from "../../../typechain-types";
import { Dolomite__factory } from "../../../typechain-types";

export const secondsPerYear = 60 * 60 * 24 * 365;
export const avarageBlockTime = 13; //7.19.2023

export const getAAVEV3Rate = async (currentBlockNumber: number) => {
    const poolAddress = "0x794a61358d6845594f94dc1db02a252b5b4814ad";
    const token = "0x912CE59144191C1204E64559FE8253a0e49E6548";

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
    const token = "0x912CE59144191C1204E64559FE8253a0e49E6548";

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

export const getRadiantV1Rate = async (currentBlockNumber: number) => {
    const poolAddress = "0x2032b9A8e9F7e76768CA9271003d3e43E1616B1F";
    const token = "0x912CE59144191C1204E64559FE8253a0e49E6548";

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
    const token = "0x912CE59144191C1204E64559FE8253a0e49E6548";

    const [signer] = await ethers.getSigners();
    const contract = Sonne__factory.connect(token, signer);

    let supplyRatePerBlock = await contract.supplyRatePerBlock({
        blockTag: currentBlockNumber,
    });

    const ratePerSecond = supplyRatePerBlock.div(avarageBlockTime).toNumber();
    return ratePerSecond;
};

export const getDolomiteRate = async (currentBlockNumber: number) => {
    const token = "5";
    const marginAddress = "0x912CE59144191C1204E64559FE8253a0e49E6548";

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
        .div(supply)
        .div(ethers.utils.parseUnits("1", 18))
        .toNumber();

    return ratePerSecond;
};

export const getWePiggyRate = async (currentBlockNumber: number) => {
    const token = "0x912CE59144191C1204E64559FE8253a0e49E6548";

    const [signer] = await ethers.getSigners();

    const contract = Sonne__factory.connect(token, signer);
    let supplyRatePerBlock = await contract.supplyRatePerBlock({
        blockTag: currentBlockNumber,
    });

    const ratePerSecond = supplyRatePerBlock.div(avarageBlockTime).toNumber();

    return ratePerSecond;
};

export const getDForceRate = async (currentBlockNumber: number) => {
    const token = "0x912CE59144191C1204E64559FE8253a0e49E6548";

    const [signer] = await ethers.getSigners();

    const contract = Dforce__factory.connect(token, signer);
    let supplyRatePerBlock = await contract.supplyRatePerBlock({
        blockTag: currentBlockNumber,
    });

    const ratePerSecond = supplyRatePerBlock.div(avarageBlockTime).toNumber();

    return ratePerSecond;
};

async function main() {
    let currentBlockNumber = (await ethers.provider.getBlock("latest")).number;
    console.log(
        ((await getAAVEV3Rate(currentBlockNumber)) * secondsPerYear) / 1e16
    );
    console.log(
        ((await getRadiantV1Rate(currentBlockNumber)) * secondsPerYear) / 1e16
    );
    console.log(
        ((await getTenderRate(currentBlockNumber)) * secondsPerYear) / 1e16
    );
    console.log(
        ((await getDolomiteRate(currentBlockNumber)) * secondsPerYear) / 1e16
    );
    console.log(
        ((await getWePiggyRate(currentBlockNumber)) * secondsPerYear) / 1e16
    );
    console.log(
        ((await getRadiantV2Rate(currentBlockNumber)) * secondsPerYear) / 1e16
    );
    console.log(
        ((await getDForceRate(currentBlockNumber)) * secondsPerYear) / 1e16
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
