import {ethers, upgrades} from "hardhat";
import {Rebalancer, Rebalancer__factory} from "../../typechain-types";

let DaiRebalancerFactory: Rebalancer__factory;
let daiRebalancerProxy: Rebalancer;

let daiAddress = "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1";
let priceRouter = "0x92e69cc96ae8b61161bee4a567256be501140350";

let owner = "0x8a41dE1686942fdC9d3dfac37Ed52961F4F79d3C"; // Multisig admin
let rebalanceMatrixProvider = "0x87Cc6Ef1420D4c48bfFf0faBC5578558E1a0423c";

let name = "Promethium DAI";
let symbol = "pmDAI";

let poolLimit = ethers.utils.parseUnits("10000", 18); // 10000 DAI

let protocolContracts = [
    "0xF4B1486DD74D07706052A33d31d7c0AAFD0659E1", // Radiant V2
    "0x794a61358D6845594F94dc1DB02A252b5b4814aD", // AAVE V3
    "0x102442A3BA1e441043154Bc0B8A2e2FB5E0F94A7", // Granary Finance
    "0x4987782da9a63bC3ABace48648B15546D821c720", // Lodestar IDAI
    "0xDe39Adfb2025D2aA51f6fD967e7C1753215f1905", // WePiggy IDAI
    "0xf6995955e4B0E5b287693c221f456951D612b628", // DForce IDAI
    "0xB287180147EF1A97cbfb07e2F1788B75df2f6299", // Tender IDAI
];

let protocolSelectors = [
    {
        // Radiant V2
        deposit: "0xe8eda9df",
        withdraw: "0x69328dec",
    },
    {
        // Aave V3
        deposit: "0xe8eda9df",
        withdraw: "0x69328dec",
    },
    {
        // Granary Finance
        deposit: "0xe8eda9df",
        withdraw: "0x69328dec",
    },
    {
        // Lodestar
        deposit: "0xa0712d68",
        withdraw: "0x852a12e3",
    },
    {
        // WePiggy
        deposit: "0xa0712d68",
        withdraw: "0x852a12e3",
    },
    {
        // dForce
        deposit: "0x40c10f19",
        withdraw: "0x96294178",
    },
    {
        // Tender
        deposit: "0xa0712d68",
        withdraw: "0x852a12e3",
    },
];

let ibTokens = [
    "0x0D914606f3424804FA1BbBE56CCC3416733acEC6", // Radiant V2
    "0x82E64f49Ed5EC1bC6e43DAD4FC8Af9bb3A2312EE", // Aave V3
    "0xFC2eaC1AeB490d5ff727E659273C8AfC5dD2b0bb", // Granary Finance
    "0x4987782da9a63bC3ABace48648B15546D821c720", // Lodestar
    "0xDe39Adfb2025D2aA51f6fD967e7C1753215f1905", // WePiggy
    "0xf6995955e4B0E5b287693c221f456951D612b628", // dForce
    "0xB287180147EF1A97cbfb07e2F1788B75df2f6299", // Tender
];

async function deploy() {
    const [deployer] = await ethers.getSigners();

    DaiRebalancerFactory = await ethers.getContractFactory("Rebalancer");
    daiRebalancerProxy = (await upgrades.deployProxy(
        DaiRebalancerFactory,
        [daiAddress, name, symbol, protocolContracts, protocolSelectors, ibTokens, rebalanceMatrixProvider, priceRouter, poolLimit],

        {
            kind: "uups",
            initializer:
                "initialize(address, string memory, string memory, address[] memory, struct(bytes4,bytes4)[] memory, address[] memory, address, address, uint256)",
        },
    )) as Rebalancer;
    console.log("DaiRebalancer address: " + daiRebalancerProxy.address);

    // const txReceipt = await ethers.provider.getTransactionReceipt(daiRebalancerProxy.deployTransaction.hash);
    await daiRebalancerProxy.setFeeTreasury(owner).then((tx) => tx.wait());
    console.log("Set fee treasury done");
    await daiRebalancerProxy.grantRole(daiRebalancerProxy.DEFAULT_ADMIN_ROLE(), owner).then((tx) => tx.wait());
    console.log("Grant role to owner done");
    await daiRebalancerProxy.revokeRole(daiRebalancerProxy.DEFAULT_ADMIN_ROLE(), deployer.address).then((tx) => tx.wait());
    console.log("Revoke role from deployer done");

    console.log("Tx Hash: ", daiRebalancerProxy.deployTransaction.hash);
    console.log("Tx BlockNumber: ", daiRebalancerProxy.deployTransaction.blockNumber);

    // await interact();
}

async function interact() {}

async function main() {
    await deploy();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
