const { assert, expect } = require("chai");
const { network, getNamedAccounts, deployments, ethers } = require("hardhat");

const chainId = network.config.chainId;

if (chainId != 31337) {
  describe.skip;
} else {
  describe("Basic NFT test", () => {
    let basicNFT, user;
    beforeEach(async () => {
      user = (await getNamedAccounts()).user;
      await deployments.fixture("basicNFT");
      basicNFT = await ethers.getContract("BasicNFT");
    });

    describe("Constructor", () => {
      it("Should set initial token counter to zero", async () => {
        const initialTokenCounter = await basicNFT.getTokenCounter();
        assert.equal(initialTokenCounter.toString(), "0");
      });
    });

    describe("mintNFT", () => {
      it("Should update the token counter state variable", async () => {
        const accounts = await ethers.getSigners();
        for (let i = 0; i < 3; i++) {
          const userBasicNFT = await basicNFT.connect(accounts[i]);
          const tx = await userBasicNFT.mintNFT();
          const txReceipt = await tx.wait();
          //   console.log(txReceipt.events[0].args);
        }
        assert.equal((await basicNFT.getTokenCounter()).toString(), "3"); // since 3 people minted NFTs
      });
    });
  });
}
