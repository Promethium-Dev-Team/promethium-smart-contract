import {ethers} from "hardhat";
import {expect} from "chai";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {ERC20token, InterestBearning, PriceRouterMock, Registry, Registry__factory} from "../typechain-types";
import {ERC20token__factory} from "../typechain-types";
import {InterestBearning__factory} from "../typechain-types";
import {PriceRouterMock__factory} from "../typechain-types";

const sortFn = (a: string, b: string) => {
    return a.concat(b) < b.concat(a) ? 1 : a.concat(b) > b.concat(a) ? -1 : 0;
};

describe("Registry contract", async () => {
    let Registry: Registry;

    let USDT: ERC20token;
    let USDC: ERC20token;
    let Aave: InterestBearning;
    let Tender: InterestBearning;
    let Dolomite: InterestBearning;
    let Impermax: InterestBearning;
    let WePiggy: InterestBearning;

    let priceRouter: PriceRouterMock;

    let alice: SignerWithAddress;
    let bob: SignerWithAddress;
    let charlie: SignerWithAddress;
    let rosa: SignerWithAddress;
    let owner: SignerWithAddress;
    let rebalanceMatrixProvider: SignerWithAddress;

    let REBALANCE_PROVIDER_ROLE: string;

    let notOwnerRevertString: string;
    let allreadyAddedProtocolRevertString: string;

    let protocols: string[] = [];
    let PROTOCOL_SELECTORS: {withdraw: string; deposit: string};
    let protocolSelectors: {withdraw: string; deposit: string}[] = [];
    let iTokens: string[] = [];

    let protocolsAmountLimit: number;
    let iTokensAmountLimit: number;
    let poolLimit: number;

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
        allreadyAddedProtocolRevertString = "Already added";

        protocols = [Aave.address, Tender.address, Dolomite.address, Impermax.address];
        PROTOCOL_SELECTORS = {
            deposit: Aave.interface.getSighash("deposit"),
            withdraw: Aave.interface.getSighash("withdraw"),
        };
        protocolSelectors = protocols.map(() => PROTOCOL_SELECTORS);
        iTokens = [Aave.address, Tender.address, Dolomite.address, Impermax.address];

        protocolsAmountLimit = 12;
        iTokensAmountLimit = 12;
        poolLimit = 1e6;
    });

    beforeEach(async () => {
        REBALANCE_PROVIDER_ROLE = "0x524542414c414e43455f50524f56494445525f524f4c45000000000000000000";

        Registry = await new Registry__factory(owner).deploy(
            protocols,
            protocolSelectors,
            iTokens,
            rebalanceMatrixProvider.address,
            priceRouter.address,
            poolLimit,
        );
    });

    describe("Deployment", async () => {
        it("Should not set the correct amount of protocols", async () => {
            expect((await Registry.getProtocols()).length).to.equal(protocols.length);
        });

        it("Should not set the correct protocols", async () => {
            let registryProtocols = await Registry.getProtocols();
            protocols.forEach((protocol, index) => expect(protocol).to.equal(registryProtocols[index]));
        });

        it("Should set the corect amount of iTokens", async () => {
            expect((await Registry.getITokens()).length).to.equal(iTokens.length);
        });

        it("Should set the corect iTokens", async () => {
            let registryITokens = await Registry.getITokens();
            iTokens.forEach((iToken, index) => expect(iToken).to.equal(registryITokens[index]));
        });

        it("Should set the correct rebalancer role after", async () => {
            expect(await Registry.hasRole(REBALANCE_PROVIDER_ROLE, rebalanceMatrixProvider.address)).to.equal(true);
        });

        it("Should set price router address", async () => {
            expect(await Registry.router()).to.equal(priceRouter.address);
        });
    });

    describe("Add protocol function", async () => {
        it("Should revert when not the owner is trying to set a new protocol", async () => {
            await expect(Registry.connect(alice).addProtocol(USDC.address, PROTOCOL_SELECTORS)).to.be.revertedWith(notOwnerRevertString);
        });

        it("Should revert if the adaptor is already added", async () => {
            await expect(Registry.connect(owner).addProtocol(Aave.address, PROTOCOL_SELECTORS)).to.be.revertedWith(
                allreadyAddedProtocolRevertString,
            );
        });

        it("Should add a non iToken protocol", async () => {
            let previousLength = (await Registry.getProtocols()).length;

            await Registry.connect(owner).addProtocol(USDC.address, PROTOCOL_SELECTORS);
            expect((await Registry.getProtocols()).length).to.equal(previousLength + 1);
        });

        it("Should not allow to add more protocols than limit", async () => {
            for (let i = 0; i < protocolsAmountLimit - protocols.length; i++) {
                let randomWallet = ethers.Wallet.createRandom();
                await Registry.addProtocol(randomWallet.address, PROTOCOL_SELECTORS);
            }
            let randomWallet = ethers.Wallet.createRandom();
            await expect(Registry.addProtocol(randomWallet.address, PROTOCOL_SELECTORS)).to.be.revertedWith(
                "Protocols limit amount exceeded",
            );
        });
    });

    describe("Remove protocol function", async () => {
        it("Should remove the protocol from allowed adaptors list", async () => {
            await Registry.connect(owner).removeProtocol(ethers.constants.Zero);
            expect((await Registry.getProtocols()).length).to.equal(protocols.length - 1);
        });

        it("Should revert if not the owner is trying to remove protocol", async () => {
            await expect(Registry.connect(charlie).removeProtocol(ethers.constants.Zero)).to.be.revertedWith(notOwnerRevertString);
        });

        it("Adaptor should become not allowed after removing a protocols", async () => {
            await Registry.connect(owner).removeProtocol(ethers.constants.Zero);
            expect(await Registry.isProtocol(protocols[0])).to.equal(false);
        });

        it("Should emit after removing protocol", async () => {
            await expect(Registry.connect(owner).removeProtocol(ethers.constants.Zero))
                .to.emit(Registry, "RemoveProtocol")
                .withArgs(0, protocols[0]);
        });

        it("Shouldn't remove any extra protocol", async () => {
            await Registry.connect(owner).removeProtocol(0);
            expect(protocols.slice(1).sort(sortFn)).eql([...(await Registry.getProtocols())].sort(sortFn));
        });
    });

    describe("AddIToken function", async () => {
        it("Should revert when not the owner is trying to set a new Itoken", async () => {
            await expect(Registry.connect(charlie).addIToken(WePiggy.address)).to.be.revertedWith(notOwnerRevertString);
        });

        it("Should revert if the adaptor is already added", async () => {
            await expect(Registry.connect(owner).addIToken(Aave.address)).to.be.revertedWith(allreadyAddedProtocolRevertString);
        });

        it("Should add an iToken", async () => {
            await Registry.connect(owner).addIToken(WePiggy.address);
            expect((await Registry.getITokens())[iTokens.length]).to.equal(WePiggy.address);
        });

        it("Should not allow to add more protocols than limit", async () => {
            for (let i = 0; i < iTokensAmountLimit - iTokens.length; i++) {
                let randomWallet = ethers.Wallet.createRandom();
                await Registry.addIToken(randomWallet.address);
            }
            let randomWallet = ethers.Wallet.createRandom();
            await expect(Registry.addIToken(randomWallet.address)).to.be.revertedWith("iTokens limit amount exceeded");
        });

        it("Should emit an event after adding a iToken", async () => {
            await expect(Registry.connect(owner).addIToken(WePiggy.address)).to.emit(Registry, "AddIToken").withArgs(WePiggy.address);
        });
    });

    describe("Remove IToken function", async () => {
        it("Should revert if not the owner is trying to remove iToken", async () => {
            await expect(Registry.connect(bob).removeIToken(0)).to.be.revertedWith(notOwnerRevertString);
        });

        it("Should revert if the owner is trying to remove iToken with non zero balancer", async () => {
            await Aave.connect(bob).transfer(Registry.address, ethers.constants.One);

            await expect(Registry.connect(owner).removeIToken(0)).to.be.revertedWith("IToken balance should be 0");
        });

        it("Shouldn't remove any extra iToken", async () => {
            await Registry.connect(owner).removeIToken(0);
            expect(iTokens.slice(1).sort(sortFn)).eql([...(await Registry.getITokens())].sort(sortFn));
        });

        it("Adaptor should become not allowed after removing an iToken", async () => {
            await Registry.connect(owner).removeIToken(ethers.constants.Zero);
            expect(await Registry.isIToken(iTokens[0])).to.equal(false);
        });

        it("Should emit after removing an iToken", async () => {
            await expect(await Registry.connect(owner).removeIToken(ethers.constants.Zero))
                .to.emit(Registry, "RemoveIToken")
                .withArgs(0, iTokens[0]);
        });
    });

    describe("Deposits pause function", async () => {
        it("Should revert if not the owner is trying to pause", async () => {
            await expect(Registry.connect(bob).setDepositsPaused(true)).to.be.revertedWith(notOwnerRevertString);
        });

        it("Should pause", async () => {
            await Registry.connect(owner).setDepositsPaused(true);

            expect(await Registry.depositsPaused()).to.equal(true);
        });

        it("Should unpause", async () => {
            await Registry.connect(owner).setDepositsPaused(true);
            await Registry.connect(owner).setDepositsPaused(false);

            expect(await Registry.depositsPaused()).to.equal(false);
        });

        it("Should emit after changing the status", async () => {
            await expect(Registry.connect(owner).setDepositsPaused(true)).to.emit(Registry, "SetDepositsPaused").withArgs(true);
        });
    });
});
