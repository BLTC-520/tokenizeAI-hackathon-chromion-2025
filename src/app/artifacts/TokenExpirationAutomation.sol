// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Chainlink Automation interface
interface AutomationCompatibleInterface {
    function checkUpkeep(bytes calldata checkData) external returns (bool upkeepNeeded, bytes memory performData);
    function performUpkeep(bytes calldata performData) external;
}

interface ITokenizeAI {
    struct TimeToken {
        address creator;
        string serviceName;
        uint256 pricePerHour;
        uint256 totalHours;
        uint256 availableHours;
        uint256 validUntil;
        bool isActive;
    }
    
    function getTimeToken(uint256 tokenId) external view returns (TimeToken memory);
    function getCurrentTokenId() external view returns (uint256);
    function deactivateToken(uint256 tokenId) external;
}

contract TokenExpirationAutomation is AutomationCompatibleInterface {
    ITokenizeAI public immutable tokenizeAI;
    uint256 public lastCheckedTokenId;
    uint256 public constant BATCH_SIZE = 10; // Check 10 tokens per upkeep
    
    event TokensDeactivated(uint256[] tokenIds);
    
    constructor(address _tokenizeAI) {
        tokenizeAI = ITokenizeAI(_tokenizeAI);
    }
    
    // For your deployed contract
    // constructor() {
    //     tokenizeAI = ITokenizeAI(0xcEC74F686A7EEC2d818a1646996F3eDc9da890EA);
    // }
    
    function checkUpkeep(bytes calldata /* checkData */) 
        external 
        view 
        override 
        returns (bool upkeepNeeded, bytes memory performData) 
    {
        uint256 currentMaxTokenId = tokenizeAI.getCurrentTokenId();
        uint256[] memory expiredTokens = new uint256[](BATCH_SIZE);
        uint256 expiredCount = 0;
        
        // Check next batch of tokens
        uint256 startId = lastCheckedTokenId + 1;
        uint256 endId = startId + BATCH_SIZE - 1;
        if (endId > currentMaxTokenId) {
            endId = currentMaxTokenId;
        }
        
        for (uint256 i = startId; i <= endId && expiredCount < BATCH_SIZE; i++) {
            try tokenizeAI.getTimeToken(i) returns (ITokenizeAI.TimeToken memory token) {
                if (token.isActive && block.timestamp > token.validUntil) {
                    expiredTokens[expiredCount] = i;
                    expiredCount++;
                }
            } catch {
                // Skip invalid token IDs
                continue;
            }
        }
        
        if (expiredCount > 0) {
            // Resize array to actual count
            uint256[] memory result = new uint256[](expiredCount);
            for (uint256 i = 0; i < expiredCount; i++) {
                result[i] = expiredTokens[i];
            }
            upkeepNeeded = true;
            performData = abi.encode(result, endId);
        } else {
            // Reset to beginning if we've checked all tokens
            uint256 nextStart = endId >= currentMaxTokenId ? 0 : endId;
            performData = abi.encode(new uint256[](0), nextStart);
        }
    }
    
    function performUpkeep(bytes calldata performData) external override {
        (uint256[] memory expiredTokens, uint256 newLastChecked) = abi.decode(performData, (uint256[], uint256));
        
        // Update last checked position
        lastCheckedTokenId = newLastChecked;
        
        // Deactivate expired tokens
        for (uint256 i = 0; i < expiredTokens.length; i++) {
            try tokenizeAI.deactivateToken(expiredTokens[i]) {
                // Successfully deactivated
            } catch {
                // Skip if deactivation fails (might already be deactivated)
                continue;
            }
        }
        
        if (expiredTokens.length > 0) {
            emit TokensDeactivated(expiredTokens);
        }
    }
    
    // Manual trigger for testing
    function manualCheck() external view returns (uint256[] memory expiredTokens) {
        (bool needed, bytes memory data) = this.checkUpkeep("");
        if (needed) {
            (expiredTokens,) = abi.decode(data, (uint256[], uint256));
        }
    }
}