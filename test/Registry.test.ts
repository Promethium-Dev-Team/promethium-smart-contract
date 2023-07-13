import { ethers } from "hardhat";
import { Contract, BigNumber, ContractFactory, providers } from "ethers";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Registry__factory } from "../typechain-types";
import { ERC20token__factory } from "../typechain-types";
import { CreditProtocol__factory } from "../typechain-types";
import { InterestBearning__factory } from "../typechain-types";

describe.only("Registry contract", async () => {
    let Registry: Contract;

    let USDT: Contract;

    let Aave: Contract;
    let Tender: Contract;
    let Dolomite: Contract;
    let Impermax: Contract;
    let WePiggy: Contract;

    let AaveIbToken: Contract;
    let TenderIbToken: Contract;
    let DolomiteIbToken: Contract;
    let ImpermaxIbToken: Contract;
    let WePiggyIbToken: Contract;

    let alice: SignerWithAddress;
    let bob: SignerWithAddress;
    let charlie: SignerWithAddress;
    let owner: SignerWithAddress;

    let REBALANCE_PROVIDER_ROLE: string;
    let AUTOCOMPOUND_PROVIDER_ROLE: string;

    let notOwnerRevertString: string;
    let allreadyAddedPositionRevertString: string;

    before(async () => {
        [owner, alice, bob, charlie] = await ethers.getSigners();

        USDT = await new ERC20token__factory(bob).deploy("Tether USD", "USDT");

        Aave = await new CreditProtocol__factory(bob).deploy(
            USDT.address,
            "AAVE Finance",
            "AAVE"
        );
        Tender = await new CreditProtocol__factory(bob).deploy(
            USDT.address,
            "Tender Finance",
            "TEND"
        );
        Dolomite = await new CreditProtocol__factory(bob).deploy(
            USDT.address,
            "Dolomite Finance",
            "DOLO"
        );
        Impermax = await new CreditProtocol__factory(bob).deploy(
            USDT.address,
            "Impermax Finance",
            "IMP"
        );
        WePiggy = await new CreditProtocol__factory(bob).deploy(
            USDT.address,
            "WEPiggy Finance",
            "PIG"
        );

        AaveIbToken = await new InterestBearning__factory(bob).deploy(
            "AAVE_IB",
            "AAVE"
        );
        TenderIbToken = await new InterestBearning__factory(bob).deploy(
            "Tender_IB",
            "TENDER"
        );
        DolomiteIbToken = await new InterestBearning__factory(bob).deploy(
            "Dolomite_IB",
            "DOLOM"
        );
        ImpermaxIbToken = await new InterestBearning__factory(bob).deploy(
            "Impermax_IB",
            "IMPER"
        );
        WePiggyIbToken = await new InterestBearning__factory(bob).deploy(
            "WEPIGGY_IB",
            "PIG"
        );

        notOwnerRevertString = "Caller is not the owner";
        allreadyAddedPositionRevertString = "Already added";
    });

    beforeEach(async () => {
        REBALANCE_PROVIDER_ROLE =
            "0x524542414c414e43455f50524f56494445525f524f4c45000000000000000000";
        AUTOCOMPOUND_PROVIDER_ROLE =
            "0x4155544f434f4d504f554e445f50524f56494445525f524f4c45000000000000";

        Registry = await new Registry__factory(owner).deploy();
    });

    describe("Deployment", async () => {
        it("Should not set any position after deployment", async () => {
            expect((await Registry.getPositions()).length).to.equal(
                ethers.constants.Zero
            );
        });

        it("Should not set any ib token after deployment", async () => {
            expect((await Registry.getIBTokens()).length).to.equal(
                ethers.constants.Zero
            );
        });
    });

    describe("Add position function", async () => {
        it("Should revert when not the owner is trying to set the new position", async () => {
            await expect(
                Registry.connect(alice).addPosition(USDT.address, false)
            ).to.be.revertedWith(notOwnerRevertString);
        });

        it("Should revert if the adaptor is already added", async () => {
            await Registry.connect(owner).addPosition(USDT.address, false);

            await expect(
                Registry.connect(owner).addPosition(USDT.address, false)
            ).to.be.revertedWith(allreadyAddedPositionRevertString);
        });

        it("Should add a non ib position", async () => {
            await Registry.connect(owner).addPosition(USDT.address, false);
            expect((await Registry.getPositions())[0]).to.equal(USDT.address);
        });

        it("Should add an ib position", async () => {
            await Registry.connect(owner).addPosition(
                AaveIbToken.address,
                true
            );
            expect((await Registry.getIBTokens())[0]).to.equal(
                AaveIbToken.address
            );
        });
    });
});
