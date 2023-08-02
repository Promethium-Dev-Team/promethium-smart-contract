import { ethers } from "hardhat";
import { Rebalancer__factory } from "../../typechain-types";
import { ERC20__factory } from "../../typechain-types";
import { CreditProtocol__factory } from "../../typechain-types";

let rebalancerAddress: string = "0xD793AF38a1F499bf0447Fc93b9f4e8b557827438";
let usdtAddress: string = "0x8F5C817bd07D7A297E7C3D95d68C2c3eB18fbD89";
let depositAmount: string = "1000000000000000000000";

let positionsAddresses: string[] = [
    "0x1AAf3e14e60d49Ba5850DB50043d08d0d090Be74",
    "0x0Deb15fBC1ed54784ee32a02C15187189a309C17",
    "0x5fc2ab355FaE246b1c372247Cc217fE051D25faA",
    "0x8165eddB3C93633F4f459296094692cf7B327e34",
    "0x91D1ebdD28e56d23B5aF8048b3B6c47b676B7358",
];
let positionsBalances = [
    "100000000000000000000",
    "200000000000000000000",
    "300000000000000000000",
    "250000000000000000000",
    "50000000000000000000",
]; //10% 20% 30% 25% 5%

async function main() {
    const signer = (await ethers.getSigners())[0];
    const rebalancer = Rebalancer__factory.connect(rebalancerAddress, signer);
    const usdt = ERC20__factory.connect(usdtAddress, signer);

    let positions = [];
    for (let i = 0; i < positionsAddresses.length; i++) {
        positions.push(
            CreditProtocol__factory.connect(positionsAddresses[i], signer)
        );
    }

    //deposit into shares
    await (await usdt.approve(rebalancerAddress, depositAmount)).wait();
    (await rebalancer.deposit(depositAmount, signer.address)).wait();

    //adding positions
    for (let i = 0; i < positionsAddresses.length; i++) {
        (await rebalancer.addPosition(positionsAddresses[i])).wait();
    }

    await (await rebalancer.addPosition(usdt.address)).wait();

    const data = [];

    for (let i = 0; i < positions.length; i++) {
        let transaction = usdt.interface.encodeFunctionData("approve", [
            positions[i].address,
            5,
        ]);
        data.push({ adaptor: usdt.address, callData: transaction });

        transaction = positions[i].interface.encodeFunctionData("deposit", [5]);
        data.push({ adaptor: positions[i].address, callData: transaction });
    }

    await (await rebalancer.setDistributionMatrix(data)).wait();

    await (await rebalancer.rebalance()).wait();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
