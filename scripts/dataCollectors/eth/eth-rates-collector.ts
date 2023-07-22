import { ethers } from "hardhat";
import {
    getAAVEV3Rate,
    getRadiantV1Rate,
    getTenderRate,
    getDolomiteRate,
    getWePiggyRate,
    secondsPerYear,
} from "./eth-rates";
import { BigNumber } from "ethers";

const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const path = "./arbitrumTarotETH.csv";

let rates: number[] = [0, 0, 0, 0, 0];

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

async function main() {
    const csvWriter = createCsvWriter({
        path: path,
        header: [
            { id: "block", title: "BLOCK NUMBER" },

            { id: "AAVEV3", title: "AAVEV3 Supply Rate" },
            { id: "Radiant", title: "Radiant Supply Rate" },
            { id: "Tender", title: "Tender Supply Rate" },
            { id: "Dolomite", title: "Dolomite Supply Rate" },
            { id: "WePiggy", title: "WePiggy Supply Rate" },

            { id: "Strategy1", title: "10 minutes rate" },
            { id: "Balance1", title: "10 minutes balance" },

            { id: "Strategy2", title: "20 minutes rate" },
            { id: "Balance2", title: "20 minutes balance" },

            { id: "Strategy3", title: "30 minutes rate" },
            { id: "Balance3", title: "30 minutes balance" },

            { id: "Strategy4", title: "1 hour rate" },
            { id: "Balance4", title: "1 hour balance" },

            { id: "Strategy5", title: "2 hours rate" },
            { id: "Balance5", title: "2 hours balance" },

            { id: "Strategy6", title: "5 hours rate" },
            { id: "Balance6", title: "5 hours balance" },

            { id: "Strategy7", title: "10 hours rate" },
            { id: "Balance7", title: "10 hours balance" },

            { id: "Strategy8", title: "1 day rate" },
            { id: "Balance8", title: "1 day balance" },

            { id: "Strategy9", title: "2 days" },
            { id: "Balance9", title: "2 days balance" },

            { id: "Strategy10", title: "5 days" },
            { id: "Balance10", title: "5 days balance" },
        ],
    });

    let strategy1Balance = 100;
    let strategy2Balance = 100;
    let strategy3Balance = 100;
    let strategy4Balance = 100;
    let strategy5Balance = 100;
    let strategy6Balance = 100;
    let strategy7Balance = 100;
    let strategy8Balance = 100;
    let strategy9Balance = 100;
    let strategy10Balance = 100;

    let notClaimed1 = 0;
    let notClaimed2 = 0;
    let notClaimed3 = 0;
    let notClaimed4 = 0;
    let notClaimed5 = 0;
    let notClaimed6 = 0;
    let notClaimed7 = 0;
    let notClaimed8 = 0;
    let notClaimed9 = 0;
    let notClaimed10 = 0;

    let strategy1Placement = 0;
    let strategy2Placement = 0;
    let strategy3Placement = 0;
    let strategy4Placement = 0;
    let strategy5Placement = 0;
    let strategy6Placement = 0;
    let strategy7Placement = 0;
    let strategy8Placement = 0;
    let strategy9Placement = 0;
    let strategy10Placement = 0;

    let prevTimestamp = (await ethers.provider.getBlock(57012900)).timestamp;
    let currentTimestamp = prevTimestamp;

    for (
        let i = 0, currentBlockNumber = 57012900;
        currentBlockNumber <= 65580900;
        i += 1, currentBlockNumber = 57012900 + i * 1983
    ) {
        prevTimestamp = currentTimestamp;
        currentTimestamp = (await ethers.provider.getBlock(currentBlockNumber))
            .timestamp;

        rates[0] =
            BigNumber.from(await getAAVEV3Rate(currentBlockNumber))
                .div(1e6)
                .toNumber() / 1e12;

        rates[1] =
            BigNumber.from(await getRadiantV1Rate(currentBlockNumber))
                .div(1e6)
                .toNumber() / 1e12;

        rates[2] =
            BigNumber.from(await getTenderRate(currentBlockNumber))
                .div(1e6)
                .toNumber() / 1e12;
        rates[3] =
            BigNumber.from(await getDolomiteRate(currentBlockNumber))
                .div(1e6)
                .toNumber() / 1e12;

        rates[4] =
            BigNumber.from(await getWePiggyRate(currentBlockNumber))
                .div(1e6)
                .toNumber() / 1e12;
        if (i % 1 == 0) {
            strategy1Balance += notClaimed1;
            notClaimed1 = 0;
            strategy1Placement = getMostProfitableStrategy();
        }
        if (i % 2 == 0) {
            strategy2Balance += notClaimed2;
            notClaimed2 = 0;
            strategy2Placement = getMostProfitableStrategy();
        }
        if (i % 3 == 0) {
            strategy3Balance += notClaimed3;
            notClaimed3 = 0;
            strategy3Placement = getMostProfitableStrategy();
        }
        if (i % 6 == 0) {
            strategy4Balance += notClaimed4;
            notClaimed4 = 0;
            strategy4Placement = getMostProfitableStrategy();
        }
        if (i % 12 == 0) {
            strategy5Balance += notClaimed5;
            notClaimed5 = 0;
            strategy5Placement = getMostProfitableStrategy();
        }
        if (i % 30 == 0) {
            strategy6Balance += notClaimed6;
            notClaimed6 = 0;
            strategy6Placement = getMostProfitableStrategy();
        }
        if (i % 60 == 0) {
            strategy7Balance += notClaimed7;
            notClaimed7 = 0;
            strategy7Placement = getMostProfitableStrategy();
        }
        if (i % 144 == 0) {
            strategy8Balance += notClaimed8;
            notClaimed8 = 0;
            strategy8Placement = getMostProfitableStrategy();
        }
        if (i % 288 == 0) {
            strategy9Balance += notClaimed9;
            notClaimed9 = 0;
            strategy9Placement = getMostProfitableStrategy();
        }
        if (i % 780 == 0) {
            strategy10Balance += notClaimed10;
            notClaimed10 = 0;
            strategy10Placement = getMostProfitableStrategy();
        }

        notClaimed1 +=
            strategy1Balance *
            (currentTimestamp - prevTimestamp) *
            rates[strategy1Placement];
        notClaimed2 +=
            strategy2Balance *
            (currentTimestamp - prevTimestamp) *
            rates[strategy2Placement];
        notClaimed3 +=
            strategy3Balance *
            (currentTimestamp - prevTimestamp) *
            rates[strategy3Placement];
        notClaimed4 +=
            strategy4Balance *
            (currentTimestamp - prevTimestamp) *
            rates[strategy4Placement];
        notClaimed5 +=
            strategy5Balance *
            (currentTimestamp - prevTimestamp) *
            rates[strategy5Placement];
        notClaimed6 +=
            strategy6Balance *
            (currentTimestamp - prevTimestamp) *
            rates[strategy6Placement];
        notClaimed7 +=
            strategy7Balance *
            (currentTimestamp - prevTimestamp) *
            rates[strategy7Placement];
        notClaimed8 +=
            strategy8Balance *
            (currentTimestamp - prevTimestamp) *
            rates[strategy8Placement];
        notClaimed9 +=
            strategy9Balance *
            (currentTimestamp - prevTimestamp) *
            rates[strategy9Placement];
        notClaimed10 +=
            strategy10Balance *
            (currentTimestamp - prevTimestamp) *
            rates[strategy10Placement];

        const records = [
            {
                block: currentBlockNumber,
                AAVEV3: rates[0] * secondsPerYear * 100,
                Radiant: rates[1] * secondsPerYear * 100,
                Tender: rates[2] * secondsPerYear * 100,
                Dolomite: rates[3] * secondsPerYear * 100,
                WePiggy: rates[4] * secondsPerYear * 100,

                Strategy1: strategy1Placement + 1,
                Balance1: strategy1Balance + notClaimed1,

                Strategy2: strategy2Placement + 1,
                Balance2: strategy2Balance + notClaimed2,

                Strategy3: strategy3Placement + 1,
                Balance3: strategy3Balance + notClaimed3,

                Strategy4: strategy4Placement + 1,
                Balance4: strategy4Balance + notClaimed4,

                Strategy5: strategy5Placement + 1,
                Balance5: strategy5Balance + notClaimed5,

                Strategy6: strategy6Placement + 1,
                Balance6: strategy6Balance + notClaimed6,

                Strategy7: strategy7Placement + 1,
                Balance7: strategy7Balance + notClaimed7,

                Strategy8: strategy8Placement + 1,
                Balance8: strategy8Balance + notClaimed8,

                Strategy9: strategy9Placement + 1,
                Balance9: strategy9Balance + notClaimed9,

                Strategy10: strategy10Placement + 1,
                Balance10: strategy10Balance + notClaimed10,
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
