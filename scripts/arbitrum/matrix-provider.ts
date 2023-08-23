import {ethers} from "hardhat";
import {Idforce__factory, Rebalancer__factory} from "../../typechain-types";
import {ERC20__factory} from "../../typechain-types";
import {AAVEV3__factory} from "../../typechain-types";

let rebalancerAddress: string = "0xf11650888ff3C2b2E4f653D76AD0c0fF01D86260";
let usdtAddress: string = "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9";
let depositAmount: number = 99998;

let dForceAddress: string = "0xf52f079Af080C9FB5AFCA57DDE0f8B83d49692a9";

async function main() {
    const signer = (await ethers.getSigners())[2];
    const rebalancer = Rebalancer__factory.connect(rebalancerAddress, signer);
    const usdt = ERC20__factory.connect(usdtAddress, signer);

    let dForce = Idforce__factory.connect(dForceAddress, signer);

    const data = [];

    let transaction = usdt.interface.encodeFunctionData("approve", [dForce.address, depositAmount]);

    //data.push({ adaptor: usdt.address, callData: transaction });

    transaction = dForce.interface.encodeFunctionData("mint", [rebalancer.address, depositAmount]);
    //data.push({ adaptor: dForce.address, callData: transaction });

    transaction = dForce.interface.encodeFunctionData("redeemUnderlying", [rebalancer.address, depositAmount]);
    data.push({adaptor: dForce.address, callData: transaction});

    await (await rebalancer.rebalance(data)).wait();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
