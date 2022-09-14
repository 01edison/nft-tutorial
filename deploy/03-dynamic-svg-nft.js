const { verify } = require("../utils/verify");
const { networkConfig } = require("../helper-hardhat-config");
const { ethers } = require("hardhat");
const fs = require("fs");

module.exports = async ({ getNamedAccounts, deployments, network }) => {
  const { deploy, log } = deployments;
  const { deployer, player } = await getNamedAccounts();
  const chainId = network.config.chainId;
  let ethUsdPriceFeedAddress;

  if (chainId == 31337) {
    const mockEthUsdPriceFeed = await ethers.getContract("MockV3Aggregator");
    ethUsdPriceFeedAddress = mockEthUsdPriceFeed.address;
  } else {
    ethUsdPriceFeedAddress = networkConfig[chainId].ethUsdPriceFeedAddress;
  }

  const lowSVG = fs.readFileSync("./images/dynamic/frown.svg", {
    encoding: "utf8",
  });
  const highSVG = fs.readFileSync("./images/dynamic/happy.svg", {
    encoding: "utf8",
  });

  const args = [lowSVG, highSVG, ethUsdPriceFeedAddress];
  log("Deploying DynamicSVGContract...");

  const dynamicNFTContract = await deploy("DynamicSVGNFT", {
    from: deployer,
    log: true,
    args: args,
  });
  log("Contract deployed!!");

  if (chainId != 31337) {
    log("Verifying dynamic nft contract");
    verify(dynamicNFTContract.address, args);
  }
};

module.exports.tags = ["all", "dynamic"];
