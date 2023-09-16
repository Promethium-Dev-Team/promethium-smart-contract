import {ethers, upgrades} from "hardhat";
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

let totalTokens = ethers.utils.parseUnits("1000", 6);

let bestAllocations: number[] | null = null;
let bestRate: number = 0;

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
    const dForceTotalCash = dForceCash.add(deposit);

    const dForceBorrowAPR = await DForceModel.getBorrowRate(dForceTotalCash, dForceBorrows, dForceReserves);
    return bigNumberishToNumberWithDecimals(
        dForceBorrowAPR
            .mul(scaleFactor.sub(dForceReserveFactorMantissa))
            .mul(dForceBorrows)
            .div(dForceUnderlying)
            .mul(secsInYear)
            .div(13),
        18,
    );
};

export const getLodestarAPR = async (deposit: BigNumber) => {
    const lodestarTotalCash = lodestarCash.add(deposit);

    return bigNumberishToNumberWithDecimals(
        (
            await lodestarModel.getSupplyRate(
                lodestarTotalCash,
                lodestarBorrows,
                lodestarReserves,
                lodestarReserveFactorMantissa,
            )
        )
            .mul(secsInYear)
            .div(12),
        18,
    );
};

export const getTenderAPR = async (deposit: BigNumber) => {
    const tenderTotalCash = tenderCash.add(deposit);
    return bigNumberishToNumberWithDecimals(
        (await tenderModel.getSupplyRate(tenderTotalCash, tenderBorrows, tenderReserves, tenderReserveFactorMantissa))
            .mul(secsInYear)
            .div(12),
        18,
    );
};

export const getWePiggyAPR = async (deposit: BigNumber) => {
    const wePiggyTotalCash = wePiggyCash.add(deposit);

    return bigNumberishToNumberWithDecimals(
        (
            await wePiggyModel.getSupplyRate(
                wePiggyTotalCash,
                wePiggyBorrows,
                wePiggyReserves,
                wePiggyReserveFactorMantissa,
            )
        )
            .mul(secsInYear)
            .div(15),
        18,
    );
};

export const getCompoundRate = async (deposit: BigNumber) => {
    const compoundTotalSupply = compoundSupply.add(deposit);
    const compoundUtilization = compoundTotalBorrow.mul(ethers.utils.parseUnits("1", 18)).div(compoundTotalSupply);

    if (compoundUtilization < compoundSupplyKink) {
        return bigNumberishToNumberWithDecimals(
            compoundSupplyPerSecondInterestRateBase
                .add(compoundSupplyPerSecondInterestRateSlopeLow.mul(compoundUtilization))
                .mul(secsInYear)
                .div(scaleFactor),
            18,
        );
    } else {
        return bigNumberishToNumberWithDecimals(
            compoundSupplyPerSecondInterestRateBase
                .add(compoundSupplyPerSecondInterestRateSlopeLow.mul(compoundSupplyKink))
                .add(compoundSupplyPerSecondInterestRateSlopeHigh.mul(compoundUtilization.sub(compoundSupplyKink)))
                .mul(secsInYear)
                .div(scaleFactor),
            18,
        );
    }
};

export const totalDepositRate = async (allocations: BigNumber[]) => {
    const rate0: number = await getCompoundRate(allocations[0]);
    const rate1: number = await getWePiggyAPR(allocations[1]);
    const rate2: number = await getTenderAPR(allocations[2]);
    const rate3: number = await getLodestarAPR(allocations[3]);
    const rate4: number = await getDForceAPR(allocations[4]);

    return (
        (rate0 * Number(allocations[0])) / Number(totalTokens) +
        (rate1 * Number(allocations[1])) / Number(totalTokens) +
        (rate2 * Number(allocations[2])) / Number(totalTokens) +
        (rate3 * Number(allocations[3])) / Number(totalTokens) +
        (rate4 * Number(allocations[4])) / Number(totalTokens)
    );
};

export const totalDepositRateForTwoProtocols = async (
    getRate1: (x: BigNumber) => number,
    getRate2: (x: BigNumber) => number,
    depositAmount1: BigNumber,
    depositAmount2: BigNumber,
) => {
    const rate1 = getRate1(depositAmount1);
    const rate2 = getRate2(depositAmount2);
    const totalAmount = depositAmount1.add(depositAmount2);

    return (
        (rate1 * Number(depositAmount1)) / Number(totalAmount) + (rate2 * Number(depositAmount2)) / Number(totalAmount)
    );
};
export const binSearch = async (
    getRate1: (x: BigNumber) => number,
    getRate2: (x: BigNumber) => number,
    totalBalance: BigNumber,
) => {
    let lowerBound = 0;
    let upperBoundProtocol1 = Number(totalBalance);
    let upperBoundProtocol2 = Number(totalBalance);

    // Set the precision for the binary search
    const precision = 1;

    // Perform binary search to find the optimal deposit amounts
    while (upperBoundProtocol1 - lowerBound > precision) {
        const midProtocol1 = (lowerBound + upperBoundProtocol1) / 2;
        const midProtocol2 = (lowerBound + upperBoundProtocol2) / 2;

        const rateAtMid = totalDepositRateForTwoProtocols(getRate1, getRate2, midProtocol1, midProtocol2);
        const rateAtMidPrev = totalDepositRateForTwoProtocols(midProtocol1 - precision, midProtocol2 - precision);

        if (rateAtMid > rateAtMidPrev) {
            lowerBound = midProtocol1 - precision;
            lowerBound = midProtocol2 - precision;
        } else {
            upperBoundProtocol1 = midProtocol1 + precision;
            upperBoundProtocol2 = midProtocol2 + precision;
        }
    }
};
async function main() {
    [signer] = await ethers.getSigners();

    await initialize();

    console.log((await getCompoundRate(BigNumber.from(0))) * 100);
    console.log((await getWePiggyAPR(BigNumber.from(0))) * 100);
    console.log((await getTenderAPR(BigNumber.from(0))) * 100);
    console.log((await getLodestarAPR(BigNumber.from(0))) * 100);
    console.log((await getDForceAPR(BigNumber.from(0))) * 100);

    let allocations: BigNumber[] = [
        totalTokens,
        BigNumber.from(0),
        BigNumber.from(0),
        BigNumber.from(0),
        BigNumber.from(0),
    ];
    let prevAllocations: BigNumber[] = [];

    while (allocations != prevAllocations) {}
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
