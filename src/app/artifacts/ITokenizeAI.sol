// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

interface ITokenizeAI {
    struct Token {
        uint256 id;
        address creator;
        string tokenType; // "consulting", "development", "audit"
        uint256 hoursAmount;
        uint256 pricePerHour;
        uint256 availableFrom;
        uint256 availableUntil;
        string[] skills;
        bool isActive;
        string metadataURI;
    }

    struct Negotiation {
        uint256 tokenId;
        address buyer;
        address seller;
        uint256 proposedPrice;
        uint256 status; // 0: pending, 1: accepted, 2: rejected, 3: completed
        bytes32 ccipMessageId; // for cross-chain
    }

    event TokenCreated(uint256 indexed tokenId, address indexed creator, string tokenType);
    event NegotiationStarted(uint256 indexed negotiationId, uint256 tokenId, address buyer);
    event NegotiationCompleted(uint256 indexed negotiationId, uint256 finalPrice);
    event CrossChainTransferInitiated(bytes32 messageId, uint256 tokenId);
}