// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "base64-sol/base64.sol";

contract DynamicSVGNFT is ERC721 {
    event CreatedNFT(uint256 indexed tokenId, int256 highValue);

    AggregatorV3Interface internal immutable i_priceFeed;
    uint256 private s_tokenCounter;
    string private i_lowImageURI;
    string private i_highImageURI;
    string private constant base64EncodedSVGPrefix =
        "data:image/svg+xml;base64,";

    mapping(uint256 => int256) public s_tokenIdToHighValue;

    constructor(
        string memory lowSVG,
        string memory highSVG,
        address priceFeedAddress
    ) ERC721("Dynamic SVG NFT", "DSN") {
        i_lowImageURI = svgToImageURI(lowSVG);
        i_highImageURI = svgToImageURI(highSVG);
        i_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    function svgToImageURI(string memory svg)
        public
        pure
        returns (string memory)
    {
        string memory svgBase64Encoded = Base64.encode(
            bytes(string(abi.encodePacked(svg)))
        );

        return
            string(abi.encodePacked(base64EncodedSVGPrefix, svgBase64Encoded)); // this just concatenates the strings => data:image/svg+xml;base64,and svgBase64Encoded
    }

    function mintNFT(int256 highValue) public {
        s_tokenIdToHighValue[s_tokenCounter] = highValue;
        s_tokenCounter += 1;
        _safeMint(msg.sender, s_tokenCounter);
        emit CreatedNFT(s_tokenCounter, highValue);
    }

    function _baseURI() internal pure override returns (string memory) {
        return "data:application/json;base64,";
    }

    /**
     *
     * '{"name": "name()", "description": "Some desctiption", "image": ImsgeURI, "attributes": [{"trait": "Cuteness", "value": 100}]}'
     */

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        _requireMinted(tokenId);
        (, int price, , , ) = i_priceFeed.latestRoundData();
        string memory imageURI = i_lowImageURI;
        if (price >= s_tokenIdToHighValue[tokenId]) {
            imageURI = i_highImageURI;
        }
        return
            // order from within ==> concatenate -> convert to string -> convert to bytes -> encode bytes in base64 -> concatenate the baseURI with the base64 encoded bytes -> convert back to string
            string(
                abi.encodePacked(
                    _baseURI(),
                    Base64.encode(
                        bytes(
                            string(
                                abi.encodePacked(
                                    '{"name": "',
                                    name(),
                                    '","description": "Some dynamic SVG NFT", "image":"',
                                    imageURI,
                                    '"}'
                                )
                            )
                        )
                    )
                )
            );
    }
}
