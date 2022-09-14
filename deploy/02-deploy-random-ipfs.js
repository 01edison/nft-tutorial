const { verify } = require("../utils/verify");
const { networkConfig } = require("../helper-hardhat-config");
const { ethers } = require("hardhat");
const { storeImages, storeMetadataToIPFS } = require("../utils/uploadToPinata");
require("dotenv").config();

const MINT_FEE = ethers.utils.parseEther("0.1");
const imagesLocation = "../NFT-tutorial/images/random-images/";

const metadataTemplate = {
  name: "",
  description: "",
  image: "",
  attributes: [
    {
      trait_type: "Cuteness",
      value: 100,
    },
  ],
};

module.exports = async ({ getNamedAccounts, deployments, network }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  let vrfCoordinatorAddress;
  let subscriptionId;
  let tokenUris;
  console.log(`chain id is ${chainId}`);
  
  tokenUris = await handleTokenUris();

  if (chainId == 31337) {
    log("Setting up Mock VRF Coordinator...");
    const VRFCoordinatorV2Mock = await ethers.getContract(
      "VRFCoordinatorV2Mock"
    );
    vrfCoordinatorAddress = VRFCoordinatorV2Mock.address;
    const fundAmount = networkConfig[chainId]["fundAmount"];
    const transaction = await VRFCoordinatorV2Mock.createSubscription();
    const transactionReceipt = await transaction.wait(1);
    subscriptionId = ethers.BigNumber.from(
      transactionReceipt.events[0].topics[1]
    );
    await VRFCoordinatorV2Mock.fundSubscription(subscriptionId, fundAmount);

    log("Mock VRF Coordinator ready to go!");
  } else {
    subscriptionId = process.env.VRF_SUBSCRIPTION_ID;
    vrfCoordinatorAddress = networkConfig[chainId]["vrfCoordinator"];
  }

  const keyHash = networkConfig[chainId]["keyHash"];
  const callbackGasLimit = networkConfig[chainId].callbackGasLimit;

  log("--------------------------------------------");

  const args = [
    vrfCoordinatorAddress,
    subscriptionId,
    keyHash,
    callbackGasLimit,
    tokenUris,
    MINT_FEE,
  ];
  log(
    `Deploying RandomIpfsNFT to ${
      chainId == 31337 ? "local" : network.name
    } testnet`
  );
  const randomIpfsNFT = await deploy("RandomIpfsNFT", {
    from: deployer,
    log: true,
    args: args,
  });
  if (chainId != 31337) {
    log("Verifying contract...");
    await verify(randomIpfsNFT.address, args);
  }
};

async function handleTokenUris() {
  const tokenUris = [];

  const { responsesFromPinata, files } = await storeImages(imagesLocation);

  for (responseIndex in responsesFromPinata) {
    // create metadata
    //upload metadata
    let tokenUriMetadata = { ...metadataTemplate };

    tokenUriMetadata.name = files[responseIndex].replace(".png", "");
    tokenUriMetadata.description = `An Adorable ${tokenUriMetadata.name} pup!`;
    tokenUriMetadata.image = `ipfs://${responsesFromPinata[responseIndex].IpfsHash}`;
    console.log(`Uploading metadata for ${tokenUriMetadata.name}`);
    const metadataUploadResponse = await storeMetadataToIPFS(tokenUriMetadata);

    tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`);
  }

  console.log("Token URIs uploaded! They are:");
  console.log(tokenUris);
  return tokenUris;
}

module.exports.tags = ["all", "random"];
