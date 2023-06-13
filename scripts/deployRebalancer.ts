import {ethers} from "hardhat";
import {Rebalancer__factory} from "../typechain-types";

let asset: string = "0x8F5C817bd07D7A297E7C3D95d68C2c3eB18fbD89";
let name: string = "Rebalancer";
let symbol: string = "REB";

async function main() {
    const [signer] = await ethers.getSigners();
    const rebalancer = await new Rebalancer__factory(signer).deploy(asset, name, symbol);
    console.log(rebalancer.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });