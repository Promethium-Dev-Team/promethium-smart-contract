import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import "hardhat-contract-sizer";

dotenv.config();

export default {
    solidity: {
        version: "0.8.9",
        settings: { optimizer: { enabled: true, runs: 200 } },
    },
    contractSizer: { runOnCompile: true },
    networks: {
        hardhat: {
            chainId: 1337,
        },
        goerli: {
            url: `https://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_PROJECT_ID}`,
            accounts: [process.env.PRIVATE_KEY],
            chainId: 5,
        },
        mumbai: {
            url: `https://polygon-mumbai.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
            accounts: [process.env.PRIVATE_KEY],
            chainId: 80001,
        },
        arbitrum: {
            url: `https://arbitrum-mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
            accounts: [process.env.PRIVATE_KEY],
            chainId: 42161,
        },
    },
    etherscan: {
        apiKey: {
            goerli: `${process.env.ETHERSCAN_API_KEY}`,
        },
    },
};
