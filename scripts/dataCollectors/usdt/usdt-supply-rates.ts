import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { Dforce__factory, Pool__factory } from "../../../typechain-types";
import { Sonne__factory } from "../../../typechain-types";
import { Dolomite__factory } from "../../../typechain-types";

export const secondsPerYear = 60 * 60 * 24 * 365;
export const avarageBlockTime = 13; //7.19.2023

export const getAAVEV3SupplyRate = async (currentBlockNumber: number) => {
    const poolAddress = "0x794a61358d6845594f94dc1db02a252b5b4814ad";
    const token = "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9";

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

export const getRadiantV2SupplyRate = async (currentBlockNumber: number) => {
    const poolAddress = "0xF4B1486DD74D07706052A33d31d7c0AAFD0659E1";
    const token = "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9";

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

export const getRadiantV1SupplyRate = async (currentBlockNumber: number) => {
    const poolAddress = "0x2032b9A8e9F7e76768CA9271003d3e43E1616B1F";
    const token = "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9";

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

export const getTenderSupplyRate = async (currentBlockNumber: number) => {
    const token = "0x4A5806A3c4fBB32F027240F80B18b26E40BF7E31";

    const [signer] = await ethers.getSigners();
    const contract = Sonne__factory.connect(token, signer);

    let supplyRatePerBlock = await contract.supplyRatePerBlock({
        blockTag: currentBlockNumber,
    });

    const ratePerSecond = supplyRatePerBlock.div(avarageBlockTime).toNumber();
    return ratePerSecond;
};

export const getDolomiteSupplyRate = async (currentBlockNumber: number) => {
    const token = "5";
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
        .div(supply)
        .div(ethers.utils.parseUnits("1", 18))
        .toNumber();

    return ratePerSecond;
};

export const getWePiggySupplyRate = async (currentBlockNumber: number) => {
    const token = "0xB65Ab7e1c6c1Ba202baed82d6FB71975D56F007C";

    const [signer] = await ethers.getSigners();

    const contract = Sonne__factory.connect(token, signer);
    let supplyRatePerBlock = await contract.supplyRatePerBlock({
        blockTag: currentBlockNumber,
    });

    const ratePerSecond = supplyRatePerBlock.div(avarageBlockTime).toNumber();

    return ratePerSecond;
};

export const getDForceSupplyRate = async (currentBlockNumber: number) => {
    const token = "0xf52f079Af080C9FB5AFCA57DDE0f8B83d49692a9";

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
        "AAVEV3 supply rate: " +
            ((await getAAVEV3SupplyRate(currentBlockNumber)) * secondsPerYear) /
                1e16
    );
    console.log(
        "RadiantV1 supply rate: " +
            ((await getRadiantV1SupplyRate(currentBlockNumber)) *
                secondsPerYear) /
                1e16
    );
    console.log(
        "Tender supply rate: " +
            ((await getTenderSupplyRate(currentBlockNumber)) * secondsPerYear) /
                1e16
    );
    console.log(
        "Dolomite supply rate: " +
            ((await getDolomiteSupplyRate(currentBlockNumber)) *
                secondsPerYear) /
                1e16
    );
    console.log(
        "WePiggy3 supply rate: " +
            ((await getWePiggySupplyRate(currentBlockNumber)) *
                secondsPerYear) /
                1e16
    );
    console.log(
        "RadiantV2 supply rate: " +
            ((await getRadiantV2SupplyRate(currentBlockNumber)) *
                secondsPerYear) /
                1e16
    );
    console.log(
        "DForce supply rate " +
            ((await getDForceSupplyRate(currentBlockNumber)) * secondsPerYear) /
                1e16
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
