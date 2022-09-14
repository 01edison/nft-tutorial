const { assert, expect } = require("chai");
const { network, getNamedAccounts, deployments, ethers } = require("hardhat");

const chainId = network.config.chainId;
const MINT_FEE = ethers.utils.parseEther("0.1");
if (chainId != 31337) {
  describe.skip;
} else {
  describe("RandomIPFS NFT test", () => {
    let randomNFTContract, user, vrfCoordinatorMock;

    beforeEach(async () => {
      await deployments.fixture("all");
      user = (await getNamedAccounts()).user;
      randomNFTContract = await ethers.getContract("RandomIpfsNFT");
      vrfCoordinatorMock = await ethers.getContract("VRFCoordinatorV2Mock");
    });

    describe("Constructor", () => {
      it("Should set starting values correctly", async () => {
        const dogTokenUri = await randomNFTContract.getDogTokenUri(0);
        assert(dogTokenUri.includes("ipfs://"));
      });
    });

    describe("RequestNFT", () => {
      it("Should revert if you do not pay enough ETH", async () => {
        await expect(randomNFTContract.requestNFT()).to.be.reverted;
        console.log(user);
      });
      it("Should emit an event when we mint", async () => {
        const accounts = await ethers.getSigners();
        const minter = accounts[1];
        const userConnectedContract = randomNFTContract.connect(minter);

        await expect(
          userConnectedContract.requestNFT({ value: MINT_FEE })
        ).to.emit(userConnectedContract, "NFTRequested");
      });
      it("Should allow a user mint a random NFT", async () => {
        const accounts = await ethers.getSigners();
        const minter = accounts[1];
        const userConnectedContract = randomNFTContract.connect(minter);

        await new Promise(async (resolve, reject) => {
          userConnectedContract.once("NFTMinted", async () => {
            try {
              console.log("SOmeone just got an NFT!");
              resolve();
            } catch (e) {
              console.log(e);
              reject(e);
            }
          });
          const tx = await userConnectedContract.requestNFT({
            value: MINT_FEE,
          });
          const txReceipt = await tx.wait();
          console.log(txReceipt.events[1].args.requestId);

          await vrfCoordinatorMock.fulfillRandomWords(
            txReceipt.events[1].args.requestId,
            userConnectedContract.address
          );
        });
      });
    });
  });
}
