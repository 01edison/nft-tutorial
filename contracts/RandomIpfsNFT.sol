// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

error RandomIpfsNFT__RangeOutOfBounds();
error NeedMoreETHSent();
error WithdrawalFailed();

contract RandomIpfsNFT is VRFConsumerBaseV2, ERC721URIStorage, Ownable {
    // when we mint an NFT, we will trigger a Chainlink VRF coordinator to generate a random number
    // using that number, we will get a random NFT
    // either gonna be a PUG (super rare), Shiba Inu(kind of rara), St. Bernard(common)

    //Type declarations

    enum Breed {
        PUG,
        SHIBA_INU,
        ST_BERNARD
    }

    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_keyHash;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;
    uint256 public s_requestId;

    // VRF Helper
    mapping(uint256 => address) public s_requestIdToSender;

    // NFT variables
    uint256 private s_tokenCounter;
    uint256 internal constant MAX_CHANCE_VALUE = 100;
    string[] internal s_dogTokenUris;
    uint256 public immutable i_mintFee;

    // Events

    event NFTRequested(uint256 indexed requestId, address requester);
    event NFTMinted(Breed dogBreed, address minter);

    constructor(
        address vrfCoordinatorV2,
        uint64 subscriptionId,
        bytes32 keyHash,
        uint32 callbackGasLimit,
        string[3] memory dogTokenUris,
        uint256 mintFee
    ) VRFConsumerBaseV2(vrfCoordinatorV2) ERC721("RandomDog", "RND") {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_subscriptionId = subscriptionId;
        i_keyHash = keyHash;
        i_callbackGasLimit = callbackGasLimit;
        s_dogTokenUris = dogTokenUris;
        i_mintFee = mintFee;
    }

    function requestNFT() public payable returns (uint256) {
        if (msg.value < i_mintFee) {
            revert NeedMoreETHSent();
        }
        s_requestId = i_vrfCoordinator.requestRandomWords(
            i_keyHash,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        s_requestIdToSender[s_requestId] = msg.sender;
        emit NFTRequested(s_requestId, msg.sender);
    }

    function fulfillRandomWords(
        uint256, /*requestId*/
        uint256[] memory randomWords
    ) internal override {
        address nftOwner = s_requestIdToSender[s_requestId]; // to avoid minting NFTs to the chainlink VRF nodes that call this function to mint
        uint256 randomNumber = randomWords[0] % 100; //get a random number between 1 and 99
        Breed dogBreed = getBreedFromRandomNumber(randomNumber);
        _safeMint(nftOwner, s_tokenCounter);
        _setTokenURI(s_tokenCounter, s_dogTokenUris[uint256(dogBreed)]); // we point that particular token to a unique URI for that dog breed. this basically sets the token URI for us anytime an NFT is minted
        s_tokenCounter++;
        emit NFTMinted(dogBreed, nftOwner);
    }

    function getBreedFromRandomNumber(uint256 randomNumber)
        public
        pure
        returns (Breed)
    {
        uint256[3] memory chanceArray = getChanceArray();
        uint256 cummulativeChance = 0;

        //randomNumber = 25
        //[10, 30, 100]
        for (uint256 i = 0; i < chanceArray.length; i++) {
            if (
                randomNumber > cummulativeChance &&
                randomNumber < cummulativeChance + chanceArray[i]
            ) {
                return Breed(i);
            }
            cummulativeChance += chanceArray[i];
        }
        revert RandomIpfsNFT__RangeOutOfBounds();
    }

    function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;

        (bool success, ) = payable(msg.sender).call{value: amount}("");

        if (!success) {
            revert WithdrawalFailed();
        }
    }

    function getChanceArray() public pure returns (uint256[3] memory) {
        return [10, 30, MAX_CHANCE_VALUE];
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }

    function getMintFee() public view returns (uint256) {
        return i_mintFee;
    }

    function getDogTokenUri(uint256 index) public view returns (string memory) {
        return s_dogTokenUris[index];
    }
}
