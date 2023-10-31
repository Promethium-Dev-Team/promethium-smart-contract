import {ethers, upgrades} from "hardhat";
import {expect} from "chai";
import {BigNumber} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {ERC20token, InterestBearing, PriceRouterMock, Rebalancer} from "../typechain-types";
import {ERC20token__factory} from "../typechain-types";
import {InterestBearing__factory} from "../typechain-types";
import {PriceRouterMock__factory} from "../typechain-types";

const sortFn = (a: string, b: string) => {
    return a.concat(b) < b.concat(a) ? 1 : a.concat(b) > b.concat(a) ? -1 : 0;
};

describe("Registry contract", async () => {
    let Rebalancer: Rebalancer;

    let USDT: ERC20token;
    let USDC: ERC20token;
    let Aave: InterestBearing;
    let Tender: InterestBearing;
    let Dolomite: InterestBearing;
    let Impermax: InterestBearing;
    let WePiggy: InterestBearing;

    let priceRouter: PriceRouterMock;

    let alice: SignerWithAddress;
    let bob: SignerWithAddress;
    let charlie: SignerWithAddress;
    let owner: SignerWithAddress;
    let rebalanceMatrixProvider: SignerWithAddress;

    let REBALANCE_PROVIDER_ROLE: string;

    let notOwnerRevertString: string;
    let allreadyAddedProtocolRevertString: string;

    let protocols: string[] = [];
    let PROTOCOL_SELECTORS: {deposit: string; withdraw: string};
    let protocolSelectors: {deposit: string; withdraw: string}[] = [];
    let iTokens: string[] = [];

    let protocolsAmountLimit: number;
    let iTokensAmountLimit: number;
    let poolSizeLimit: BigNumber;

    // before(async () => {
    //     [owner, alice, bob, charlie, rosa, rebalanceMatrixProvider] = await ethers.getSigners();

    //     USDT = await new ERC20token__factory(bob).deploy("Tether USD", "USDT");
    //     USDC = await new ERC20token__factory(charlie).deploy("USD coint", "USDC");

    //     Aave = await new InterestBearing__factory(bob).deploy(USDT.address, "AAVE Finance", "AAVE");
    //     Tender = await new InterestBearing__factory(bob).deploy(USDT.address, "Tender Finance", "TEND");
    //     Dolomite = await new InterestBearing__factory(bob).deploy(USDT.address, "Dolomite Finance", "DOLO");
    //     Impermax = await new InterestBearing__factory(bob).deploy(USDT.address, "Impermax Finance", "IMP");
    //     WePiggy = await new InterestBearing__factory(bob).deploy(USDT.address, "WEPiggy Finance", "PIG");

    //     priceRouter = await new PriceRouterMock__factory(bob).deploy();
    //     notOwnerRevertString = "Caller is not the owner";
    //     allreadyAddedPositionRevertString = "Already added";

    //     protocols = [Aave.address, Tender.address, Dolomite.address, Impermax.address];
    //     PROTOCOL_SELECTORS = {
    //         deposit: Aave.interface.getSighash("deposit"),
    //         withdraw: Aave.interface.getSighash("withdraw"),
    //     };
    //     protocolSelectors = protocols.map(() => PROTOCOL_SELECTORS);
    //     iTokens = [Aave.address, Tender.address, Dolomite.address, Impermax.address];

    //     protocolsAmountLimit = 12;
    //     iTokensAmountLimit = 12;
    //     poolLimit = 1e6;
    // });

    // beforeEach(async () => {
    //     REBALANCE_PROVIDER_ROLE = "0x524542414c414e43455f50524f56494445525f524f4c45000000000000000000";

    //     Rebalancer = (await upgrades.deployProxy(
    //         await ethers.getContractFactory("Rebalancer"),
    //         [protocols, protocolSelectors, iTokens, rebalanceMatrixProvider.address, priceRouter.address, poolLimit],
    //         {
    //             kind: "uups",
    //             initializer:
    //                 "initialize(address[] memory, struct(bytes4, bytes4)[] memory, address[] memory, address, address, uint256)",
    //         },
    //     )) as Rebalancer;
    // });

    before(async () => {
        [owner, alice, bob, charlie, rebalanceMatrixProvider] = await ethers.getSigners();

        USDT = await new ERC20token__factory(bob).deploy("Tether USD", "USDT");
        USDC = await new ERC20token__factory(charlie).deploy("USD coint", "USDC");

        Aave = await new InterestBearing__factory(bob).deploy(USDT.address, "AAVE Finance", "AAVE");
        Tender = await new InterestBearing__factory(bob).deploy(USDT.address, "Tender Finance", "TEND");
        Dolomite = await new InterestBearing__factory(bob).deploy(USDT.address, "Dolomite Finance", "DOLO");
        Impermax = await new InterestBearing__factory(bob).deploy(USDT.address, "Impermax Finance", "IMP");
        WePiggy = await new InterestBearing__factory(bob).deploy(USDT.address, "WEPiggy Finance", "PIG");

        await USDT.connect(bob).transfer(Aave.address, ethers.utils.parseEther("100000"));
        await USDT.connect(bob).transfer(Tender.address, ethers.utils.parseEther("100000"));
        await USDT.connect(bob).transfer(Dolomite.address, ethers.utils.parseEther("100000"));
        await USDT.connect(bob).transfer(Impermax.address, ethers.utils.parseEther("100000"));
        await USDT.connect(bob).transfer(WePiggy.address, ethers.utils.parseEther("100000"));

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
        poolSizeLimit = ethers.utils.parseUnits("50000", 18); //50000 tokens
    });

    beforeEach(async () => {
        REBALANCE_PROVIDER_ROLE = "0x524542414c414e43455f50524f56494445525f524f4c45000000000000000000";
        Rebalancer = (await upgrades.deployProxy(
            await ethers.getContractFactory("Rebalancer"),
            [
                USDT.address,
                "Promethium USDT",
                "USDT Share",
                protocols,
                protocolSelectors,
                iTokens,
                rebalanceMatrixProvider.address,
                priceRouter.address,
                poolSizeLimit,
            ],
            {
                kind: "uups",
                initializer:
                    "initialize(address, string memory, string memory, address[] memory, struct(bytes4,bytes4)[] memory, address[] memory, address, address, uint256)",
            },
        )) as Rebalancer;
    });

    describe("Deployment", async () => {
        it("Should not set the correct amount of protocols", async () => {
            expect((await Rebalancer.getProtocols()).length).to.equal(protocols.length);
        });

        it("Should not set the correct protocols", async () => {
            let registryProtocols = await Rebalancer.getProtocols();
            protocols.forEach((protocol, index) => expect(protocol).to.equal(registryProtocols[index]));
        });

        it("Should set the corect amount of iTokens", async () => {
            expect((await Rebalancer.getITokens()).length).to.equal(iTokens.length);
        });

        it("Should set the corect iTokens", async () => {
            let registryITokens = await Rebalancer.getITokens();
            iTokens.forEach((iToken, index) => expect(iToken).to.equal(registryITokens[index]));
        });

        it("Should set the correct rebalancer role after", async () => {
            expect(await Rebalancer.hasRole(REBALANCE_PROVIDER_ROLE, rebalanceMatrixProvider.address)).to.equal(true);
        });

        it("Should set price router address", async () => {
            expect(await Rebalancer.router()).to.equal(priceRouter.address);
        });
    });

    describe("Add protocol function", async () => {
        it("Should revert when not the owner is trying to set a new protocol", async () => {
            await expect(Rebalancer.connect(alice).addProtocol(USDC.address, PROTOCOL_SELECTORS)).to.be.revertedWith(notOwnerRevertString);
        });

        it("Should revert if the adaptor is already added", async () => {
            await expect(Rebalancer.connect(owner).addProtocol(Aave.address, PROTOCOL_SELECTORS)).to.be.revertedWith(
                allreadyAddedProtocolRevertString,
            );
        });

        it("Should add a non iToken protocol", async () => {
            let previousLength = (await Rebalancer.getProtocols()).length;

            await Rebalancer.connect(owner).addProtocol(USDC.address, PROTOCOL_SELECTORS);
            expect((await Rebalancer.getProtocols()).length).to.equal(previousLength + 1);
        });

        it("Should not allow to add more protocols than limit", async () => {
            for (let i = 0; i < protocolsAmountLimit - protocols.length; i++) {
                let randomWallet = ethers.Wallet.createRandom();
                await Rebalancer.addProtocol(randomWallet.address, PROTOCOL_SELECTORS);
            }
            let randomWallet = ethers.Wallet.createRandom();
            await expect(Rebalancer.addProtocol(randomWallet.address, PROTOCOL_SELECTORS)).to.be.revertedWith(
                "Protocols limit amount exceeded",
            );
        });
    });

    describe("Remove protocol function", async () => {
        it("Should remove the protocol from allowed adaptors list", async () => {
            await Rebalancer.connect(owner).removeProtocol(ethers.constants.Zero);
            expect((await Rebalancer.getProtocols()).length).to.equal(protocols.length - 1);
        });

        it("Should revert if not the owner is trying to remove protocol", async () => {
            await expect(Rebalancer.connect(charlie).removeProtocol(ethers.constants.Zero)).to.be.revertedWith(notOwnerRevertString);
        });

        it("Adaptor should become not allowed after removing a protocols", async () => {
            await Rebalancer.connect(owner).removeProtocol(ethers.constants.Zero);
            expect(await Rebalancer.isProtocol(protocols[0])).to.equal(false);
        });

        it("Should emit after removing protocol", async () => {
            await expect(Rebalancer.connect(owner).removeProtocol(ethers.constants.Zero))
                .to.emit(Rebalancer, "RemoveProtocol")
                .withArgs(0, protocols[0]);
        });

        it("Shouldn't remove any extra protocol", async () => {
            await Rebalancer.connect(owner).removeProtocol(0);
            expect(protocols.slice(1).sort(sortFn)).eql([...(await Rebalancer.getProtocols())].sort(sortFn));
        });
    });

    describe("AddIToken function", async () => {
        it("Should revert when not the owner is trying to set a new Itoken", async () => {
            await expect(Rebalancer.connect(charlie).addIToken(WePiggy.address)).to.be.revertedWith(notOwnerRevertString);
        });

        it("Should revert if the adaptor is already added", async () => {
            await expect(Rebalancer.connect(owner).addIToken(Aave.address)).to.be.revertedWith(allreadyAddedProtocolRevertString);
        });

        it("Should add an iToken", async () => {
            await Rebalancer.connect(owner).addIToken(WePiggy.address);
            expect((await Rebalancer.getITokens())[iTokens.length]).to.equal(WePiggy.address);
        });

        it("Should not allow to add more protocols than limit", async () => {
            for (let i = 0; i < iTokensAmountLimit - iTokens.length; i++) {
                let randomWallet = ethers.Wallet.createRandom();
                await Rebalancer.addIToken(randomWallet.address);
            }
            let randomWallet = ethers.Wallet.createRandom();
            await expect(Rebalancer.addIToken(randomWallet.address)).to.be.revertedWith("iTokens limit amount exceeded");
        });

        it("Should emit an event after adding a iToken", async () => {
            await expect(Rebalancer.connect(owner).addIToken(WePiggy.address)).to.emit(Rebalancer, "AddIToken").withArgs(WePiggy.address);
        });
    });

    describe("Remove IToken function", async () => {
        it("Should revert if not the owner is trying to remove iToken", async () => {
            await expect(Rebalancer.connect(bob).removeIToken(0)).to.be.revertedWith(notOwnerRevertString);
        });

        it("Should revert if the owner is trying to remove iToken with non zero balancer", async () => {
            await Aave.connect(bob).transfer(Rebalancer.address, ethers.constants.One);

            await expect(Rebalancer.connect(owner).removeIToken(0)).to.be.revertedWith("IToken balance should be 0");
        });

        it("Shouldn't remove any extra iToken", async () => {
            await Rebalancer.connect(owner).removeIToken(0);
            expect(iTokens.slice(1).sort(sortFn)).eql([...(await Rebalancer.getITokens())].sort(sortFn));
        });

        it("Adaptor should become not allowed after removing an iToken", async () => {
            await Rebalancer.connect(owner).removeIToken(ethers.constants.Zero);
            expect(await Rebalancer.isIToken(iTokens[0])).to.equal(false);
        });

        it("Should emit after removing an iToken", async () => {
            await expect(await Rebalancer.connect(owner).removeIToken(ethers.constants.Zero))
                .to.emit(Rebalancer, "RemoveIToken")
                .withArgs(0, iTokens[0]);
        });
    });

    describe("Deposits pause function", async () => {
        it("Should revert if not the owner is trying to pause", async () => {
            await expect(Rebalancer.connect(bob).setDepositsPaused(true)).to.be.revertedWith(notOwnerRevertString);
        });

        it("Should pause", async () => {
            await Rebalancer.connect(owner).setDepositsPaused(true);

            expect(await Rebalancer.depositsPaused()).to.equal(true);
        });

        it("Should unpause", async () => {
            await Rebalancer.connect(owner).setDepositsPaused(true);
            await Rebalancer.connect(owner).setDepositsPaused(false);

            expect(await Rebalancer.depositsPaused()).to.equal(false);
        });

        it("Should emit after changing the status", async () => {
            await expect(Rebalancer.connect(owner).setDepositsPaused(true)).to.emit(Rebalancer, "SetDepositsPaused").withArgs(true);
        });
    });
});
