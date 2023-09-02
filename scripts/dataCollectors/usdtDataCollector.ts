import {ethers, upgrades} from "hardhat";
import {BigNumber} from "ethers";
import {
    AAVEV3__factory,
    ICompound__factory,
    Idforce__factory,
    IGranary__factory,
    ILodestar__factory,
    IRadiantV2__factory,
    ITender__factory,
    IWePiggy__factory,
} from "../../typechain-types";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const path = "./arbAugust_5-19.csv";

let signer: SignerWithAddress;
const secsInYear = 60 * 60 * 24 * 365;

let startBlock: number = 118421395;
let finishBlock: number = 122943700;
let blockDistance = 2243;

let rates: number[] = [0, 0, 0, 0, 0, 0, 0];

export const getAAVEAPR = async (
    blockNumber?: number,
    contractAddress: string = "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    asset: string = "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
) => {
    const contract = AAVEV3__factory.connect(contractAddress, signer);

    const apr = (await contract.getReserveData(asset, {blockTag: blockNumber}))[2];
    const decimals = BigNumber.from(10).pow(27);

    const before = apr.div(decimals).toString();
    const after = apr.mod(decimals).toString();
    return parseFloat(before + "." + "0".repeat(27 - after.length) + after);
};

export const getDForceAPR = async (
    blockNumber?: number,
    contractAddress: string = "0xf52f079Af080C9FB5AFCA57DDE0f8B83d49692a9",
    asset: string = "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
) => {
    const contract = Idforce__factory.connect(contractAddress, signer);

    const apr = (await contract.supplyRatePerBlock({blockTag: blockNumber})).mul(secsInYear).div(13);

    return bigNumberishToNumberWithDecimals(apr, 18);
};

export const getGranaryAPR = async (
    blockNumber?: number,
    contractAddress: string = "0x102442A3BA1e441043154Bc0B8A2e2FB5E0F94A7",
    asset: string = "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
) => {
    const contract = IGranary__factory.connect(contractAddress, signer);

    const apr = (await contract.getReserveData(asset, {blockTag: blockNumber}))[3];

    const decimals = BigNumber.from(10).pow(27);

    const before = apr.div(decimals).toString();
    const after = apr.mod(decimals).toString();

    return parseFloat(before + "." + "0".repeat(27 - after.length) + after);
};

export const getLodestarAPR = async (
    blockNumber?: number,
    contractAddress: string = "0x9365181A7df82a1cC578eAE443EFd89f00dbb643",
    asset: string = "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
) => {
    const contract = ILodestar__factory.connect(contractAddress, signer);

    const apr = (await contract.supplyRatePerBlock({blockTag: blockNumber})).mul(secsInYear).div(12);

    return bigNumberishToNumberWithDecimals(apr, 18);
};

export const getRadiantV2APR = async (
    blockNumber?: number,
    contractAddress: string = "0xF4B1486DD74D07706052A33d31d7c0AAFD0659E1",
    asset: string = "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
) => {
    const contract = IRadiantV2__factory.connect(contractAddress, signer);

    const apr = (await contract.getReserveData(asset, {blockTag: blockNumber}))[3];

    const decimals = BigNumber.from(10).pow(27);

    const before = apr.div(decimals).toString();
    const after = apr.mod(decimals).toString();

    return parseFloat(before + "." + "0".repeat(27 - after.length) + after);
};

export const getTenderAPR = async (
    blockNumber?: number,
    contractAddress: string = "0x4A5806A3c4fBB32F027240F80B18b26E40BF7E31",
) => {
    const contract = ITender__factory.connect(contractAddress, signer);

    const apr = (await contract.supplyRatePerBlock({blockTag: blockNumber})).mul(secsInYear).div(12);

    return bigNumberishToNumberWithDecimals(apr, 18);
};

export const getWePiggyAPR = async (
    blockNumber?: number,
    contractAddress: string = "0xB65Ab7e1c6c1Ba202baed82d6FB71975D56F007C",
) => {
    const contract = IWePiggy__factory.connect(contractAddress, signer);

    const apr = (await contract.supplyRatePerBlock({blockTag: blockNumber})).mul(secsInYear).div(15);

    return bigNumberishToNumberWithDecimals(apr, 18);
};

