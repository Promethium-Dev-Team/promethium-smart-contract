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
  "Promethium USDT",
  "Promethium USDC.e",
  "Promethium WBTC",
  "Promethium WETH",
  "Promethium ARB",
];
let symbols: string[] = [
  "USDT Share",
  "USDC Share",
  "WBTC Share",
  "WETH Share",
  "ARB Share",
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
    "0xF4B1486DD74D07706052A33d31d7c0AAFD0659E1",
    "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    "0x102442A3BA1e441043154Bc0B8A2e2FB5E0F94A7" //usdt
  ],
  [
    "0xF4B1486DD74D07706052A33d31d7c0AAFD0659E1",
    "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    "0x102442A3BA1e441043154Bc0B8A2e2FB5E0F94A7" //usdc.e
  ],
  [
    "0xF4B1486DD74D07706052A33d31d7c0AAFD0659E1",
    "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    "0x102442A3BA1e441043154Bc0B8A2e2FB5E0F94A7" //wbtc
  ],
  [
    "0xF4B1486DD74D07706052A33d31d7c0AAFD0659E1",
    "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    "0x102442A3BA1e441043154Bc0B8A2e2FB5E0F94A7" //weth
  ],
  [
    "0xF4B1486DD74D07706052A33d31d7c0AAFD0659E1",
    "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    "0x102442A3BA1e441043154Bc0B8A2e2FB5E0F94A7" //arb
  ]
];

let ibTokens: string[][] = [
  [
    "0xd69d402d1bdb9a2b8c3d88d98b9ceaf9e4cd72d9",
    "0x66ddD8F3A0C4CEB6a324376EA6C00B4c8c1BB3d9",
    "0x6ab707aca953edaefbc4fd23ba73294241490620"
  ],
  [
    "0x48a29e756cc1c097388f3b2f3b570ed270423b3d",
    "0x6C4CB1115927D50E495E554d38b83f2973F05361",
    "0x625E7708f30cA75bfd92586e17077590C60eb4cD"
  ],
  [
    "0x727354712BDFcd8596a3852Fd2065b3C34F4F770",
    "0x731e2246A0c67b1B19188C7019094bA9F107404f",
    "0x078f358208685046a11C85e8ad32895DED33A249"
  ],
  [
    "0x0dF5dfd95966753f01cb80E76dc20EA958238C46",
    "0xe50fA9b3c56FfB159cB0FCA61F5c9D750e8128c8",
    "0x712F1955E5eD3F7A5Ac7B5E4c480db8edF9b3fD7"
  ],
  [
    "0x2dADe5b7df9DA3a7e1c9748d169Cd6dFf77e3d01",
    "0x8B9a4ded05ad8C3AB959980538437b0562dBb129"
  ]
];

async function main() {
  for (let i = 1; i < assets.length; i++) {
    const [signer] = await ethers.getSigners();
    let positions = protocols[i];
    positions.push(assets[i]);
    let protocolIbTokens = ibTokens[i];
    

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
