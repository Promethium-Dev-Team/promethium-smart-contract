import { ethers } from "hardhat";
import { PriceRouter__factory } from "../../typechain-types";

let usdt = "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9";
let usdc_e = "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8";
let wbtc = "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f";
let weth = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1";
let arb = "0x912CE59144191C1204E64559FE8253a0e49E6548";

async function main() {
    const [signer] = await ethers.getSigners();

    const priceRouter = await new PriceRouter__factory(signer).deploy(usdt, usdc_e, wbtc, weth, arb);

    console.log(priceRouter.address);
}
main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});
