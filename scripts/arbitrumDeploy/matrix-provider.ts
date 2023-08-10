import { ethers } from "hardhat";
import { Dforce__factory, Rebalancer__factory } from "../../typechain-types";
import { ERC20__factory } from "../../typechain-types";
import { AAVEV3__factory } from "../../typechain-types";

let rebalancerAddress: string = "0x6E0d0cFEAE705f5fC25cA6b5d7Ae3f79f13b865E";
let usdtAddress: string = "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9";
let depositAmount: string = "40000";

let dForceAddress: string = "0xf52f079Af080C9FB5AFCA57DDE0f8B83d49692a9";

async function main() {
  const signer = (await ethers.getSigners())[2];
  const rebalancer = Rebalancer__factory.connect(rebalancerAddress, signer);
  const usdt = ERC20__factory.connect(usdtAddress, signer);

  let dForce = Dforce__factory.connect(dForceAddress, signer);

  const data = [];

  let transaction = usdt.interface.encodeFunctionData("approve", [
    dForce.address,
    depositAmount,
  ]);

  //data.push({ adaptor: usdt.address, callData: transaction });

  transaction = dForce.interface.encodeFunctionData("mint", [
    rebalancer.address,
    depositAmount,
  ]);
  data.push({ adaptor: dForce.address, callData: transaction });

  await (
    await rebalancer.rebalance(data, {
      gasLimit: 7671834,
    })
  ).wait();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
