import {ethers, upgrades} from "hardhat";
import {PriceRouter__factory} from "../../typechain-types";

let usdt = "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9";
let usdc_e = "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8";
let wbtc = "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f";
let weth = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1";
let arb = "0x912CE59144191C1204E64559FE8253a0e49E6548";

async function deploy() {
    const [signer] = await ethers.getSigners();
    const priceRouterFactory = new PriceRouter__factory(signer);
    const proxy = PriceRouter__factory.connect("0xbd2120c7dd88f564a8850050621b3af608a7b685", signer);
    console.log(await proxy.getTokenValue(usdt, "0xf52f079Af080C9FB5AFCA57DDE0f8B83d49692a9", 10000));
    //(await upgrades.deployProxy(priceRouterFactory, [usdt, usdc_e, wbtc, weth, arb], {kind: "uups"})).wait();
}

async function upgrade() {
    const [signer] = await ethers.getSigners();
    console.log(signer.address);
    let proxyAddress: string = "";
    //let newFactory = new PriceRouterV2__factory(signer);

    //await upgrades.upgradeProxy(proxyAddress, newFactory);
}

async function deployRouterV2() {
    const [signer] = await ethers.getSigners();
    console.log(signer.address);
    const PriceRouterV2Factory = await ethers.getContractFactory("PriceRouterV2");
    const priceRouterV2 = await PriceRouterV2Factory.deploy();
    await priceRouterV2.deployTransaction.wait();
    const txReceipt = await ethers.provider.getTransactionReceipt(priceRouterV2.deployTransaction.hash);
    console.log("PriceRouterV2 implementation deployed to address: ", priceRouterV2.address);
    console.log("Tx receipt: ", txReceipt);
}

async function main() {
    // await upgrade();
    // await deploy();
    await deployRouterV2();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
