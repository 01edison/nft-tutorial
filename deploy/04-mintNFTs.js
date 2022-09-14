const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments, network }) => {
  const { deploy, log } = deployments;
  const { deployer, player } = await getNamedAccounts();
  const chainId = network.config.chainId;

  if (chainId != 31337) {
    const dynamicNFTContract = await ethers.getContract(
      "DynamicSVGNFT",
      deployer
    );

    const tx = await dynamicNFTContract.mintNFT(
      ethers.utils.parseEther("1000")
    );
    const txReceipt = await tx.wait(1);

    console.log(await dynamicNFTContract.tokenURI(1));
  }
};

module.exports.tags = ["all", "mint"];
