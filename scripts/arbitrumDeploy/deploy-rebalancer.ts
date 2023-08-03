import { ethers } from "hardhat";
import { Rebalancer__factory } from "../../typechain-types";

let assets: string[] = [
  "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9", //USDT
  "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8", //USDC.e
  "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f", //wBTCH
  "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", //WETH
  "0x912CE59144191C1204E64559FE8253a0e49E6548", //ARB
];
let names: string[] = [
  "RebalancerUSDT",
  "RebalancerUSDC.e",
  "RebalancerWBTC",
  "RebalancerWETH",
  "RebalancerARB",
];
let symbols: string[] = [
  "sUSDT",
  "sUSDC.e",
  "sWBTC",
  "sWETH",
  "sARB",
];
let teamAddresses: string[] = [
  "0x0ba2AdA8c803e85f1881E60B4Ad04C2962089956",
  "0x993Ad4736DF9571DD096Afb303A7d4e6564A46F6",
  "0xA5Cfa0f18A20fbcA7086455D0924d4b8889928b7",
  "0x42C5D707723ba35f56A216E5C2E61b9e7026b0F6",
  "0x72135d887C0d8B7fFb89799de75D718D800f4B99"
];

let treasury: string = "0xBAD3866bE77aedBD8C559Ad0A74dBad95161592e";

let protocols: string[][] = [
  [
    "0xF4B1486DD74D07706052A33d31d7c0AAFD0659E1" //usdt
  ],
  [
    "0xF4B1486DD74D07706052A33d31d7c0AAFD0659E1" //usdc.e
  ],
  [
    "0xF4B1486DD74D07706052A33d31d7c0AAFD0659E1" //wbtc
  ],
  [
    "0xF4B1486DD74D07706052A33d31d7c0AAFD0659E1" //weth
  ],
  [
    "0xF4B1486DD74D07706052A33d31d7c0AAFD0659E1" //arb
  ]
];

let ibTokens: string[][] = [
  [
    "0xd69d402d1bdb9a2b8c3d88d98b9ceaf9e4cd72d9",
    "0xf52f079Af080C9FB5AFCA57DDE0f8B83d49692a9",
    "0xB65Ab7e1c6c1Ba202baed82d6FB71975D56F007C"
  ],
  [
    "0x48a29e756cc1c097388f3b2f3b570ed270423b3d",
    "0x8dc3312c68125a94916d62B97bb5D925f84d4aE0",
    "0x2Bf852e22C92Fd790f4AE54A76536c8C4217786b"
  ],
  [
    "0x727354712BDFcd8596a3852Fd2065b3C34F4F770",
    "0xD3204E4189BEcD9cD957046A8e4A643437eE0aCC",
    "0x3393cD223f59F32CC0cC845DE938472595cA48a1"
  ],
  [
    "0x0dF5dfd95966753f01cb80E76dc20EA958238C46",
    "0x17933112E9780aBd0F27f2B7d9ddA9E840D43159"
  ],
  [
    "0x2dADe5b7df9DA3a7e1c9748d169Cd6dFf77e3d01",
    "0x912CE59144191C1204E64559FE8253a0e49E6548"
  ]
];

async function main() {
  for (let i = 0; i < assets.length; i++) {
    const [signer] = await ethers.getSigners();
    let positions = protocols[i];
    let protocolIbTokens = ibTokens[i];
    
    positions.push(assets[i]);

    const rebalancer = await new Rebalancer__factory(signer).deploy(
      assets[i],
      names[i],
      symbols[i],
      treasury,
      positions,
      protocolIbTokens,
      teamAddresses[i],
      teamAddresses[i]
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
