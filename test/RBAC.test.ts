import {ethers, upgrades} from "hardhat";
import {expect} from "chai";
import {BigNumber} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {Rebalancer} from "../typechain-types";
import {ERC20token, ERC20token__factory, InterestBearing, PriceRouterMock} from "../typechain-types";
import {InterestBearing__factory} from "../typechain-types";
import {PriceRouterMock__factory} from "../typechain-types";

describe("RBAC contract", async () => {
    let Rebalancer: Rebalancer;

    let USDT: ERC20token;
    let Aave: InterestBearing;
    let Tender: InterestBearing;
    let Dolomite: InterestBearing;
    let Impermax: InterestBearing;
    let WePiggy: InterestBearing;

    let priceRouter: PriceRouterMock;

    let deployer: SignerWithAddress;
    let rebalanceMatrixProvider: SignerWithAddress;

    let REBALANCE_PROVIDER_ROLE: string;
    let DEFAULT_ADMIN_ROLE: string;

    let protocols: string[] = [];
    let PROTOCOL_SELECTOR: {deposit: string; withdraw: string};
    let protocolSelectors: {deposit: string; withdraw: string}[] = [];
    let iTokens: string[] = [];

    let poolSizeLimit: BigNumber;

    before(async () => {
        [deployer, rebalanceMatrixProvider] = await ethers.getSigners();

        USDT = await new ERC20token__factory(deployer).deploy("Tether USD", "USDT");

        Aave = await new InterestBearing__factory(deployer).deploy(USDT.address, "AAVE Finance", "AAVE");
        Tender = await new InterestBearing__factory(deployer).deploy(USDT.address, "Tender Finance", "TEND");
        Dolomite = await new InterestBearing__factory(deployer).deploy(USDT.address, "Dolomite Finance", "DOLO");
        Impermax = await new InterestBearing__factory(deployer).deploy(USDT.address, "Impermax Finance", "IMP");
        WePiggy = await new InterestBearing__factory(deployer).deploy(USDT.address, "WEPiggy Finance", "PIG");

        await USDT.connect(deployer).transfer(Aave.address, ethers.utils.parseEther("100000"));
        await USDT.connect(deployer).transfer(Tender.address, ethers.utils.parseEther("100000"));
        await USDT.connect(deployer).transfer(Dolomite.address, ethers.utils.parseEther("100000"));
        await USDT.connect(deployer).transfer(Impermax.address, ethers.utils.parseEther("100000"));
        await USDT.connect(deployer).transfer(WePiggy.address, ethers.utils.parseEther("100000"));

        priceRouter = await new PriceRouterMock__factory(deployer).deploy();

        protocols = [Aave.address, Tender.address, Dolomite.address, Impermax.address];
        PROTOCOL_SELECTOR = {
            deposit: Aave.interface.getSighash("deposit"),
            withdraw: Aave.interface.getSighash("withdraw"),
        };
        protocolSelectors = protocols.map(() => PROTOCOL_SELECTOR);
        iTokens = [Aave.address, Tender.address, Dolomite.address, Impermax.address];

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
        DEFAULT_ADMIN_ROLE = await Rebalancer.DEFAULT_ADMIN_ROLE();
    });

    // before(async () => {
    //     REBALANCE_PROVIDER_ROLE = "0x524542414c414e43455f50524f56494445525f524f4c45000000000000000000";
    //     AUTOCOMPOUND_PROVIDER_ROLE = "0x4155544f434f4d504f554e445f50524f56494445525f524f4c45000000000000";
    //     [owner, alice, bob, charlie] = await ethers.getSigners();
    // });

    // beforeEach(async () => {
    //     RBAC = (await upgrades.deployProxy(await ethers.getContractFactory("RBAC"), [], {kind: "uups", initializer: "initialize()"})) as RBAC;
    // });

    describe("Deployment", async () => {
        it("Should return the correct rebalance provider role", async () => {
            expect(await Rebalancer.REBALANCE_PROVIDER_ROLE()).to.equal(REBALANCE_PROVIDER_ROLE);
        });
        it("Should set the correct admin role after", async () => {
            expect(await Rebalancer.hasRole(DEFAULT_ADMIN_ROLE, deployer.address)).to.equal(true);
        });
    });
});
