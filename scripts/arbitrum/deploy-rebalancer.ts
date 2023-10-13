import {ethers} from "hardhat";
import {BigNumber} from "ethers";
import {Rebalancer__factory} from "../../typechain-types";

let assets: string[] = [
    "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9", //USDT
    "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8", //USDC.e
    "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f", //wBTCH
    "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", //WETH
    "0x912CE59144191C1204E64559FE8253a0e49E6548", //ARB
];
let names: string[] = ["Promethium USDT", "Promethium USDC.e", "Promethium WBTC", "Promethium WETH", "Promethium ARB"];
let symbols: string[] = ["pmUSDT", "pmUSDC.e", "pmWBTC", "pmWETH", "pmARB"];
let rebalanceProviders: string[] = [
    "0xD7750516aA8D2222a1D39325D3F98e6559D3f6fB",
    "0xad0faD73555300e94CE55936c002678E90358452",
    "0xb208236b0aF462bA1b807433078944691336f9e5",
    "0x2E4b3E38ed653F2822874E49A65Ff358BC7550fF",
    "0x4662a93C091509ac3e392941F30CAe0Fb9Bb8b43",
];

let protocols: string[][] = [
    [
        "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
        "0xF4B1486DD74D07706052A33d31d7c0AAFD0659E1",
        "0x102442A3BA1e441043154Bc0B8A2e2FB5E0F94A7",
        "0xB65Ab7e1c6c1Ba202baed82d6FB71975D56F007C",
        "0x9365181A7df82a1cC578eAE443EFd89f00dbb643",
        "0xf52f079Af080C9FB5AFCA57DDE0f8B83d49692a9",
        "0x4A5806A3c4fBB32F027240F80B18b26E40BF7E31",
    ],
    [
        "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
        "0xF4B1486DD74D07706052A33d31d7c0AAFD0659E1",
        "0x102442A3BA1e441043154Bc0B8A2e2FB5E0F94A7",
        "0x2Bf852e22C92Fd790f4AE54A76536c8C4217786b",
        "0x1ca530f02DD0487cef4943c674342c5aEa08922F",
        "0x8dc3312c68125a94916d62B97bb5D925f84d4aE0",
        "0xa5edbdd9646f8dff606d7448e414884c7d905dca",
        "0x068485a0f964B4c3D395059a19A05a8741c48B4E",
    ],
    [
        "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
        "0xF4B1486DD74D07706052A33d31d7c0AAFD0659E1",
        "0x102442A3BA1e441043154Bc0B8A2e2FB5E0F94A7",
        "0x3393cD223f59F32CC0cC845DE938472595cA48a1",
        "0xC37896BF3EE5a2c62Cdbd674035069776f721668",
        "0xD3204E4189BEcD9cD957046A8e4A643437eE0aCC",
        "0x0A2f8B6223EB7DE26c810932CCA488A4936cF391",
    ],
    [
        "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
        "0xF4B1486DD74D07706052A33d31d7c0AAFD0659E1",
        "0x242f91207184FCc220beA3c9E5f22b6d80F3faC5", //weth
    ],
    [
        "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
        "0xF4B1486DD74D07706052A33d31d7c0AAFD0659E1",
        "0xD037c36dbc81a8890728D850E080e38F6EeB95EF", //arb
        "0x102442A3BA1e441043154Bc0B8A2e2FB5E0F94A7",
        "0x8991d64fe388fA79A4f7Aa7826E8dA09F0c3C96a",
        "0xC6121d58E01B3F5C88EB8a661770DB0046523539",
    ],
];

const protocolSelectors = [
    [
        {
            // Aave V3
            deposit: "0xe8eda9df",
            withdraw: "0x69328dec",
        },
        {
            deposit: "0xe8eda9df",
            withdraw: "0x69328dec",
        },
        {
            deposit: "0xe8eda9df",
            withdraw: "0x69328dec",
        },
        {
            // WePiggy
            deposit: "0xa0712d68",
            withdraw: "0x852a12e3",
        },
        {
            deposit: "0xa0712d68",
            withdraw: "0x852a12e3",
        },
        {
            // dForce
            deposit: "0x40c10f19",
            withdraw: "0x96294178",
        },
        {
            deposit: "0xa0712d68",
            withdraw: "0x852a12e3",
        },
    ],
    [
        {
            // Aave V3
            deposit: "0xe8eda9df",
            withdraw: "0x69328dec",
        },
        {
            deposit: "0xe8eda9df",
            withdraw: "0x69328dec",
        },
        {
            deposit: "0xe8eda9df",
            withdraw: "0x69328dec",
        },
        {
            // WePiggy
            deposit: "0xa0712d68",
            withdraw: "0x852a12e3",
        },
        {
            deposit: "0xa0712d68",
            withdraw: "0x852a12e3",
        },
        {
            // dForce
            deposit: "0x40c10f19",
            withdraw: "0x96294178",
        },
        {
            // Compound
            deposit: "0xf2b9fdb8",
            withdraw: "0xf3fef3a3",
        },
        {
            deposit: "0xa0712d68",
            withdraw: "0x852a12e3",
        },
    ],
    [
        {
            // Aave V3
            deposit: "0xe8eda9df",
            withdraw: "0x69328dec",
        },
        {
            deposit: "0xe8eda9df",
            withdraw: "0x69328dec",
        },
        {
            deposit: "0xe8eda9df",
            withdraw: "0x69328dec",
        },
        {
            // WePiggy
            deposit: "0xa0712d68",
            withdraw: "0x852a12e3",
        },
        {
            deposit: "0xa0712d68",
            withdraw: "0x852a12e3",
        },
        {
            // dForce
            deposit: "0x40c10f19",
            withdraw: "0x96294178",
        },
        {
            deposit: "0xa0712d68",
            withdraw: "0x852a12e3",
        },
    ],
    [
        {
            // Aave V3
            deposit: "0xe8eda9df",
            withdraw: "0x69328dec",
        },
        {
            deposit: "0xe8eda9df",
            withdraw: "0x69328dec",
        },
        {
            deposit: "0xa0712d68",
            withdraw: "0x852a12e3",
        },
    ],
    [
        {
            // Aave V3
            deposit: "0xe8eda9df",
            withdraw: "0x69328dec",
        },
        {
            deposit: "0xe8eda9df",
            withdraw: "0x69328dec",
        },
        {
            // dForce
            deposit: "0x40c10f19",
            withdraw: "0x96294178",
        },
        {
            deposit: "0xe8eda9df",
            withdraw: "0x69328dec",
        },
        {
            deposit: "0xa0712d68",
            withdraw: "0x852a12e3",
        },
        {
            deposit: "0xa0712d68",
            withdraw: "0x852a12e3",
        },
    ],
];

