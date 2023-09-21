import {ethers} from "hardhat";
import {BigNumber, Contract} from "ethers";
import {
    AAVEV3__factory,
    ICompound__factory,
    Idforce__factory,
    IGranary__factory,
    ILodestar__factory,
    IRadiantV2__factory,
    ITender__factory,
    IWePiggy__factory,
    IWePiggyModel__factory,
    ITenderModel__factory,
    ILodestarModel__factory,
    IdForceModel__factory,
} from "../../typechain-types";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
let signer: SignerWithAddress;

let totalTokens = ethers.utils.parseUnits("10000000", 6);

const secsInYear = 60 * 60 * 24 * 365;
const scaleFactor = ethers.utils.parseUnits("1", 18);

let DForceModel: Contract;
let dForceContract: Contract;
let dForceCash: BigNumber;
let dForceBorrows: BigNumber;
let dForceReserves: BigNumber;
let dForceReserveFactorMantissa: BigNumber;
let dForceTotalSupply: BigNumber;
let dForceExchangeRate: BigNumber;
let dForceUnderlying: BigNumber;

let lodestarModel: Contract;
let lodestarContract: Contract;
let lodestarCash: BigNumber;
let lodestarBorrows: BigNumber;
let lodestarReserves: BigNumber;
let lodestarReserveFactorMantissa: BigNumber;

let tenderModel: Contract;
let tenderContract: Contract;
let tenderCash: BigNumber;
let tenderBorrows: BigNumber;
let tenderReserves: BigNumber;
let tenderReserveFactorMantissa: BigNumber;

let wePiggyModel: Contract;
let wePiggyContract: Contract;
let wePiggyCash: BigNumber;
let wePiggyBorrows: BigNumber;
let wePiggyReserves: BigNumber;
let wePiggyReserveFactorMantissa: BigNumber;

let compound: Contract;
let compoundSupplyPerSecondInterestRateBase: BigNumber;
let compoundSupplyPerSecondInterestRateSlopeLow: BigNumber;
let compoundSupplyPerSecondInterestRateSlopeHigh: BigNumber;
let compoundSupplyKink: BigNumber;
let compoundTotalBorrow: BigNumber;
let compoundSupply: BigNumber;

export const bigNumberishToNumberWithDecimals = async (apr: BigNumber, _decimals: number) => {
    const decimals = BigNumber.from(10).pow(_decimals);

    const before = apr.div(decimals).toString();
    const after = apr.mod(decimals).toString();

    return parseFloat(before + "." + "0".repeat(_decimals - after.length) + after);
};

// export const getAAVEAPR = async (
//     blockNumber?: number,
//     contractAddress: string = "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
//     asset: string = "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
// ) => {
//     const contract = AAVEV3__factory.connect(contractAddress, signer);

//     const apr = (await contract.getReserveData(asset, {blockTag: blockNumber}))[2];
//     const decimals = BigNumber.from(10).pow(27);

//     const before = apr.div(decimals).toString();
//     const after = apr.mod(decimals).toString();
//     return parseFloat(before + "." + "0".repeat(27 - after.length) + after);
// };

// export const getGranaryAPR = async (
//     blockNumber?: number,
//     contractAddress: string = "0x102442A3BA1e441043154Bc0B8A2e2FB5E0F94A7",
//     asset: string = "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
// ) => {
//     const contract = IGranary__factory.connect(contractAddress, signer);

//     const apr = (await contract.getReserveData(asset, {blockTag: blockNumber}))[3];

//     const decimals = BigNumber.from(10).pow(27);

//     const before = apr.div(decimals).toString();
//     const after = apr.mod(decimals).toString();

//     return parseFloat(before + "." + "0".repeat(27 - after.length) + after);
// };

// export const getRadiantV2APR = async (
//     blockNumber?: number,
//     contractAddress: string = "0xF4B1486DD74D07706052A33d31d7c0AAFD0659E1",
//     asset: string = "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
// ) => {
//     const contract = IRadiantV2__factory.connect(contractAddress, signer);

//     const apr = (await contract.getReserveData(asset, {blockTag: blockNumber}))[3];

//     const decimals = BigNumber.from(10).pow(27);

//     const before = apr.div(decimals).toString();
//     const after = apr.mod(decimals).toString();

//     return parseFloat(before + "." + "0".repeat(27 - after.length) + after);
// };

export const initialize = async () => {
    DForceModel = IdForceModel__factory.connect("0xaf72329e42d0be8bee137bc3420f20fc04a49efb", signer);
    dForceContract = Idforce__factory.connect("0x8dc3312c68125a94916d62B97bb5D925f84d4aE0", signer);
    dForceCash = await dForceContract.getCash();
    dForceBorrows = await dForceContract.totalBorrows();
    dForceReserves = await dForceContract.totalReserves();
    dForceReserveFactorMantissa = await dForceContract.reserveRatio();
    dForceTotalSupply = await dForceContract.totalSupply();
    dForceExchangeRate = await dForceContract.exchangeRateStored();
    dForceUnderlying = dForceTotalSupply.mul(dForceExchangeRate);

    lodestarModel = ILodestarModel__factory.connect("0xec68bc9190c815289a5a187ca88d3769a4406dcf", signer);
    lodestarContract = ILodestar__factory.connect("0x1ca530f02DD0487cef4943c674342c5aEa08922F", signer);
    lodestarCash = await lodestarContract.getCash();
    lodestarBorrows = await lodestarContract.totalBorrows();
    lodestarReserves = await lodestarContract.totalReserves();
    lodestarReserveFactorMantissa = await lodestarContract.reserveFactorMantissa();

    tenderModel = ITenderModel__factory.connect("0xa738b4910b0a93583a7e3e56d73467fe7c538158", signer);
    tenderContract = ITender__factory.connect("0x068485a0f964B4c3D395059a19A05a8741c48B4E", signer);
    tenderCash = await tenderContract.getCash();
    tenderBorrows = await tenderContract.totalBorrows();
    tenderReserves = await tenderContract.totalReserves();
    tenderReserveFactorMantissa = await tenderContract.reserveFactorMantissa();

    wePiggyModel = IWePiggyModel__factory.connect("0x5676eb997c30140606965cebd4ca829ab89a6cac", signer);
    wePiggyContract = IWePiggy__factory.connect("0x2Bf852e22C92Fd790f4AE54A76536c8C4217786b", signer);
    wePiggyCash = await wePiggyContract.getCash();
    wePiggyBorrows = await wePiggyContract.totalBorrows();
    wePiggyReserves = await wePiggyContract.totalReserves();
    wePiggyReserveFactorMantissa = await wePiggyContract.reserveFactorMantissa();

    compound = ICompound__factory.connect("0xa5edbdd9646f8dff606d7448e414884c7d905dca", signer);
    compoundSupplyPerSecondInterestRateBase = BigNumber.from(0);
    compoundSupplyPerSecondInterestRateSlopeLow = BigNumber.from(1030568239);
    compoundSupplyPerSecondInterestRateSlopeHigh = BigNumber.from(12683916793);
    compoundSupplyKink = ethers.utils.parseUnits("8", 17);
    compoundTotalBorrow = await compound.totalBorrow();
    compoundSupply = await compound.totalSupply();
};

export const getDForceAPR = async (deposit: BigNumber) => {
    let dForceTotalCash = dForceCash.add(deposit);

    //getting utilization
    let util: BigNumber;
    let grossSupply = dForceTotalCash.add(dForceBorrows);
    let supply = grossSupply.sub(dForceReserves);
    if (dForceBorrows.eq(BigNumber.from(0))) {
        util = BigNumber.from(0);
    } else if (grossSupply.lte(dForceReserves)) {
        util = scaleFactor;
    } else if (dForceBorrows.gt(dForceTotalSupply.add(deposit))) {
        util = scaleFactor;
    } else {
        util = dForceBorrows.mul(scaleFactor).div(supply);
    }
    const optimal = ethers.utils.parseUnits("9", 17);
    const slope_1 = ethers.utils.parseUnits("5", 16);
    const slope_2 = ethers.utils.parseUnits("6", 17);
    let annualBorrowRateScaled: BigNumber;
    if (util < optimal) {
        annualBorrowRateScaled = slope_1.mul(util).div(optimal);
    } else {
        annualBorrowRateScaled = slope_1.add(slope_2.mul(util.sub(optimal)).div(scaleFactor.sub(optimal)));
    }

    const blockPerYear = BigNumber.from(2425846);
    const dForceBorrowAPR = annualBorrowRateScaled.div(blockPerYear); //await DForceModel.getBorrowRate(dForceTotalCash, dForceBorrows, dForceReserves);
    let dForceTotalUnderlying = deposit.add(dForceUnderlying);
    return dForceBorrowAPR
        .mul(scaleFactor.sub(dForceReserveFactorMantissa))
        .mul(dForceBorrows)
        .div(dForceTotalUnderlying)
        .mul(secsInYear)
        .div(13);
};

export const getLodestarAPR = async (deposit: BigNumber) => {
    let lodestarTotalCash = lodestarCash.add(deposit);
    let oneMinusReserveFactor = scaleFactor.sub(lodestarReserveFactorMantissa);

    //borrow
    let util: BigNumber;
    if (lodestarBorrows.eq(BigNumber.from(0))) {
        util = BigNumber.from(0);
    } else {
        util = lodestarBorrows.mul(scaleFactor).div(lodestarTotalCash.add(lodestarBorrows).sub(lodestarReserves));
    }
    const kink = ethers.utils.parseUnits("8", 17);
    const multiplierPerBlock = BigNumber.from(47564687975);
    let jumpMultiplierPerBlock = BigNumber.from(47564687975);
    let baseRatePerBlock = BigNumber.from(0);
    let borrowRate: BigNumber;
    if (util.lte(kink)) {
        borrowRate = util.mul(multiplierPerBlock).div(scaleFactor).add(baseRatePerBlock);
    } else {
        let normalRate = kink.mul(multiplierPerBlock).div(scaleFactor).add(baseRatePerBlock);
        let excessUtil = util.sub(kink);
        borrowRate = excessUtil.mul(jumpMultiplierPerBlock).div(scaleFactor).add(normalRate);
    }

    let rateToPool = borrowRate.mul(oneMinusReserveFactor).div(scaleFactor);
    let blocksPerYear = BigNumber.from(2628000);

    return util.mul(rateToPool).mul(blocksPerYear).div(scaleFactor);
};

export const getTenderAPR = async (deposit: BigNumber) => {
    let tenderTotalCash = tenderCash.add(deposit);
    let oneMinusReserveFactor = scaleFactor.sub(tenderReserveFactorMantissa);

    //borrow
    let util: BigNumber;
    if (tenderBorrows.eq(BigNumber.from(0))) {
        util = BigNumber.from(0);
    } else {
        util = tenderBorrows.mul(scaleFactor).div(tenderTotalCash.add(tenderBorrows).sub(tenderReserves));
    }
    const kink = ethers.utils.parseUnits("95", 16);
    const multiplierPerBlock = BigNumber.from(0);
    let jumpMultiplierPerBlock = BigNumber.from(443482187369);
    let baseRatePerBlock = BigNumber.from(22174109368);
    let borrowRate: BigNumber;
    if (util.lte(kink)) {
        borrowRate = util.mul(multiplierPerBlock).div(scaleFactor).add(baseRatePerBlock);
    } else {
        let normalRate = kink.mul(multiplierPerBlock).div(scaleFactor).add(baseRatePerBlock);
        let excessUtil = util.sub(kink);
        borrowRate = excessUtil.mul(jumpMultiplierPerBlock).div(scaleFactor).add(normalRate);
    }

    let rateToPool = borrowRate.mul(oneMinusReserveFactor).div(scaleFactor);
    let blocksPerYear = BigNumber.from(2628000);

    return util.mul(rateToPool).mul(blocksPerYear).div(scaleFactor);
};

export const getWePiggyAPR = async (deposit: BigNumber) => {
    let wePiggyTotalCash = wePiggyCash.add(deposit);
    let oneMinusReserveFactor = scaleFactor.sub(wePiggyReserveFactorMantissa);

    //borrow
    let util: BigNumber;
    if (wePiggyBorrows.eq(BigNumber.from(0))) {
        util = BigNumber.from(0);
    } else {
        util = wePiggyBorrows.mul(scaleFactor).div(wePiggyTotalCash.add(wePiggyBorrows).sub(wePiggyReserves));
    }
    const kink = ethers.utils.parseUnits("8", 17);
    const multiplierPerBlock = BigNumber.from(23782343987);
    let jumpMultiplierPerBlock = BigNumber.from(1783675799086);
    let baseRatePerBlock = BigNumber.from(0);
    let borrowRate: BigNumber;
    if (util.lte(kink)) {
        borrowRate = util.mul(multiplierPerBlock).div(scaleFactor).add(baseRatePerBlock);
    } else {
        let normalRate = kink.mul(multiplierPerBlock).div(scaleFactor).add(baseRatePerBlock);
        let excessUtil = util.sub(kink);
        borrowRate = excessUtil.mul(jumpMultiplierPerBlock).div(scaleFactor).add(normalRate);
    }

    let rateToPool = borrowRate.mul(oneMinusReserveFactor).div(scaleFactor);
    let blocksPerYear = BigNumber.from(2102400);

    return util.mul(rateToPool).mul(blocksPerYear).div(scaleFactor);
};

export const getCompoundAPR = async (deposit: BigNumber) => {
    const compoundTotalSupply = compoundSupply.add(deposit);
    const compoundUtilization = compoundTotalBorrow.mul(ethers.utils.parseUnits("1", 18)).div(compoundTotalSupply);

    if (compoundUtilization.lt(compoundSupplyKink)) {
        return compoundSupplyPerSecondInterestRateBase
            .add(compoundSupplyPerSecondInterestRateSlopeLow.mul(compoundUtilization))
            .mul(secsInYear)
            .div(scaleFactor);
    } else {
        return compoundSupplyPerSecondInterestRateBase
            .add(compoundSupplyPerSecondInterestRateSlopeLow.mul(compoundSupplyKink))
            .add(compoundSupplyPerSecondInterestRateSlopeHigh.mul(compoundUtilization.sub(compoundSupplyKink)))
            .mul(secsInYear)
            .div(scaleFactor);
    }
};

export const getRequiredDeposit = async (getRate: (x: BigNumber) => Promise<BigNumber>, rate: BigNumber) => {
    let l = ethers.utils.parseUnits("0", 0);
    let r = ethers.utils.parseUnits("1", 15);

    while (r.gt(l)) {
        let mid = l.add(r).div(2);
        if ((await getRate(mid)).gt(rate)) {
            l = mid.add(1);
        } else {
            r = mid.sub(1);
        }
    }
    return l;
};

export const totalDepositRateForTwoProtocols = async (
    getRate1: (x: BigNumber) => Promise<BigNumber>,
    getRate2: (x: BigNumber) => Promise<BigNumber>,
    depositAmount1: BigNumber,
    depositAmount2: BigNumber,
) => {
    const rate1 = await getRate1(depositAmount1);
    const rate2 = await getRate2(depositAmount2);
    const totalAmount = depositAmount1.add(depositAmount2);

    return rate1.mul(depositAmount1).div(totalAmount).add(rate2.mul(depositAmount2).div(totalAmount));
};

