import { ethers } from "hardhat";
import { CreditProtocol__factory } from "../typechain-types";

let mainAddress: string[] = [
    "0x8F5C817bd07D7A297E7C3D95d68C2c3eB18fbD89",
    "0x0c71fBCd86872008E6E2561F537566F3a99d704A",
    "0x94AA356Ef724622856c263a8fe87A504470CDd9F",
    "0x2Da52DCe7f3beF636975C4cCf05570A806db5A7A",
    "0x86429B8FfC2e14Eee069bdC4E5987B48Ed563190",
];
let names: string[] = [
    "Interest Bearning Tether USD",
    "Interest Bearning USD Coin",
    "Interest Bearning Bitcoin",
    "Interest Bearning Ethereum",
    "Interest Bearning Arbitrum",
];
let symbols: string[] = ["iUSDT", "iUSDC", "iBTC", "iETH", "iARB"];

async function main() {
    const [signer] = await ethers.getSigners();

    for (let j = 0; j < mainAddress.length; j++) {
        console.log(symbols[j]);
        for (let i = 0; i < 5; i++) {
            const protocol = await new CreditProtocol__factory(signer).deploy(
                mainAddress[j],
                names[j] + " " + (i + 1).toString(),
                symbols[j] + " " + (i + 1).toString()
            );
            console.log(protocol.address);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