export const bigNumberishToNumberWithDecimals = async (apr: BigNumber, _decimals: number) => {
    const decimals = BigNumber.from(10).pow(_decimals);

    const before = apr.div(decimals).toString();
    const after = apr.mod(decimals).toString();

    return parseFloat(before + "." + "0".repeat(_decimals - after.length) + after);
};

function convertToAPY(apr: number) {
    let numberOfPeriods = 8760;
    return (1 + apr / numberOfPeriods) ** numberOfPeriods - 1;
}

function getMostProfitableStrategy() {
    let greatestRate = 0;
    let greatestIndex = 0;
    for (let i = 0; i < rates.length; i++) {
        if (greatestRate <= rates[i]) {
            greatestRate = rates[i];
            greatestIndex = i;
        }
    }
    return greatestIndex;
}

function getProtocolName(protocolId: number) {
    if (protocolId == 0) return "AAVEV3";
    else if (protocolId == 1) return "DFORCE";
    else if (protocolId == 2) return "GRANARY";
    else if (protocolId == 3) return "LODESTAR";
    else if (protocolId == 4) return "RADIANTV2";
    else if (protocolId == 5) return "TENDER";
    else if (protocolId == 6) return "WEPIGGY";
}

const csvWriter = createCsvWriter({
    path: path,
    header: [
        {id: "block", title: "BLOCK NUMBER"},

        {id: "AAVEV3", title: "AAVEV3 Supply APY"},
        {id: "dForce", title: "dForce Supply APY"},
        {id: "Granary", title: "Granary Supply APY"},
        {id: "Lodestar", title: "Lodestar Supply APY"},
        {id: "RadiantV2", title: "RadiantV2 Supply APY"},
        {id: "Tender", title: "Tender Supply APY"},
        {id: "WePiggy", title: "WePiggy Supply APY"},

        {id: "balance", title: "protocol balance"},
        {id: "placement", title: "Protocol placement"},
    ],
});

async function main() {
    [signer] = await ethers.getSigners();

    let prevTimestamp = (await ethers.provider.getBlock(startBlock)).timestamp;
    let currentTimestamp = prevTimestamp;

    let rebalancerBalance = 100;
    let rebalancerPlacement = 0;

    for (
        let i = 0, currentBlockNumber = startBlock;
        currentBlockNumber <= finishBlock;
        i += 1, currentBlockNumber += blockDistance
    ) {
        prevTimestamp = currentTimestamp;
        currentTimestamp = (await ethers.provider.getBlock(currentBlockNumber)).timestamp;

        rates[0] = await getAAVEAPR(currentBlockNumber);

        rates[1] = await getDForceAPR(currentBlockNumber);

        rates[2] = await getGranaryAPR(currentBlockNumber);

        rates[3] = await getLodestarAPR(currentBlockNumber);

        rates[4] = await getRadiantV2APR(currentBlockNumber);

        rates[5] = await getTenderAPR(currentBlockNumber);

        rates[6] = await getWePiggyAPR(currentBlockNumber);

        if (i % 6 == 0) {
            rebalancerPlacement = getMostProfitableStrategy();
        }

        rebalancerBalance +=
            rebalancerBalance *
            ((currentTimestamp - prevTimestamp) * (rates[rebalancerPlacement] / 365 / 24 / 60 / 60));

        const records = [
            {
                block: currentBlockNumber,
                AAVEV3: convertToAPY(rates[0]) * 100,
                dForce: convertToAPY(rates[1]) * 100,
                Granary: convertToAPY(rates[2]) * 100,
                Lodestar: convertToAPY(rates[3]) * 100,
                RadiantV2: convertToAPY(rates[4]) * 100,
                Tender: convertToAPY(rates[5]) * 100,
                WePiggy: convertToAPY(rates[6]) * 100,

                balance: rebalancerBalance,
                placement: getProtocolName(rebalancerPlacement),
            },
        ];
        csvWriter.writeRecords(records);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
