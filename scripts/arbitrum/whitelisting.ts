import {ethers} from "hardhat";
import {Rebalancer__factory} from "../../typechain-types";

let user: string = "0x8b4bC5CB23b2b3a2243E44b7812344949943D608";

let usdtRebalancerAddress: string = "0x346C816eD31DCAA568301a2115Fb86b45324FC6c";
let usdcRebalancerAddress: string = "0xee0939e87EF73516535896aE116B775351203199";
let wbtcRebalancerAddress: string = "0xA5039a6E9B7c0e7ea60F1C4962938779AF69d4D2";
let wethRebalancerAddress: string = "0xFE06831E1bF109F55073F7C8E6BFcBc1690b7Eed";
let arbRebalancerAddress: string = "0x4511cB2FDc48bF85F5e7d82F6592B4C75FD2baCb";

async function main() {
    const signer = (await ethers.getSigners())[0];

    const usdtRebalancer = Rebalancer__factory.connect(usdtRebalancerAddress, signer);
    const usdcRebalancer = Rebalancer__factory.connect(usdcRebalancerAddress, signer);
    const wbtcRebalancer = Rebalancer__factory.connect(wbtcRebalancerAddress, signer);
    const wethRebalancer = Rebalancer__factory.connect(wethRebalancerAddress, signer);
    const arbRebalancer = Rebalancer__factory.connect(arbRebalancerAddress, signer);

    await usdtRebalancer.whitelistUser(user);
    await usdcRebalancer.whitelistUser(user);
    await wbtcRebalancer.whitelistUser(user);
    await wethRebalancer.whitelistUser(user);
    await arbRebalancer.whitelistUser(user);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
