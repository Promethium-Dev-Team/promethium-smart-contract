import { ethers } from "hardhat";
import { Rebalancer__factory } from "../typechain-types";
import { CreditProtocol__factory } from "../typechain-types";

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
  "Spectrum USDT",
  "Spectrum USDC",
  "Spectrum BTC",
  "Spectrum ETH",
  "Spectrum ARB",
];
let teamAddresses: string[] = [
  "0xff5a640A3e5f5A1a3b08B0841e069e255f76D3C7", //frontend
  "0xcf80E4DA97b160c8abEDF61BfaBb62D42b9aAe17", //smart contract dev
  "0x62454346aF26ad476b811dF784f6aBa9B77C9b39", //backend
];
let treasury: string = "0xBAD3866bE77aedBD8C559Ad0A74dBad95161592e";

let creditProtocolMocks: string[][] = [
  [
    "0x1AAf3e14e60d49Ba5850DB50043d08d0d090Be74",
    "0x0Deb15fBC1ed54784ee32a02C15187189a309C17",
    "0x5fc2ab355FaE246b1c372247Cc217fE051D25faA",
    "0x8165eddB3C93633F4f459296094692cf7B327e34",
    "0x91D1ebdD28e56d23B5aF8048b3B6c47b676B7358",
  ],
  [
    "0x750403B9CC111228B92855e35827abA80F0a410d",
    "0x06D444b58f8ab127BD9Dd3f8C7CeaE81279df7fd",
    "0xe36c08A19f02D7E6cde04660c384eaac206AFF2b",
    "0x5060F4D4418c54d50C1Ab801b99b7a3aCe0D89f5",
    "0xDd35Deb38627fD7654444290826AFf8B7F0B0732",
  ],
  [
    "0x78161F92cd87e00e6Fc9917761B9B743C028D136",
    "0x72c8056F0aAbB9cD379111c5cF31B7C60dD8C805",
    "0x917E73Ab33CCE723CddbF3FD61382278530353B1",
    "0x8c0CDe21643a6f4b9C5ba873AE1092fd1bB67C2E",
    "0xBD8b390ACE4407C2248C1CDd90E3a06FBd071b0f",
  ],
  [
    "0x49cbf64218136dCf59a2D7853121Af01423115e3",
    "0x6C53a1cBFB5C84378d46c445BC6955925C265a52",
    "0x335eeEf8B9E597f8c6280F44326712883d0f7b3c",
    "0xdea3f4369A52FcAB8a472685dd8B97A34F0d00FE",
    "0xea1e4A13B34eEA9A6655844fFbe8256322eD13Fc",
  ],
  [
    "0x78aB490C13Dd928269F93748FfbDf962333891dD",
    "0x101106D2ab5969E40EFE6F484B7F90F35b0BB9Bb",
    "0x19A0073a9156CFBb1279930b0E47AD3DaE2C866B",
    "0x178DC97056EB281fF54A6b8950CA48c38514d1c6",
    "0x4bdA8F1713bC897941F0F1EE833bE177bd36a1C3",
  ],
];
async function main() {
  for (let i = 0; i < assets.length; i++) {
    const [signer] = await ethers.getSigners();
    let positions: string[] = [];
    let ibTokens: string[] = [];

    for (let j = 0; j < creditProtocolMocks[i].length; j++) {
      positions.push(creditProtocolMocks[i][j]);
      let creditProtocol = CreditProtocol__factory.connect(
        creditProtocolMocks[i][j],
        signer
      );
      ibTokens.push(await creditProtocol.IBToken());
    }
    positions.push(assets[i]);

    const rebalancer = await new Rebalancer__factory(signer).deploy(
      assets[i],
      names[i],
      symbols[i],
      treasury,
      positions,
      ibTokens
    );

    console.log(names[i]);
    console.log(rebalancer.address);
    for (let j = 0; j < teamAddresses.length; j++) {
      await rebalancer.grantRole(
        await rebalancer.DEFAULT_ADMIN_ROLE(),
        teamAddresses[j]
      );

      await rebalancer.grantRole(
        await rebalancer.AUTOCOMPOUND_PROVIDER_ROLE(),
        teamAddresses[j]
      );

      await rebalancer.grantRole(
        await rebalancer.REBALANCE_PROVIDER_ROLE(),
        teamAddresses[j]
      );
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
