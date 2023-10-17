import {ethers, upgrades} from "hardhat";
import {expect} from "chai";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {RBAC} from "../typechain-types";

describe("RBAC contract", async () => {
    let RBAC: RBAC;

    let alice: SignerWithAddress;
    let bob: SignerWithAddress;
    let charlie: SignerWithAddress;
    let owner: SignerWithAddress;

    let REBALANCE_PROVIDER_ROLE: string;
    let AUTOCOMPOUND_PROVIDER_ROLE: string;
    before(async () => {
        REBALANCE_PROVIDER_ROLE = "0x524542414c414e43455f50524f56494445525f524f4c45000000000000000000";
        AUTOCOMPOUND_PROVIDER_ROLE = "0x4155544f434f4d504f554e445f50524f56494445525f524f4c45000000000000";
        [owner, alice, bob, charlie] = await ethers.getSigners();
    });

    beforeEach(async () => {
        RBAC = (await upgrades.deployProxy(await ethers.getContractFactory("RBAC"), [], {kind: "uups", initializer: "initialize()"})) as RBAC;
    });

    describe("Deployment", async () => {
        it("Should return the correct rebalance provider role", async () => {
            expect(await RBAC.REBALANCE_PROVIDER_ROLE()).to.equal(REBALANCE_PROVIDER_ROLE);
        });
    });
});
