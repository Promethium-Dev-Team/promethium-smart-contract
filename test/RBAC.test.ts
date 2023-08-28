import {ethers} from "hardhat";
import {Contract, BigNumber, ContractFactory, providers} from "ethers";
import {expect} from "chai";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {RBAC__factory} from "../typechain-types";

describe("RBAC contract", async () => {
    let RBAC: Contract;

    let alice: SignerWithAddress;
    let bob: SignerWithAddress;
    let charlie: SignerWithAddress;
    let owner: SignerWithAddress;

    let REBALANCE_PROVIDER_ROLE: string;
    let AUTOCOMPOUND_PROVIDER_ROLE: string;
    let WHITELISTED_ROLE: string;
    before(async () => {
        REBALANCE_PROVIDER_ROLE = "0x524542414c414e43455f50524f56494445525f524f4c45000000000000000000";
        AUTOCOMPOUND_PROVIDER_ROLE = "0x4155544f434f4d504f554e445f50524f56494445525f524f4c45000000000000";
        WHITELISTED_ROLE = "0x5efb91f1e806530b88ef3ea69875830a216ee5e51606217ae54501f71d53a6ce";
        [owner, alice, bob, charlie] = await ethers.getSigners();
    });

    beforeEach(async () => {
        RBAC = await new RBAC__factory(owner).deploy();
    });

    describe("Deployment", async () => {
        it("Should return the correct rebalance provider role", async () => {
            expect(await RBAC.REBALANCE_PROVIDER_ROLE()).to.equal(REBALANCE_PROVIDER_ROLE);
        });

        it("Should return the correct autocompound provider role", async () => {
            expect(await RBAC.AUTOCOMPOUND_PROVIDER_ROLE()).to.equal(AUTOCOMPOUND_PROVIDER_ROLE);
        });

        it("Should return the correct whitelisted role", async () => {
            expect(await RBAC.WHITELISTED_ROLE()).to.equal(WHITELISTED_ROLE);
        });
    });
});
