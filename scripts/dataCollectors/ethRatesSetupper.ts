import { ethers } from "hardhat";
import { CreditProtocol__factory } from "../../typechain-types";
import { setTimeout } from "timers/promises";
import * as dotenv from "dotenv";
import {
    getAAVEV3Rate,
    getRadiantV2Rate,
    getTenderRate,
    getDolomiteRate,
    getWePiggyRate,
} from "./ethRates";

dotenv.config();

let creditProtocolAddresses = [
    "0x49cbf64218136dCf59a2D7853121Af01423115e3",
    "0x6C53a1cBFB5C84378d46c445BC6955925C265a52",
    "0x335eeEf8B9E597f8c6280F44326712883d0f7b3c",
    "0xdea3f4369A52FcAB8a472685dd8B97A34F0d00FE",
    "0xea1e4A13B34eEA9A6655844fFbe8256322eD13Fc",
];

async function main() {
    let url = `https://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_PROJECT_ID}`;
    let customHttpProvider = new ethers.providers.JsonRpcProvider(url);
    let privateKey = process.env.PRIVATE_KEY!;

    const signer = new ethers.Wallet(privateKey, customHttpProvider);

    let mock1 = CreditProtocol__factory.connect(
        creditProtocolAddresses[0],
        signer
    );
    let mock2 = CreditProtocol__factory.connect(
        creditProtocolAddresses[1],
        signer
    );
    let mock3 = CreditProtocol__factory.connect(
        creditProtocolAddresses[2],
        signer
    );
    let mock4 = CreditProtocol__factory.connect(
        creditProtocolAddresses[3],
        signer
    );
    let mock5 = CreditProtocol__factory.connect(
        creditProtocolAddresses[4],
        signer
    );

    let currentBlockNumber = (await ethers.provider.getBlock("latest")).number;
    for (let i = 57012900; i <= 65580900; i += 1983) {
        i = currentBlockNumber;
        let aaveRates = await getAAVEV3Rate(i);
        let radiantV2Rate = 0; //await getRadiantV2Rate(i);
        let tenderRates = await getTenderRate(i);
        let dolomiteRates = await getDolomiteRate(i);
        let wePiggyRates = await getWePiggyRate(i);

        await mock1.setSupplyRatePerSecond(aaveRates);
        await mock2.setSupplyRatePerSecond(radiantV2Rate);
        await mock3.setSupplyRatePerSecond(tenderRates);
        await mock4.setSupplyRatePerSecond(dolomiteRates);
        await mock5.setSupplyRatePerSecond(wePiggyRates);

        console.log("New rates:");
        console.log(aaveRates);
        console.log(radiantV2Rate);
        console.log(tenderRates);
        console.log(dolomiteRates);
        console.log(wePiggyRates);

        await setTimeout(600000);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