function getMostProfitableProtocol(rates: BigNumber[]) {
    if (rates[0].gt(rates[1]) && rates[0].gt(rates[2]) && rates[0].gt(rates[3]) && rates[0].gt(rates[4])) {
        return 0;
    } else if (rates[1].gt(rates[2]) && rates[1].gt(rates[3]) && rates[1].gt(rates[4])) {
        return 1;
    } else if (rates[2].gt(rates[3]) && rates[2].gt(rates[4])) {
        return 2;
    } else if (rates[3].gt(rates[4])) {
        return 3;
    }
    return 4;
}

async function main() {
    [signer] = await ethers.getSigners();

    await initialize();
    //console.log(await getRequiredDeposit(getTenderAPR, ethers.utils.parseUnits("76322580819708939", 0)));
    //console.log(await bigNumberishToNumberWithDecimals(await getTenderAPR(ethers.utils.parseUnits("1000", 6)), 18)); //76322580819708939 7629394531

    let rates: BigNumber[] = [];
    rates.push(await getCompoundAPR(BigNumber.from(0)));
    rates.push(await getWePiggyAPR(BigNumber.from(0)));
    rates.push(await getTenderAPR(BigNumber.from(0)));
    rates.push(await getLodestarAPR(BigNumber.from(0)));
    rates.push(await getDForceAPR(BigNumber.from(0)));

    console.log("Starting rates:");
    console.log(await bigNumberishToNumberWithDecimals(rates[0], 18));
    console.log(await bigNumberishToNumberWithDecimals(rates[1], 18));
    console.log(await bigNumberishToNumberWithDecimals(rates[2], 18));
    console.log(await bigNumberishToNumberWithDecimals(rates[3], 18));
    console.log(await bigNumberishToNumberWithDecimals(rates[4], 18));

    let l = BigNumber.from(0);
    let r = rates[getMostProfitableProtocol(rates)];

    let requiredDeposits: BigNumber[] = [];
    let threshold = ethers.utils.parseUnits("1", 10);
    while (r.gt(l)) {
        requiredDeposits = [];
        let rate = l.add(r).div(2);
        //console.log("trying to make this percent: ", (await bigNumberishToNumberWithDecimals(rate, 18)) * 100);
        requiredDeposits.push(await getRequiredDeposit(getCompoundAPR, rate));
        requiredDeposits.push(await getRequiredDeposit(getWePiggyAPR, rate));
        requiredDeposits.push(await getRequiredDeposit(getTenderAPR, rate));
        requiredDeposits.push(await getRequiredDeposit(getLodestarAPR, rate));
        requiredDeposits.push(await getRequiredDeposit(getDForceAPR, rate));

        //console.log(requiredDeposits);
        let sum: BigNumber = BigNumber.from(0);
        for (let i = 0; i < requiredDeposits.length; i++) {
            sum = sum.add(requiredDeposits[i]);
        }
        //console.log("sum", sum);
        if (sum.gt(totalTokens)) {
            l = rate.add(1);
        } else {
            r = rate;
        }

        // console.log("l", l);
        // console.log("r", r);
    }
    console.log("rate found", await bigNumberishToNumberWithDecimals(l, 18));
    console.log("requiredDeposits", requiredDeposits);

    console.log(await bigNumberishToNumberWithDecimals(await getCompoundAPR(requiredDeposits[0]), 18));
    console.log(await bigNumberishToNumberWithDecimals(await getWePiggyAPR(requiredDeposits[1]), 18));
    console.log(await bigNumberishToNumberWithDecimals(await getTenderAPR(requiredDeposits[2]), 18));
    console.log(await bigNumberishToNumberWithDecimals(await getLodestarAPR(requiredDeposits[3]), 18));
    console.log(await bigNumberishToNumberWithDecimals(await getDForceAPR(requiredDeposits[4]), 18));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
