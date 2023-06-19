import { ethers } from "hardhat";
import { Rebalancer__factory } from "../typechain-types";

let assets: string[] = [
  "0x8F5C817bd07D7A297E7C3D95d68C2c3eB18fbD89",
  "0x0c71fBCd86872008E6E2561F537566F3a99d704A",
  "0x94AA356Ef724622856c263a8fe87A504470CDd9F",
  "0x2Da52DCe7f3beF636975C4cCf05570A806db5A7A",
  "0x86429B8FfC2e14Eee069bdC4E5987B48Ed563190",
];
let names: string[] = [
  "RebalancerUSDT",
  "RebalancerUSDC",
  "RebalancerBTC",
  "RebalancerETH",
  "RebalancerARB",
];
let symbols: string[] = [
  "REB_USDT",
  "REB_USDC",
  "REB_BTC",
  "REB_ETH",
  "REB_ARB",
];

async function main() {
  for (let i = 0; i < assets.length; i++) {
    const [signer] = await ethers.getSigners();
    const rebalancer = await new Rebalancer__factory(signer).deploy(
      assets[i],
      names[i],
      symbols[i]
    );
    console.log(rebalancer.address);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
