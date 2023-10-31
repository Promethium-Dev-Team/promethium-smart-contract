import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import * as dotenv from "dotenv";
import "hardhat-contract-sizer";
import "hardhat-gas-reporter";

dotenv.config();

export default {
    solidity: {
        version: "0.8.21",
        settings: {optimizer: {enabled: true, runs: 200}, evmVersion: "paris"},
    },
    contractSizer: {runOnCompile: true},
    networks: {
        hardhat: {
            chainId: 1337,
            // forking: {
            //     url: `https://arbitrum-mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
            //     // blockNumber: 143803001,
            //     gasLimit: 50000000,
            // },
        },
        goerli: {
            url: `https://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_PROJECT_ID}`,
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 5,
        },
        sepolia: {
            url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_PROJECT_ID}`,
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 11155111,
        },
        mumbai: {
            url: `https://polygon-mumbai.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 80001,
        },
        arbitrumOne: {
            url: `https://arbitrum-mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 42161,
        },
        arbitrumAlchemy: {
            url: `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_PROJECT_ID}`,
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 42161,
        },
        arbitrumQuickNode: {
            url: `https://dark-boldest-panorama.arbitrum-mainnet.discover.quiknode.pro/${process.env.QUICKNODE_PROJECT_ID}`,
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 42161,
        },
        arbitrumInfuraExtra: {
            url: `https://arb1.arbitrum.io/rpc`,
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 42161,
        },
    },
    etherscan: {
        apiKey: {
            goerli: `${process.env.ETHERSCAN_API_KEY}`,
            arbitrumOne: `${process.env.ARBISCAN_API_KEY}`,
        },
    },
    gasReporter: {
        enabled: false,
        currency: "USD",
        gasPrice: 0.4,
    },
};
