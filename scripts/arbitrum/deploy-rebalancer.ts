import {ethers} from "hardhat";
import {Rebalancer__factory} from "../../typechain-types";

let assets: string[] = [
    "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9", //USDT
    "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8", //USDC.e
    "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f", //wBTCH
    "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", //WETH
    "0x912CE59144191C1204E64559FE8253a0e49E6548", //ARB
];
let names: string[] = ["Promethium USDT", "Promethium USDC.e", "Promethium WBTC", "Promethium WETH", "Promethium ARB"];
let symbols: string[] = ["pmUSDT", "pmUSDC", "pmWBTC", "pmWETH", "pmARB"];
let teamAddresses: string[] = [];

let protocols: string[][] = [
    [
        //usdt
    ],
    [
        //usdc.e
    ],
    [
        //wbtc
    ],
    [
        //weth
    ],
    [
        //arb
    ],
];

let ibTokens: string[][] = [[], [], [], [], []];

let whitelist: string[][] = [[], [], [], [], []];
let poolLimits: number[] = [];

let priceRouter: string = "0x946de3103Da9E309154778ab484a2ae7511DeecB";

async function main() {
    for (let i = 0; i < assets.length; i++) {
        const [signer] = await ethers.getSigners();
        let positions = protocols[i];
        positions.push(assets[i]);
        let protocolIbTokens = ibTokens[i];

        const rebalancer = await new Rebalancer__factory(signer).deploy(
            assets[i],
            names[i],
            symbols[i],
            positions,
            protocolIbTokens,
            teamAddresses[i],
            teamAddresses[i],
            priceRouter,
            whitelist[i],
            poolLimits[i],
        );

        console.log(names[i]);
        console.log(rebalancer.address);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
