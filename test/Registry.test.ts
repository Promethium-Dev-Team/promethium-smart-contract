import {ethers} from "hardhat";
import {Contract} from "ethers";
import {expect} from "chai";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {Registry__factory} from "../typechain-types";
import {ERC20token__factory} from "../typechain-types";
import {InterestBearning__factory} from "../typechain-types";
import {PriceRouterMock__factory} from "../typechain-types";

describe("Registry contract", async () => {
    let Registry: Contract;

    let USDT: Contract;
    let USDC: Contract;
    let Aave: Contract;
    let Tender: Contract;
    let Dolomite: Contract;
    let Impermax: Contract;
    let WePiggy: Contract;

    let priceRouter: Contract;

    let alice: SignerWithAddress;
    let bob: SignerWithAddress;
    let charlie: SignerWithAddress;
    let rosa: SignerWithAddress;
    let owner: SignerWithAddress;
    let rebalanceMatrixProvider: SignerWithAddress;

    let REBALANCE_PROVIDER_ROLE: string;

    let notOwnerRevertString: string;
    let allreadyAddedPositionRevertString: string;

    let positions: string[] = [];
    let iTokens: string[] = [];
    let whitelist: string[] = [];

    let positionsAmountLimit: number;
    let iTokensAmountLimit: number;

    before(async () => {
        [owner, alice, bob, charlie, rosa, rebalanceMatrixProvider] = await ethers.getSigners();

        USDT = await new ERC20token__factory(bob).deploy("Tether USD", "USDT");
        USDC = await new ERC20token__factory(charlie).deploy("USD coint", "USDC");

        Aave = await new InterestBearning__factory(bob).deploy(USDT.address, "AAVE Finance", "AAVE");
        Tender = await new InterestBearning__factory(bob).deploy(USDT.address, "Tender Finance", "TEND");
        Dolomite = await new InterestBearning__factory(bob).deploy(USDT.address, "Dolomite Finance", "DOLO");
        Impermax = await new InterestBearning__factory(bob).deploy(USDT.address, "Impermax Finance", "IMP");
        WePiggy = await new InterestBearning__factory(bob).deploy(USDT.address, "WEPiggy Finance", "PIG");

        priceRouter = await new PriceRouterMock__factory(bob).deploy();
        notOwnerRevertString = "Caller is not the owner";
        allreadyAddedPositionRevertString = "Already added";

        positions = [USDT.address];
        iTokens = [Aave.address, Tender.address, Dolomite.address, Impermax.address];
        whitelist = [alice.address, bob.address];

        positionsAmountLimit = 12;
        iTokensAmountLimit = 12;
    });

    beforeEach(async () => {
        REBALANCE_PROVIDER_ROLE = "0x524542414c414e43455f50524f56494445525f524f4c45000000000000000000";

        Registry = await new Registry__factory(owner).deploy(
            positions,
            iTokens,
            rebalanceMatrixProvider.address,
            priceRouter.address,
            whitelist,
        );
    });

    describe("Deployment", async () => {
        it("Should not set the correct amount of position", async () => {
            expect((await Registry.getPositions()).length).to.equal(positions.length);
        });

        it("Should not set the correct positions", async () => {
            let registryPositions = await Registry.getPositions();
            for (let i = 0; i < positions.length; i++) {
                expect(registryPositions[i]).to.equal(positions[i]);
            }
        });

        it("Should set the corect amount of iTokens", async () => {
            expect((await Registry.getITokens()).length).to.equal(iTokens.length);
        });

        it("Should set the corect iTokens", async () => {
            let registryItokens = await Registry.getITokens();
            for (let i = 0; i < iTokens.length; i++) {
                expect(registryItokens[i]).to.equal(iTokens[i]);
            }
        });

        it("Should set the correct rebalancer role after", async () => {
            expect(await Registry.hasRole(REBALANCE_PROVIDER_ROLE, rebalanceMatrixProvider.address)).to.equal(true);
        });

        it("Should set price router address", async () => {
            expect(await Registry.router()).to.equal(priceRouter.address);
        });

        it("Should whitelist wallets", async () => {
            for (let i = 0; i < whitelist.length; i++) {
                expect(await Registry.hasRole(await Registry.WHITELISTED_ROLE(), whitelist[i])).to.equal(true);
            }
        });

        it("Should not whitelist any other", async () => {
            for (let i = 0; i < whitelist.length; i++) {
                expect(await Registry.hasRole(await Registry.WHITELISTED_ROLE(), charlie.address)).to.equal(false);
            }
        });
    });

    describe("Add position function", async () => {
        it("Should revert when not the owner is trying to set a new position", async () => {
            await expect(Registry.connect(alice).addPosition(USDC.address)).to.be.revertedWith(notOwnerRevertString);
        });

        it("Should revert if the adaptor is already added", async () => {
            await expect(Registry.connect(owner).addPosition(USDT.address)).to.be.revertedWith(
                allreadyAddedPositionRevertString,
            );
        });

        it("Should add a non itoken position", async () => {
            let previousLength = (await Registry.getPositions()).length;

            await Registry.connect(owner).addPosition(USDC.address);
            expect((await Registry.getPositions()).length).to.equal(previousLength + 1);
        });

        it("Should emit an event after adding a position", async () => {
            await expect(Registry.connect(owner).addPosition(USDC.address))
                .to.emit(Registry, "PositionAdded")
                .withArgs(USDC.address, owner.address);
        });

        it("Should not allow to add more positions than limit", async () => {
            for (let i = 0; i < positionsAmountLimit - positions.length; i++) {
                let randomWallet = ethers.Wallet.createRandom();
                await Registry.addPosition(randomWallet.address);
            }
            let randomWallet = ethers.Wallet.createRandom();
            await expect(Registry.addPosition(randomWallet.address)).to.be.revertedWith(
                "Positions limit amount exceeded",
            );
        });
    });

    describe("Remove position function", async () => {
        it("Should remove the position from allowed adaptors list", async () => {
            await Registry.connect(owner).removePosition(ethers.constants.Zero);
            expect((await Registry.getPositions()).length).to.equal(positions.length - 1);
        });

        it("Should revert if not the owner is trying to remove position", async () => {
            await expect(Registry.connect(charlie).removePosition(ethers.constants.Zero)).to.be.revertedWith(
                notOwnerRevertString,
            );
        });

        it("Adaptor should become not allowed after removing a positions", async () => {
            await Registry.connect(owner).removePosition(ethers.constants.Zero);
            expect(await Registry.isAdaptorSetup(positions[0])).to.equal(false);
        });

        it("Should emit after removing position", async () => {
            await expect(Registry.connect(owner).removePosition(ethers.constants.Zero))
                .to.emit(Registry, "PositionRemoved")
                .withArgs(positions[positions.length - 1], owner.address);
        });

        it("Shouldn't remove any extra position", async () => {
            await Registry.connect(owner).removePosition(ethers.constants.Zero);
            let registryPositions = await Registry.getPositions();
            for (let i = 0; i < registryPositions.length; i++) {
                expect(registryPositions[i]).to.equal(positions[i + 1]);
            }
            expect(registryPositions.length).to.be.equal(positions.length - 1);
        });
    });

    describe("AddIToken function", async () => {
        it("Should revert when not the owner is trying to set a new Itoken", async () => {
            await expect(Registry.connect(charlie).addIToken(WePiggy.address)).to.be.revertedWith(notOwnerRevertString);
        });

        it("Should revert if the adaptor is already added", async () => {
            await expect(Registry.connect(owner).addIToken(Aave.address)).to.be.revertedWith(
                allreadyAddedPositionRevertString,
            );
        });

        it("Should add an iToken", async () => {
            await Registry.connect(owner).addIToken(WePiggy.address);
            expect((await Registry.getITokens())[iTokens.length]).to.equal(WePiggy.address);
        });

        it("Should not allow to add more positions than limit", async () => {
            for (let i = 0; i < iTokensAmountLimit - iTokens.length; i++) {
                let randomWallet = ethers.Wallet.createRandom();
                await Registry.addIToken(randomWallet.address);
            }
            let randomWallet = ethers.Wallet.createRandom();
            await expect(Registry.addIToken(randomWallet.address)).to.be.revertedWith("iTokens limit amount exceeded");
        });

        it("Should emit an event after adding a position", async () => {
            await expect(Registry.connect(owner).addIToken(WePiggy.address))
                .to.emit(Registry, "ITokenAdded")
                .withArgs(WePiggy.address, owner.address);
        });
    });

    describe("Remove IToken function", async () => {
        it("Should revert if not the owner is trying to remove iPosition", async () => {
            await expect(Registry.connect(bob).removeIToken(0)).to.be.revertedWith(notOwnerRevertString);
        });

        it("Should revert if the owner is trying to remove position with non zero balancer", async () => {
            await Aave.connect(bob).transfer(Registry.address, ethers.constants.One);

            await expect(Registry.connect(owner).removeIToken(0)).to.be.revertedWith("Itoken balance should be 0");
        });

        it("Shouldn't remove any extra itoken", async () => {
            await Registry.connect(owner).removeIToken(0);
            let registryIPositions = await Registry.getITokens();
            for (let i = 0; i < registryIPositions.length; i++) {
                expect(registryIPositions[i]).to.equal(iTokens[i + 1]);
            }
            expect(registryIPositions.length).to.be.equal(iTokens.length - 1);
        });

        it("Adaptor should become not allowed after removing an itoken", async () => {
            await Registry.connect(owner).removeIToken(ethers.constants.Zero);
            expect(await Registry.isAdaptorSetup(iTokens[0])).to.equal(false);
        });

        it("Should emit after removing an iToken", async () => {
            await expect(await Registry.connect(owner).removeIToken(ethers.constants.Zero))
                .to.emit(Registry, "ITokenRemoved")
                .withArgs(iTokens[0], owner.address);
        });
    });

    describe("Deposites pause function", async () => {
        it("Should revert if not the owner is trying to pause", async () => {
            await expect(Registry.connect(bob).setPause(true)).to.be.revertedWith(notOwnerRevertString);
        });

        it("Should pause", async () => {
            await Registry.connect(owner).setPause(true);

            expect(await Registry.depositsPaused()).to.equal(true);
        });

        it("Should unpause", async () => {
            await Registry.connect(owner).setPause(true);
            await Registry.connect(owner).setPause(false);

            expect(await Registry.depositsPaused()).to.equal(false);
        });
    });
});
