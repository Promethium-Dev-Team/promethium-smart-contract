import {ethers} from "hardhat";
import {Contract, BigNumber} from "ethers";
import {expect} from "chai";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {ERC20token__factory} from "../typechain-types";
import {InterestBearning__factory} from "../typechain-types";
import {PriceRouterMock__factory} from "../typechain-types";
import {Rebalancer__factory} from "../typechain-types";

describe("Rebalancer contract", async () => {
    let Rebalancer: Contract;

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
    let autocompoundMatrixProvider: SignerWithAddress;

    let REBALANCE_PROVIDER_ROLE: string;
    let AUTOCOMPOUND_PROVIDER_ROLE: string;

    let notOwnerRevertString: string;
    let allreadyAddedPositionRevertString: string;

    let positions: string[] = [];
    let iTokens: string[] = [];
    let whitelist: string[] = [];

    let positionsAmountLimit: number;
    let iTokensAmountLimit: number;
    let poolSizeLimit: BigNumber;

    let performanceFee: BigNumber;
    let withdrawalFee: BigNumber;

    let bobDepositValue: BigNumber;

    before(async () => {
        [owner, alice, bob, charlie, rosa, rebalanceMatrixProvider, autocompoundMatrixProvider] =
            await ethers.getSigners();

        USDT = await new ERC20token__factory(bob).deploy("Tether USD", "USDT");
        USDC = await new ERC20token__factory(charlie).deploy("USD coint", "USDC");

        Aave = await new InterestBearning__factory(bob).deploy(USDT.address, "AAVE Finance", "AAVE");
        Tender = await new InterestBearning__factory(bob).deploy(USDT.address, "Tender Finance", "TEND");
        Dolomite = await new InterestBearning__factory(bob).deploy(USDT.address, "Dolomite Finance", "DOLO");
        Impermax = await new InterestBearning__factory(bob).deploy(USDT.address, "Impermax Finance", "IMP");
        WePiggy = await new InterestBearning__factory(bob).deploy(USDT.address, "WEPiggy Finance", "PIG");

        await USDT.connect(bob).transfer(Aave.address, ethers.utils.parseEther("100000"));
        await USDT.connect(bob).transfer(Tender.address, ethers.utils.parseEther("100000"));
        await USDT.connect(bob).transfer(Dolomite.address, ethers.utils.parseEther("100000"));
        await USDT.connect(bob).transfer(Impermax.address, ethers.utils.parseEther("100000"));
        await USDT.connect(bob).transfer(WePiggy.address, ethers.utils.parseEther("100000"));

        priceRouter = await new PriceRouterMock__factory(bob).deploy();

        notOwnerRevertString = "Caller is not the owner";
        allreadyAddedPositionRevertString = "Already added";

        positions = [USDT.address];
        iTokens = [Aave.address, Tender.address, Dolomite.address, Impermax.address];
        whitelist = [alice.address, bob.address];

        positionsAmountLimit = 12;
        iTokensAmountLimit = 12;
        poolSizeLimit = ethers.utils.parseUnits("1000", 18); //1000 tokens

        performanceFee = ethers.utils.parseUnits("1", 17);
        withdrawalFee = ethers.utils.parseUnits("1", 15);

        bobDepositValue = ethers.utils.parseUnits("100", 18);
    });

    beforeEach(async () => {
        REBALANCE_PROVIDER_ROLE = "0x524542414c414e43455f50524f56494445525f524f4c45000000000000000000";
        AUTOCOMPOUND_PROVIDER_ROLE = "0x4155544f434f4d504f554e445f50524f56494445525f524f4c45000000000000";
        Rebalancer = await new Rebalancer__factory(owner).deploy(
            USDT.address,
            "Promethium USDT",
            "USDT Share",
            positions,
            iTokens,
            rebalanceMatrixProvider.address,
            autocompoundMatrixProvider.address,
            priceRouter.address,
            whitelist,
            poolSizeLimit,
        );
    });

    describe("Deployment", async () => {
        it("Should set the correct performance fee", async () => {
            expect((await Rebalancer.FeeData())[0]).to.equal(performanceFee);
        });

        it("Should set the correct withdrawal fee", async () => {
            expect((await Rebalancer.FeeData())[1]).to.equal(withdrawalFee);
        });

        it("Should set the correct treasury", async () => {
            expect((await Rebalancer.FeeData())[2]).to.equal(owner.address);
        });

        it("Should set the correct pool limit size", async () => {
            expect(await Rebalancer.poolLimitSize()).to.equal(poolSizeLimit);
        });

        it("Total assets should be equal to 0 after deployment", async () => {
            expect(await Rebalancer.totalAssets()).to.equal(ethers.constants.Zero);
        });
    });

    describe("Total Assets function", async () => {
        it("Should correctly calculate total assets", async () => {
            await USDT.connect(bob).approve(Rebalancer.address, bobDepositValue);
            await Rebalancer.connect(bob).deposit(bobDepositValue, bob.address);

            expect(await Rebalancer.totalAssets()).to.equal(bobDepositValue);
        });

        it("Should correctly calculate total assets when the part of the token deposited to the pool", async () => {
            await USDT.connect(bob).approve(Rebalancer.address, bobDepositValue);
            await Rebalancer.connect(bob).deposit(bobDepositValue, bob.address);

            let rebalanceTransactions = [];
            let transaction = USDT.interface.encodeFunctionData("approve", [Aave.address, bobDepositValue.div(2)]);
            rebalanceTransactions.push({adaptor: USDT.address, callData: transaction});
            transaction = Aave.interface.encodeFunctionData("deposit", [bobDepositValue.div(2)]);
            rebalanceTransactions.push({adaptor: Aave.address, callData: transaction});

            let currentBlock = await ethers.provider.getBlockNumber();
            await Rebalancer.connect(rebalanceMatrixProvider).rebalance(rebalanceTransactions, currentBlock);

            expect(await Rebalancer.totalAssets()).to.equal(bobDepositValue);
        });
    });

    describe("Get available fee function", async () => {
        it("Performance fee should be equal to 0 after the deposit", async () => {
            await USDT.connect(bob).approve(Rebalancer.address, bobDepositValue);
            await Rebalancer.connect(bob).deposit(bobDepositValue, bob.address);

            expect(await Rebalancer.getAvailableFee()).to.equal(ethers.constants.Zero);
        });

        it("Should correctly calculate performance fee", async () => {
            await USDT.connect(bob).approve(Rebalancer.address, bobDepositValue);
            await Rebalancer.connect(bob).deposit(bobDepositValue, bob.address);
            await USDT.connect(bob).transfer(Rebalancer.address, bobDepositValue);

            let expectedFee = bobDepositValue
                .mul(performanceFee)
                .div(ethers.utils.parseUnits("1", await Rebalancer.feeDecimals()));

            expect(await Rebalancer.getAvailableFee()).to.equal(expectedFee);
        });

        it("Performance fee should be 0 after claim", async () => {
            await USDT.connect(bob).transfer(Rebalancer.address, bobDepositValue);
            await Rebalancer.connect(owner).claimFee();

            expect(await Rebalancer.getAvailableFee()).to.equal(ethers.constants.Zero);
        });

        it("Performance fee should be equal to 0 when pool balance become lower", async () => {
            await USDT.connect(bob).approve(Rebalancer.address, bobDepositValue);
            await Rebalancer.connect(bob).deposit(bobDepositValue, bob.address);

            let rebalanceTransactions = [];
            let transaction = USDT.interface.encodeFunctionData("transfer", [owner.address, 1]);
            rebalanceTransactions.push({adaptor: USDT.address, callData: transaction});
            let currentBlock = await ethers.provider.getBlockNumber();
            await Rebalancer.connect(rebalanceMatrixProvider).rebalance(rebalanceTransactions, currentBlock);
            expect(await Rebalancer.getAvailableFee()).to.equal(ethers.constants.Zero);
        });
    });

    describe("Total assets without fee function", async () => {
        it("Should correctly calculate total pool balance", async () => {
            await USDT.connect(bob).approve(Rebalancer.address, bobDepositValue);
            await Rebalancer.connect(bob).deposit(bobDepositValue, bob.address);
            await USDT.connect(bob).transfer(Rebalancer.address, bobDepositValue);

            let expectedFee = bobDepositValue
                .mul(performanceFee)
                .div(ethers.utils.parseUnits("1", await Rebalancer.feeDecimals()));

            expect(await Rebalancer.totalAssets()).to.equal(bobDepositValue.add(bobDepositValue).sub(expectedFee));
        });
    });

    describe("Rebalance function", async () => {
        it("Should revert when to the rebalance provider is trying to execute", async () => {
            await USDT.connect(bob).approve(Rebalancer.address, bobDepositValue);
            await Rebalancer.connect(bob).deposit(bobDepositValue, bob.address);

            let rebalanceTransactions = [];
            let transaction = USDT.interface.encodeFunctionData("approve", [Aave.address, bobDepositValue.div(2)]);
            rebalanceTransactions.push({adaptor: USDT.address, callData: transaction});
            transaction = Aave.interface.encodeFunctionData("deposit", [bobDepositValue.div(2)]);
            rebalanceTransactions.push({adaptor: Aave.address, callData: transaction});
            let currentBlock = await ethers.provider.getBlockNumber();
            await expect(Rebalancer.connect(bob).rebalance(rebalanceTransactions, currentBlock)).to.be.revertedWith(
                "Caller is not a rabalance provider",
            );
        });

        it("Should revert when balance became too low after rebalance", async () => {
            await USDT.connect(bob).approve(Rebalancer.address, bobDepositValue);
            await Rebalancer.connect(bob).deposit(bobDepositValue, bob.address);

            let maxPossibleBalanceDrop = bobDepositValue
                .mul(await Rebalancer.REBALANCE_THRESHOLD())
                .div(ethers.utils.parseUnits("1", 18));

            let rebalanceTransactions = [];
            let transaction = USDT.interface.encodeFunctionData("transfer", [
                owner.address,
                maxPossibleBalanceDrop.add(1),
            ]);
            rebalanceTransactions.push({adaptor: USDT.address, callData: transaction});
            let currentBlock = await ethers.provider.getBlockNumber();
            await expect(
                Rebalancer.connect(rebalanceMatrixProvider).rebalance(rebalanceTransactions, currentBlock),
            ).to.be.revertedWith("Asset balance become too low");
        });

        it("Should emit after rebalance", async () => {
            await USDT.connect(bob).approve(Rebalancer.address, bobDepositValue);
            await Rebalancer.connect(bob).deposit(bobDepositValue, bob.address);

            let rebalanceTransactions = [];
            let transaction = USDT.interface.encodeFunctionData("approve", [Aave.address, bobDepositValue.div(2)]);
            rebalanceTransactions.push({adaptor: USDT.address, callData: transaction});
            transaction = Aave.interface.encodeFunctionData("deposit", [bobDepositValue.div(2)]);
            rebalanceTransactions.push({adaptor: Aave.address, callData: transaction});
            let currentBlock = await ethers.provider.getBlockNumber();
            await expect(
                await Rebalancer.connect(rebalanceMatrixProvider).rebalance(rebalanceTransactions, currentBlock),
            )
                .to.emit(Rebalancer, "Rebalance")
                .withArgs(currentBlock);
        });
    });

    describe("Request withdrawal function", async () => {
        it("Should revert when user is trying to reedeem more shares than he has", async () => {
            await USDT.connect(bob).approve(Rebalancer.address, bobDepositValue);
            await Rebalancer.connect(bob).deposit(bobDepositValue, bob.address);
            let bobShares = await Rebalancer.balanceOf(bob.address);
            await expect(Rebalancer.connect(bob).requestWithdraw(bobShares.add(1))).to.be.revertedWith(
                "ERC4626: withdraw more than max",
            );
        });

        it("Should revert when the balance of pool is enough for instant withdraw", async () => {
            await USDT.connect(bob).approve(Rebalancer.address, bobDepositValue);
            await Rebalancer.connect(bob).deposit(bobDepositValue, bob.address);

            let rebalanceTransactions = [];
            let transaction = USDT.interface.encodeFunctionData("approve", [Aave.address, bobDepositValue.div(2)]);
            rebalanceTransactions.push({adaptor: USDT.address, callData: transaction});
            transaction = Aave.interface.encodeFunctionData("deposit", [bobDepositValue.div(2)]);
            rebalanceTransactions.push({adaptor: Aave.address, callData: transaction});
            let currentBlock = await ethers.provider.getBlockNumber();
            await Rebalancer.connect(rebalanceMatrixProvider).rebalance(rebalanceTransactions, currentBlock);

            let sharesThreshold = await Rebalancer.convertToShares((await Rebalancer.totalAssets()).div(2));
            await expect(Rebalancer.connect(bob).requestWithdraw(sharesThreshold.mul(9).div(10))).to.be.revertedWith(
                "Instant withdraw is available",
            );
        });

        it("Should not allow request when the queue is full", async () => {
            await USDT.connect(bob).approve(Rebalancer.address, bobDepositValue);
            await Rebalancer.connect(bob).deposit(bobDepositValue, bob.address);

            let rebalanceTransactions = [];
            let transaction = USDT.interface.encodeFunctionData("approve", [Aave.address, bobDepositValue]);
            rebalanceTransactions.push({adaptor: USDT.address, callData: transaction});
            transaction = Aave.interface.encodeFunctionData("deposit", [bobDepositValue]);
            rebalanceTransactions.push({adaptor: Aave.address, callData: transaction});
            let currentBlock = await ethers.provider.getBlockNumber();
            await Rebalancer.connect(rebalanceMatrixProvider).rebalance(rebalanceTransactions, currentBlock);

            let maxRequests = await Rebalancer.WITHDRAW_QUEUE_LIMIT();

            for (let i = 0; i < maxRequests; i++) {
                await Rebalancer.connect(bob).requestWithdraw(ethers.constants.One);
            }

            await expect(Rebalancer.connect(bob).requestWithdraw(ethers.constants.One)).to.be.revertedWith(
                "Withdraw queue limit exceeded",
            );
        });

        it("Should lock shares after withdraw", async () => {
            await USDT.connect(bob).approve(Rebalancer.address, bobDepositValue);
            await Rebalancer.connect(bob).deposit(bobDepositValue, bob.address);

            let rebalanceTransactions = [];
            let transaction = USDT.interface.encodeFunctionData("approve", [Aave.address, bobDepositValue]);
            rebalanceTransactions.push({adaptor: USDT.address, callData: transaction});
            transaction = Aave.interface.encodeFunctionData("deposit", [bobDepositValue]);
            rebalanceTransactions.push({adaptor: Aave.address, callData: transaction});
            let currentBlock = await ethers.provider.getBlockNumber();
            await Rebalancer.connect(rebalanceMatrixProvider).rebalance(rebalanceTransactions, currentBlock);

            let bobShares = await Rebalancer.balanceOf(bob.address);
            await Rebalancer.connect(bob).requestWithdraw(bobShares.div(2));

            expect(await Rebalancer.lockedShares(bob.address)).to.equal(bobShares.div(2));
        });

        it("Should set the correct user maxReedem after request", async () => {
            await USDT.connect(bob).approve(Rebalancer.address, bobDepositValue);
            await Rebalancer.connect(bob).deposit(bobDepositValue, bob.address);

            let rebalanceTransactions = [];
            let transaction = USDT.interface.encodeFunctionData("approve", [Aave.address, bobDepositValue]);
            rebalanceTransactions.push({adaptor: USDT.address, callData: transaction});
            transaction = Aave.interface.encodeFunctionData("deposit", [bobDepositValue]);
            rebalanceTransactions.push({adaptor: Aave.address, callData: transaction});
            let currentBlock = await ethers.provider.getBlockNumber();
            await Rebalancer.connect(rebalanceMatrixProvider).rebalance(rebalanceTransactions, currentBlock);

            let bobShares = await Rebalancer.balanceOf(bob.address);
            await Rebalancer.connect(bob).requestWithdraw(bobShares.div(2));

            expect(await Rebalancer.maxRedeem(bob.address)).to.equal(bobShares.div(2));
        });

        it("Shouldn't allow to transfer when shares are locked", async () => {
            await USDT.connect(bob).approve(Rebalancer.address, bobDepositValue);
            await Rebalancer.connect(bob).deposit(bobDepositValue, bob.address);

            let rebalanceTransactions = [];
            let transaction = USDT.interface.encodeFunctionData("approve", [Aave.address, bobDepositValue]);
            rebalanceTransactions.push({adaptor: USDT.address, callData: transaction});
            transaction = Aave.interface.encodeFunctionData("deposit", [bobDepositValue]);
            rebalanceTransactions.push({adaptor: Aave.address, callData: transaction});
            let currentBlock = await ethers.provider.getBlockNumber();
            await Rebalancer.connect(rebalanceMatrixProvider).rebalance(rebalanceTransactions, currentBlock);

            let bobShares = await Rebalancer.balanceOf(bob.address);
            await Rebalancer.connect(bob).requestWithdraw(bobShares);

            await expect(Rebalancer.connect(bob).transfer(charlie.address, ethers.constants.One)).to.be.revertedWith(
                "Transferring more than max available",
            );
        });

        it("Should increase the total amount of shares to withdraw while next rebalance", async () => {
            await USDT.connect(bob).approve(Rebalancer.address, bobDepositValue);
            await Rebalancer.connect(bob).deposit(bobDepositValue, bob.address);

            let rebalanceTransactions = [];
            let transaction = USDT.interface.encodeFunctionData("approve", [Aave.address, bobDepositValue]);
            rebalanceTransactions.push({adaptor: USDT.address, callData: transaction});
            transaction = Aave.interface.encodeFunctionData("deposit", [bobDepositValue]);
            rebalanceTransactions.push({adaptor: Aave.address, callData: transaction});
            let currentBlock = await ethers.provider.getBlockNumber();
            await Rebalancer.connect(rebalanceMatrixProvider).rebalance(rebalanceTransactions, currentBlock);

            let bobShares = await Rebalancer.balanceOf(bob.address);
            await Rebalancer.connect(bob).requestWithdraw(bobShares);

            expect(await Rebalancer.totalRequested()).to.equal(bobShares);
        });

        it("Should emit after withdrawal request", async () => {
            await USDT.connect(bob).approve(Rebalancer.address, bobDepositValue);
            await Rebalancer.connect(bob).deposit(bobDepositValue, bob.address);

            let rebalanceTransactions = [];
            let transaction = USDT.interface.encodeFunctionData("approve", [Aave.address, bobDepositValue]);
            rebalanceTransactions.push({adaptor: USDT.address, callData: transaction});
            transaction = Aave.interface.encodeFunctionData("deposit", [bobDepositValue]);
            rebalanceTransactions.push({adaptor: Aave.address, callData: transaction});
            let currentBlock = await ethers.provider.getBlockNumber();
            await Rebalancer.connect(rebalanceMatrixProvider).rebalance(rebalanceTransactions, currentBlock);

            let bobShares = await Rebalancer.balanceOf(bob.address);

            await expect(Rebalancer.connect(bob).requestWithdraw(bobShares))
                .to.emit(Rebalancer, "RequestWithdraw")
                .withArgs(bob.address, bobShares, ethers.constants.One);
        });

        it("Request id should be unique", async () => {
            await USDT.connect(bob).approve(Rebalancer.address, bobDepositValue);
            await Rebalancer.connect(bob).deposit(bobDepositValue, bob.address);

            let rebalanceTransactions = [];
            let transaction = USDT.interface.encodeFunctionData("approve", [Aave.address, bobDepositValue]);
            rebalanceTransactions.push({adaptor: USDT.address, callData: transaction});
            transaction = Aave.interface.encodeFunctionData("deposit", [bobDepositValue]);
            rebalanceTransactions.push({adaptor: Aave.address, callData: transaction});
            let currentBlock = await ethers.provider.getBlockNumber();
            await Rebalancer.connect(rebalanceMatrixProvider).rebalance(rebalanceTransactions, currentBlock);

            let bobShares = await Rebalancer.balanceOf(bob.address);
            await expect(Rebalancer.connect(bob).requestWithdraw(bobShares.div(4)))
                .to.emit(Rebalancer, "RequestWithdraw")
                .withArgs(bob.address, bobShares.div(4), ethers.constants.One);
            await expect(Rebalancer.connect(bob).requestWithdraw(bobShares.div(4)))
                .to.emit(Rebalancer, "RequestWithdraw")
                .withArgs(bob.address, bobShares.div(4), ethers.constants.Two);
            await expect(Rebalancer.connect(bob).requestWithdraw(bobShares.div(4)))
                .to.emit(Rebalancer, "RequestWithdraw")
                .withArgs(bob.address, bobShares.div(4), BigNumber.from(3));
        });
    });

    describe("Fullfit withdrawals function", async () => {
        it("Should not left locked shares after completing withrawal", async () => {
            await USDT.connect(bob).approve(Rebalancer.address, bobDepositValue);
            await Rebalancer.connect(bob).deposit(bobDepositValue, bob.address);

            let rebalanceTransactions = [];
            let transaction = USDT.interface.encodeFunctionData("approve", [Aave.address, bobDepositValue]);
            rebalanceTransactions.push({adaptor: USDT.address, callData: transaction});
            transaction = Aave.interface.encodeFunctionData("deposit", [bobDepositValue]);
            rebalanceTransactions.push({adaptor: Aave.address, callData: transaction});
            let currentBlock = await ethers.provider.getBlockNumber();
            await Rebalancer.connect(rebalanceMatrixProvider).rebalance(rebalanceTransactions, currentBlock);

            let bobShares = await Rebalancer.balanceOf(bob.address);
            await Rebalancer.connect(bob).requestWithdraw(bobShares.div(2));

            rebalanceTransactions = [];
            transaction = Aave.interface.encodeFunctionData("withdraw", [await Aave.balanceOf(Rebalancer.address)]);
            rebalanceTransactions.push({adaptor: Aave.address, callData: transaction});
            currentBlock = await ethers.provider.getBlockNumber();
            await Rebalancer.connect(rebalanceMatrixProvider).rebalance(rebalanceTransactions, currentBlock);

            expect(await Rebalancer.lockedShares(bob.address)).to.equal(ethers.constants.Zero);
        });

        it("Withraw queue should be empty after rebalance", async () => {
            await USDT.connect(bob).approve(Rebalancer.address, bobDepositValue);
            await Rebalancer.connect(bob).deposit(bobDepositValue, bob.address);

            let rebalanceTransactions = [];
            let transaction = USDT.interface.encodeFunctionData("approve", [Aave.address, bobDepositValue]);
            rebalanceTransactions.push({adaptor: USDT.address, callData: transaction});
            transaction = Aave.interface.encodeFunctionData("deposit", [bobDepositValue]);
            rebalanceTransactions.push({adaptor: Aave.address, callData: transaction});
            let currentBlock = await ethers.provider.getBlockNumber();
            await Rebalancer.connect(rebalanceMatrixProvider).rebalance(rebalanceTransactions, currentBlock);

            let bobShares = await Rebalancer.balanceOf(bob.address);
            await Rebalancer.connect(bob).requestWithdraw(bobShares.div(2));

            rebalanceTransactions = [];
            transaction = Aave.interface.encodeFunctionData("withdraw", [await Aave.balanceOf(Rebalancer.address)]);
            rebalanceTransactions.push({adaptor: Aave.address, callData: transaction});
            currentBlock = await ethers.provider.getBlockNumber();
            await Rebalancer.connect(rebalanceMatrixProvider).rebalance(rebalanceTransactions, currentBlock);
            await Rebalancer.connect(bob).requestWithdraw(bobShares.div(2));

            expect((await Rebalancer.withdrawQueue(0)).id).to.equal(ethers.constants.Two);
        });

        it("Should amit after a completing a request", async () => {
            await USDT.connect(bob).approve(Rebalancer.address, bobDepositValue);
            await Rebalancer.connect(bob).deposit(bobDepositValue, bob.address);

            let rebalanceTransactions = [];
            let transaction = USDT.interface.encodeFunctionData("approve", [Aave.address, bobDepositValue]);
            rebalanceTransactions.push({adaptor: USDT.address, callData: transaction});
            transaction = Aave.interface.encodeFunctionData("deposit", [bobDepositValue]);
            rebalanceTransactions.push({adaptor: Aave.address, callData: transaction});
            let currentBlock = await ethers.provider.getBlockNumber();
            await Rebalancer.connect(rebalanceMatrixProvider).rebalance(rebalanceTransactions, currentBlock);

            let bobShares = await Rebalancer.balanceOf(bob.address);
            await Rebalancer.connect(bob).requestWithdraw(bobShares.div(2));

            rebalanceTransactions = [];
            transaction = Aave.interface.encodeFunctionData("withdraw", [await Aave.balanceOf(Rebalancer.address)]);
            rebalanceTransactions.push({adaptor: Aave.address, callData: transaction});
            currentBlock = await ethers.provider.getBlockNumber();
            await expect(
                Rebalancer.connect(rebalanceMatrixProvider).rebalance(rebalanceTransactions, currentBlock),
            ).to.emit(Rebalancer, "WithdrawalCompleted");
        });

        it("Total requested shares should be equal to zero after rebalance", async () => {
            await USDT.connect(bob).approve(Rebalancer.address, bobDepositValue);
            await Rebalancer.connect(bob).deposit(bobDepositValue, bob.address);

            let rebalanceTransactions = [];
            let transaction = USDT.interface.encodeFunctionData("approve", [Aave.address, bobDepositValue]);
            rebalanceTransactions.push({adaptor: USDT.address, callData: transaction});
            transaction = Aave.interface.encodeFunctionData("deposit", [bobDepositValue]);
            rebalanceTransactions.push({adaptor: Aave.address, callData: transaction});
            let currentBlock = await ethers.provider.getBlockNumber();
            await Rebalancer.connect(rebalanceMatrixProvider).rebalance(rebalanceTransactions, currentBlock);

            let bobShares = await Rebalancer.balanceOf(bob.address);
            await Rebalancer.connect(bob).requestWithdraw(bobShares.div(2));

            rebalanceTransactions = [];
            transaction = Aave.interface.encodeFunctionData("withdraw", [await Aave.balanceOf(Rebalancer.address)]);
            rebalanceTransactions.push({adaptor: Aave.address, callData: transaction});
            currentBlock = await ethers.provider.getBlockNumber();
            await Rebalancer.connect(rebalanceMatrixProvider).rebalance(rebalanceTransactions, currentBlock);

            expect(await Rebalancer.totalRequested()).to.equal(ethers.constants.Zero);
        });

        it("Should burn user shares after completing a withdrawal", async () => {
            await USDT.connect(bob).approve(Rebalancer.address, bobDepositValue);
            await Rebalancer.connect(bob).deposit(bobDepositValue, bob.address);

            let rebalanceTransactions = [];
            let transaction = USDT.interface.encodeFunctionData("approve", [Aave.address, bobDepositValue]);
            rebalanceTransactions.push({adaptor: USDT.address, callData: transaction});
            transaction = Aave.interface.encodeFunctionData("deposit", [bobDepositValue]);
            rebalanceTransactions.push({adaptor: Aave.address, callData: transaction});
            let currentBlock = await ethers.provider.getBlockNumber();
            await Rebalancer.connect(rebalanceMatrixProvider).rebalance(rebalanceTransactions, currentBlock);

            let bobShares = await Rebalancer.balanceOf(bob.address);
            await Rebalancer.connect(bob).requestWithdraw(bobShares.div(2));

            rebalanceTransactions = [];
            transaction = Aave.interface.encodeFunctionData("withdraw", [await Aave.balanceOf(Rebalancer.address)]);
            rebalanceTransactions.push({adaptor: Aave.address, callData: transaction});
            currentBlock = await ethers.provider.getBlockNumber();
            await Rebalancer.connect(rebalanceMatrixProvider).rebalance(rebalanceTransactions, currentBlock);

            expect(await Rebalancer.balanceOf(bob.address)).to.equal(bobShares.div(2));
        });
    });

    describe("Claim fee function", async () => {
        it("Should revert if not the owner is trying to claim the fee", async () => {
            await expect(Rebalancer.connect(bob).claimFee()).to.be.revertedWith(notOwnerRevertString);
        });

        it("Should claim the correct amount of tax", async () => {
            await USDT.connect(bob).transfer(Rebalancer.address, bobDepositValue);
            let fee = await Rebalancer.getAvailableFee();
            expect(await Rebalancer.connect(owner).claimFee()).to.changeTokenBalances(
                USDT,
                [Rebalancer.address, owner.address],
                [fee.mul(ethers.constants.NegativeOne), fee],
            );
        });

        it("Should emit after claiming a fee", async () => {
            await USDT.connect(bob).transfer(Rebalancer.address, bobDepositValue);
            let fee = await Rebalancer.getAvailableFee();
            await expect(Rebalancer.connect(owner).claimFee())
                .to.emit(Rebalancer, "FeesCharged")
                .withArgs(owner.address, fee);
        });
    });

    describe("Deposit overriding", async () => {
        it("Should not allow to add itoken if the router does not support it", async () => {
            await expect(Rebalancer.connect(owner).addIToken(ethers.constants.AddressZero)).to.be.revertedWith(
                "Not supported token",
            );
        });
        it("Should revert when not whitelist person is trying to deposit", async () => {
            await expect(Rebalancer.connect(charlie).deposit(ethers.constants.One, charlie.address)).to.be.revertedWith(
                "Caller is not whitelisted",
            );
        });
    });

    describe("Set fee function", async () => {
        it("Should revert when not the owner is trying to set the fee", async () => {
            let newFee = {
                performanceFee: performanceFee.mul(2),
                withdrawFee: withdrawalFee.mul(2),
                treasury: bob.address,
            };
            await expect(Rebalancer.connect(bob).setFee(newFee)).to.be.revertedWith(notOwnerRevertString);
        });

        it("Should revert when trying to set performance fee higher than max", async () => {
            let newFee = {
                performanceFee: (await Rebalancer.MAX_PERFORMANCE_FEE()).add(1),
                withdrawFee: withdrawalFee,
                treasury: owner.address,
            };
            await expect(Rebalancer.connect(owner).setFee(newFee)).to.be.revertedWith("Performance fee limit exceeded");
        });

        it("Should revert when trying to set withdrawal fee higher than max", async () => {
            let newFee = {
                performanceFee: performanceFee,
                withdrawFee: (await Rebalancer.MAX_WITHDRAW_FEE()).add(1),
                treasury: owner.address,
            };
            await expect(Rebalancer.connect(owner).setFee(newFee)).to.be.revertedWith("Withdraw fee limit exceeded");
        });

        it("Should claim fee before setting the new value", async () => {
            await USDT.connect(bob).transfer(Rebalancer.address, bobDepositValue);
            let fee = await Rebalancer.getAvailableFee();

            let newFee = {
                performanceFee: performanceFee,
                withdrawFee: withdrawalFee,
                treasury: owner.address,
            };
            expect(await Rebalancer.connect(owner).setFee(newFee)).to.changeTokenBalances(
                USDT,
                [Rebalancer.address, owner.address],
                [fee.mul(ethers.constants.NegativeOne), fee],
            );
        });

        it("Should change the fees", async () => {
            let newFee = {
                performanceFee: performanceFee,
                withdrawFee: withdrawalFee,
                treasury: owner.address,
            };
            let rebalancerFees = await Rebalancer.FeeData();
            expect(rebalancerFees[0]).to.equal(newFee.performanceFee);
            expect(rebalancerFees[1]).to.equal(newFee.withdrawFee);
            expect(rebalancerFees[2]).to.equal(newFee.treasury);
        });
    });

    describe("Harvest function", async () => {
        it("Should revert when to the autocompound provider is trying to compound", async () => {
            await USDT.connect(bob).approve(Rebalancer.address, bobDepositValue);
            await Rebalancer.connect(bob).deposit(bobDepositValue, bob.address);

            let autocompoundTransactions = [];
            let transaction = USDT.interface.encodeFunctionData("approve", [Aave.address, bobDepositValue]);
            autocompoundTransactions.push({adaptor: USDT.address, callData: transaction});
            transaction = Aave.interface.encodeFunctionData("deposit", [bobDepositValue]);
            autocompoundTransactions.push({adaptor: Aave.address, callData: transaction});
            let currentBlock = await ethers.provider.getBlockNumber();
            await expect(
                Rebalancer.connect(rebalanceMatrixProvider).harvest(autocompoundTransactions, currentBlock),
            ).to.be.revertedWith("Caller is not a autocompound provider");
        });

        it("Should revert when the pool balance become lower after autocompound", async () => {
            await USDT.connect(bob).approve(Rebalancer.address, bobDepositValue);
            await Rebalancer.connect(bob).deposit(bobDepositValue, bob.address);

            let autocompoundTransactions = [];
            let transaction = USDT.interface.encodeFunctionData("transfer", [charlie.address, ethers.constants.One]);
            autocompoundTransactions.push({adaptor: USDT.address, callData: transaction});
            let currentBlock = await ethers.provider.getBlockNumber();
            await expect(
                Rebalancer.connect(autocompoundMatrixProvider).harvest(autocompoundTransactions, currentBlock),
            ).to.be.revertedWith("Balance after should be greater");
        });
    });
});
