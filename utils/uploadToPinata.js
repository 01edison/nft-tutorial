const pinataSDK = require("@pinata/sdk");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const pinataApiKey = process.env.PINATA_API_KEY;
const pinataApiSecret = process.env.PINATA_API_SECRET;
const pinata = pinataSDK(pinataApiKey, pinataApiSecret); // refer to the npm docs of this package

async function storeImages(imagesFilePath) {
  const fullImagesPath = path.resolve(imagesFilePath); // this gives you the full path to that folder from the C: drive
  console.log(fullImagesPath);
  const files = fs.readdirSync(fullImagesPath); // read the entire content of that directory or folder and stores them in an array
  console.log(files);
  let responsesFromPinata = [];

  console.log("Uploading to Pinata...");
  for (i in files) {
    const readableFileStream = fs.createReadStream(
      `${fullImagesPath}/${files[i]}`
    ); // convert each image file to its byte form. refer to the npm docs on how to use the pinata package
    try {
      const response = await pinata.pinFileToIPFS(readableFileStream);
      responsesFromPinata.push(response);
    } catch (e) {
      console.log(e);
    }
  }

  return { responsesFromPinata, files };
}

async function storeMetadataToIPFS(metadata) {
  try {
    const response = await pinata.pinJSONToIPFS(metadata);
    return response;
  } catch (error) {
    console.log(error);
  }
}

module.exports = { storeImages, storeMetadataToIPFS };
