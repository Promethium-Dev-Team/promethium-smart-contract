import {ethers} from "hardhat";
import {ERC20token__factory} from "../../typechain-types";

let names: string[] = ["Tether USD", "USD Coin", "Bitcoin token", "Ethereum", "ARB"];
let symbols: string[] = ["USDT", "USDC", "BTC", "ETH", "ARB"];

async function main() {
  const [signer] = await ethers.getSigners();
  for(let i = 0; i < names.length; i++){
    const token = await new ERC20token__factory(signer).deploy(names[0], symbols[0]);
    console.log(token.address);
  }
  
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });