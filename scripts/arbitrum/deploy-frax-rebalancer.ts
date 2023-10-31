import {ethers, upgrades} from "hardhat";
import {Rebalancer, Rebalancer__factory} from "../../typechain-types";

let FraxRebalancerFactory: Rebalancer__factory;
let fraxRebalancerProxy: Rebalancer;

let fraxAddress = "0x17FC002b466eEc40DaE837Fc4bE5c67993ddBd6F";
let priceRouter = "0x92e69cc96ae8b61161bee4a567256be501140350";

let owner = "0x8a41dE1686942fdC9d3dfac37Ed52961F4F79d3C"; // Multisig
let rebalanceMatrixProvider = "0xB67F5620153A0A1FC4Ca8D3f42b77B9bE12CffF7";

let name = "Promethium FRAX";
let symbol = "pmFRAX";

let poolLimit = ethers.utils.parseUnits("10000", 18); // 10000 FRAX

let protocolContracts = [
    "0xD12d43Cdf498e377D3bfa2c6217f05B466E14228", // IFrax Lodestar
    "0xb3ab7148cCCAf66686AD6C1bE24D83e58E6a504e", // IFrax DForce
    "0x27846A0f11EDC3D59EA227bAeBdFa1330a69B9ab", // IFrax Tender
];

let protocolSelectors = [
    {
        // Lodestar
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
    "0xD12d43Cdf498e377D3bfa2c6217f05B466E14228", // Lodestar
    "0xb3ab7148cCCAf66686AD6C1bE24D83e58E6a504e", // dForce
    "0x27846A0f11EDC3D59EA227bAeBdFa1330a69B9ab", // Tender
];

async function deploy() {
    const [deployer] = await ethers.getSigners();

    FraxRebalancerFactory = await ethers.getContractFactory("Rebalancer");
    fraxRebalancerProxy = (await upgrades.deployProxy(
        FraxRebalancerFactory,
        [fraxAddress, name, symbol, protocolContracts, protocolSelectors, ibTokens, rebalanceMatrixProvider, priceRouter, poolLimit],

        {
            kind: "uups",
            initializer:
                "initialize(address, string memory, string memory, address[] memory, struct(bytes4,bytes4)[] memory, address[] memory, address, address, uint256)",
        },
    )) as Rebalancer;
    console.log("FraxRebalancer address : " + fraxRebalancerProxy.address);

    // const txReceipt = await ethers.provider.getTransactionReceipt(fraxRebalancerProxy.deployTransaction.hash);

    await fraxRebalancerProxy.setFeeTreasury(owner).then((tx) => tx.wait());
    console.log("Set fee treasury done");
    await fraxRebalancerProxy.grantRole(fraxRebalancerProxy.DEFAULT_ADMIN_ROLE(), owner).then((tx) => tx.wait());
    console.log("Grant role to the owner done");
    await fraxRebalancerProxy.revokeRole(fraxRebalancerProxy.DEFAULT_ADMIN_ROLE(), deployer.address).then((tx) => tx.wait());
    console.log("Revoke role from the deployer done");

    console.log(fraxRebalancerProxy.deployTransaction.hash);
    console.log(fraxRebalancerProxy.deployTransaction.blockNumber);

    // await interact()
}

async function interact() {}

async function main() {
    await deploy();
    // await interact();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
