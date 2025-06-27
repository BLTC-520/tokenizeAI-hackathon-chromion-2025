// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract TokenizeAI is ERC1155, Ownable, ReentrancyGuard {
    
    // Events for AI agents to listen to
    event TimeTokenCreated(
        uint256 indexed tokenId,
        address indexed creator,
        string serviceName,
        uint256 pricePerHour,
        uint256 totalHours
    );
    
    event TimeTokenPurchased(
        uint256 indexed tokenId,
        address indexed buyer,
        uint256 hoursAmount,
        uint256 totalPrice
    );
    
    event ServiceCompleted(
        uint256 indexed tokenId,
        address indexed buyer,
        uint256 hoursCompleted
    );

    // Struct to store token information
    struct TimeToken {
        address creator;
        string serviceName;
        uint256 pricePerHour;        // Price in wei per hour
        uint256 totalHours;          // Total hours available
        uint256 availableHours;      // Remaining hours
        uint256 validUntil;          // Expiration timestamp
        bool isActive;
    }
    
    // State variables
    mapping(uint256 => TimeToken) public timeTokens;
    mapping(address => uint256[]) public creatorTokens;
    mapping(address => uint256[]) public buyerTokens;
    
    uint256 private _tokenIdCounter;
    
    constructor() ERC1155("") Ownable(msg.sender) {}
    
    /**
     * @dev Create a new time token (called by AI agent)
     */
    function createTimeToken(
        address creator,
        string memory serviceName,
        uint256 pricePerHour,
        uint256 totalHours,
        uint256 validityDays
    ) external returns (uint256) {
        require(bytes(serviceName).length > 0, "Service name required");
        require(pricePerHour > 0, "Price must be positive");
        require(totalHours > 0, "Hours must be positive");
        
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;
        
        timeTokens[tokenId] = TimeToken({
            creator: creator,
            serviceName: serviceName,
            pricePerHour: pricePerHour,
            totalHours: totalHours,
            availableHours: totalHours,
            validUntil: block.timestamp + (validityDays * 1 days),
            isActive: true
        });
        
        // Mint tokens to creator
        _mint(creator, tokenId, totalHours, "");
        
        // Track creator's tokens
        creatorTokens[creator].push(tokenId);
        
        emit TimeTokenCreated(tokenId, creator, serviceName, pricePerHour, totalHours);
        
        return tokenId;
    }
    
    /**
     * @dev Purchase time tokens
     */
    function purchaseTimeToken(uint256 tokenId, uint256 hoursAmount) 
        external 
        payable 
        nonReentrant 
    {
        TimeToken storage token = timeTokens[tokenId];
        
        require(token.isActive, "Token not active");
        require(hoursAmount > 0, "Hours must be positive");
        require(hoursAmount <= token.availableHours, "Not enough hours available");
        require(block.timestamp <= token.validUntil, "Token expired");
        
        uint256 totalPrice = hoursAmount * token.pricePerHour;
        require(msg.value >= totalPrice, "Insufficient payment");
        
        // Update available hours
        token.availableHours -= hoursAmount;
        
        // Transfer tokens from creator to buyer
        _safeTransferFrom(token.creator, msg.sender, tokenId, hoursAmount, "");
        
        // Track buyer's tokens
        buyerTokens[msg.sender].push(tokenId);
        
        // Transfer full payment to creator
        payable(token.creator).transfer(totalPrice);
        
        // Refund excess payment
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }
        
        emit TimeTokenPurchased(tokenId, msg.sender, hoursAmount, totalPrice);
    }
    
    /**
     * @dev Mark service as completed (for reputation/tracking)
     */
    function markServiceCompleted(uint256 tokenId, address buyer, uint256 hoursAmount) 
        external 
    {
        TimeToken memory token = timeTokens[tokenId];
        require(msg.sender == token.creator, "Only creator can mark completed");
        require(balanceOf(buyer, tokenId) >= hoursAmount, "Buyer doesn't own enough tokens");
        
        emit ServiceCompleted(tokenId, buyer, hoursAmount);
    }
    
    // View functions for AI agents
    
    /**
     * @dev Get token details
     */
    function getTimeToken(uint256 tokenId) 
        external 
        view 
        returns (TimeToken memory) 
    {
        return timeTokens[tokenId];
    }
    
    /**
     * @dev Get all tokens created by an address
     */
    function getCreatorTokens(address creator) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return creatorTokens[creator];
    }
    
    /**
     * @dev Get all tokens purchased by an address
     */
    function getBuyerTokens(address buyer) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return buyerTokens[buyer];
    }
    
    /**
     * @dev Get market data for a token
     */
    function getMarketData(uint256 tokenId) 
        external 
        view 
        returns (
            uint256 availableHours,
            uint256 pricePerHour,
            uint256 validUntil,
            bool isActive
        ) 
    {
        TimeToken memory token = timeTokens[tokenId];
        return (
            token.availableHours,
            token.pricePerHour,
            token.validUntil,
            token.isActive
        );
    }
    
    /**
     * @dev Deactivate a token (creator only)
     */
    function deactivateToken(uint256 tokenId) external {
        require(timeTokens[tokenId].creator == msg.sender, "Only creator can deactivate");
        timeTokens[tokenId].isActive = false;
    }
    
    /**
     * @dev Get current token counter
     */
    function getCurrentTokenId() external view returns (uint256) {
        return _tokenIdCounter;
    }
}