let ibTokens: string[][] = [
    [
        "0xd69d402d1bdb9a2b8c3d88d98b9ceaf9e4cd72d9",
        "0xf52f079Af080C9FB5AFCA57DDE0f8B83d49692a9",
        "0xB65Ab7e1c6c1Ba202baed82d6FB71975D56F007C",
        "0x66ddD8F3A0C4CEB6a324376EA6C00B4c8c1BB3d9",
        "0x6ab707aca953edaefbc4fd23ba73294241490620",
        "0x9365181A7df82a1cC578eAE443EFd89f00dbb643",
        "0x4A5806A3c4fBB32F027240F80B18b26E40BF7E31",
    ],
    [
        "0x48a29e756cc1c097388f3b2f3b570ed270423b3d",
        "0x8dc3312c68125a94916d62B97bb5D925f84d4aE0",
        "0x2Bf852e22C92Fd790f4AE54A76536c8C4217786b",
        "0x6C4CB1115927D50E495E554d38b83f2973F05361",
        "0x625E7708f30cA75bfd92586e17077590C60eb4cD",
        "0xa5edbdd9646f8dff606d7448e414884c7d905dca",
        "0x1ca530f02DD0487cef4943c674342c5aEa08922F",
        "0x068485a0f964B4c3D395059a19A05a8741c48B4E",
    ],
    [
        "0x078f358208685046a11C85e8ad32895DED33A249",
        "0x727354712BDFcd8596a3852Fd2065b3C34F4F770",
        "0x731e2246A0c67b1B19188C7019094bA9F107404f",
        "0x3393cD223f59F32CC0cC845DE938472595cA48a1",
        "0xC37896BF3EE5a2c62Cdbd674035069776f721668",
        "0xD3204E4189BEcD9cD957046A8e4A643437eE0aCC",
        "0x0A2f8B6223EB7DE26c810932CCA488A4936cF391",
    ],
    [
        "0x0dF5dfd95966753f01cb80E76dc20EA958238C46",
        "0xe50fA9b3c56FfB159cB0FCA61F5c9D750e8128c8",
        "0x242f91207184FCc220beA3c9E5f22b6d80F3faC5",
    ],
    [
        "0x2dADe5b7df9DA3a7e1c9748d169Cd6dFf77e3d01",
        "0xD037c36dbc81a8890728D850E080e38F6EeB95EF",
        "0x8B9a4ded05ad8C3AB959980538437b0562dBb129",
        "0x6533afac2e7bccb20dca161449a13a32d391fb00",
        "0x8991d64fe388fA79A4f7Aa7826E8dA09F0c3C96a",
        "0xC6121d58E01B3F5C88EB8a661770DB0046523539",
    ],
];

let poolLimits: BigNumber[] = [
    ethers.utils.parseUnits("5000", 6), //5000 USDT
    ethers.utils.parseUnits("5000", 6), //5000 USDC
    ethers.utils.parseUnits("3", 17), //0.3 WBTC
    ethers.utils.parseUnits("3", 18), //3 WETH
    ethers.utils.parseUnits("5000", 18), //5000 ARB
];

let priceRouter: string = "0x92e69cc96ae8b61161bee4a567256be501140350";

async function main() {
    const [signer] = await ethers.getSigners();
    for (let i = 0; i < assets.length; i++) {
        const rebalancer = await new Rebalancer__factory(signer).deploy(
            assets[i],
            names[i],
            symbols[i],
            protocols[i],
            protocolSelectors[i],
            ibTokens[i],
            rebalanceProviders[i],
            priceRouter,
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
