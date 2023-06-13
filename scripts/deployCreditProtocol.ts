import {ethers} from "hardhat";
import {CreditProtocol__factory} from "../typechain-types";

let mainAddress: string[] = ["0x8F5C817bd07D7A297E7C3D95d68C2c3eB18fbD89", "0x8F5C817bd07D7A297E7C3D95d68C2c3eB18fbD89", "0x8F5C817bd07D7A297E7C3D95d68C2c3eB18fbD89", "0x8F5C817bd07D7A297E7C3D95d68C2c3eB18fbD89", "0x8F5C817bd07D7A297E7C3D95d68C2c3eB18fbD89"];
let names: string[] = ["Interest Bearning Tether USD 1", "Interest Bearning Tether USD 2", "Interest Bearning Tether USD 3", "Interest Bearning Tether USD 4", "Interest Bearning Tether USD 5"];
let symbols: string[] = ["iUSDT 1", "iUSDT 2", "iUSDT 3", "iUSDT 4", "iUSDT 5"];

async function main() {
  const [signer] = await ethers.getSigners();
  for(let i = 0; i < names.length; i++){
    const protocol = await new CreditProtocol__factory(signer).deploy(mainAddress[i], names[i], symbols[i]);
    console.log(protocol.address);
  }
  
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });