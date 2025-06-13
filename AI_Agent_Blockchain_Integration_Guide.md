# Building an AI Agent with Blockchain Integration

## Overview
This guide explains how to create an AI agent that responds to social media interactions and triggers blockchain state changes using ElizaOS, Chainlink Functions, and smart contracts.

## Tech Stack Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Social Media  │───▶│   ElizaOS Agent  │───▶│  Smart Contract │
│   (Twitter)     │    │   + Custom Plugin│    │ + Chainlink Fns │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │    Database      │    │   Blockchain    │
                       │   (Supabase)     │    │ (Avalanche Fuji)│
                       └──────────────────┘    └─────────────────┘
```

## 1. ElizaOS Agent Configuration

### Package Setup
```json
{
  "dependencies": {
    "@elizaos/core": "0.1.7",
    "@elizaos/client-direct": "0.1.7", 
    "@elizaos/plugin-bootstrap": "0.1.7",
    "@elizaos/plugin-evm": "^0.1.8",
    "@elizaos/plugin-node": "0.1.7",
    "@chainlink/functions-toolkit": "^0.3.2",
    "agent-twitter-client": "0.0.18",
    "viem": "^2.22.8",
    "ethers": "v5"
  }
}
```

### Environment Variables
```bash
# Blockchain
EVM_PRIVATE_KEY=0x...
AVALANCHE_FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc

# AI Model Providers
GOOGLE_GENERATIVE_AI_API_KEY=...
OPENAI_API_KEY=...

# Twitter
TWITTER_USERNAME=your_bot_username
TWITTER_PASSWORD=...
TWITTER_EMAIL=...

# External APIs
SUPABASE_API_KEY=...
SUPABASE_URL=https://....supabase.co

# Chainlink Functions
CHAINLINK_SUBSCRIPTION_ID=123
DON_HOSTED_SECRETS_SLOT_ID=0
DON_HOSTED_SECRETS_VERSION=1
```

### Character Configuration
```json
{
  "name": "YourAgent",
  "modelProvider": "google",
  "plugins": ["yourCustomPlugin"],
  "clients": [],
  "settings": {
    "chains": {
      "evm": ["avalancheFuji"]
    }
  },
  "bio": ["Your agent's personality and expertise"],
  "style": {
    "all": [
      "short responses",
      "technical but friendly",
      "action-oriented"
    ]
  }
}
```

## 2. Custom Plugin Architecture

### Plugin Structure
```typescript
// src/custom-plugins/index.ts
import type { Plugin } from "@elizaos/core";
import { evmWalletProvider } from "./providers/wallet.ts";
import { yourCustomAction } from "./actions/yourAction.ts";

export const yourCustomPlugin: Plugin = {
    name: "yourPlugin",
    description: "Blockchain integration plugin",
    providers: [evmWalletProvider],
    evaluators: [],
    services: [],
    actions: [yourCustomAction],
};
```

### Action Handler Template
```typescript
// src/custom-plugins/actions/yourAction.ts
import {
    Action,
    composeContext,
    generateObjectDeprecated,
    HandlerCallback,
    ModelClass,
    type IAgentRuntime,
    type Memory,
    type State,
} from "@elizaos/core";

export const yourCustomAction: Action = {
    name: "your action name",
    description: "Extract data and call smart contract function",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        _options?: any,
        callback?: HandlerCallback
    ) => {
        // 1. Extract parameters from user message
        const params = await buildFunctionCallDetails(state, runtime, walletProvider);
        
        // 2. Execute blockchain transaction
        const transaction = await action.executeContract(params);
        
        // 3. Return success/failure response
        if (callback) {
            callback({
                text: `Success! Transaction: ${transaction.hash}`,
                content: {
                    success: true,
                    hash: transaction.hash,
                    ...otherData
                }
            });
        }
        return true;
    },
    validate: async (runtime: IAgentRuntime) => {
        const privateKey = runtime.getSetting("EVM_PRIVATE_KEY");
        return typeof privateKey === "string" && privateKey.startsWith("0x");
    },
    examples: [
        // Training examples for the AI to recognize when to trigger this action
    ],
    similes: ["ACTION_NAME", "ALTERNATE_NAME"],
};
```

### Parameter Extraction Template
```typescript
// src/custom-plugins/templates/index.ts
export const yourActionTemplate = `
You are an AI assistant specialized in processing requests for [YOUR USE CASE].

Extract the following information:
1. Parameter 1: Description and validation rules
2. Parameter 2: Description and validation rules

<recent_messages>
{{recentMessages}}
</recent_messages>

<analysis>
1. Identify relevant information from user message
2. Validate each parameter
3. Prepare error messages for invalid data
</analysis>

\`\`\`json
{
    "param1": "value",
    "param2": "value"
}
\`\`\`
`;
```

## 3. Chainlink Functions Smart Contract

### Base Contract Structure
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";

contract YourContract is FunctionsClient {
    using FunctionsRequest for FunctionsRequest.Request;
    
    // State variables
    bytes32 public s_lastRequestId;
    bytes public s_lastResponse;
    bytes public s_lastError;
    
    // Your business logic state
    mapping(address => uint256) public userBalances;
    mapping(string => bool) public processedCodes;
    mapping(bytes32 => address) private reqIdToAddr;
    
    // Network-specific constants (Avalanche Fuji)
    address public constant ROUTER_ADDR = 0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0;
    bytes32 public constant DON_ID = 0x66756e2d6176616c616e6368652d66756a692d31000000000000000000000000;
    uint32 public constant CALLBACK_GAS_LIMIT = 300_000;
    
    // JavaScript code for external API calls
    string public constant SOURCE = 
        "const param1 = args[0];"
        "const param2 = args[1];"
        'if(!secrets.apikey) { throw Error("API Key not set!") };'
        "const apiResponse = await Functions.makeHttpRequest({"
        'url: `https://your-api.com/validate?param1=${param1}&param2=${param2}`,'
        'method: "GET",'
        'headers: { "Authorization": `Bearer ${secrets.apikey}` }'
        "});"
        "if (apiResponse.error) { throw Error(apiResponse.error); }"
        "return Functions.encodeString(apiResponse.data.result);";

    constructor() FunctionsClient(ROUTER_ADDR) {}
    
    function executeRequest(
        uint8 donHostedSecretsSlotID,
        uint64 donHostedSecretsVersion,
        string[] memory args,
        uint64 subscriptionId,
        address userAddr
    ) external returns (bytes32 requestId) {
        // Business logic validation
        require(!processedCodes[args[0]], "Already processed");
        
        // Prepare Chainlink Functions request
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(SOURCE);
        
        if (donHostedSecretsVersion > 0) {
            req.addDONHostedSecrets(donHostedSecretsSlotID, donHostedSecretsVersion);
        }
        
        if (args.length > 0) req.setArgs(args);
        
        s_lastRequestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            CALLBACK_GAS_LIMIT,
            DON_ID
        );
        
        reqIdToAddr[s_lastRequestId] = userAddr;
        return s_lastRequestId;
    }
    
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        require(s_lastRequestId == requestId, "Unexpected request ID");
        
        s_lastResponse = response;
        s_lastError = err;
        
        if (err.length == 0) {
            // Successful external API call - execute business logic
            address userAddr = reqIdToAddr[requestId];
            
            // Your state changes here
            userBalances[userAddr] += 100;
            
            // Mark as processed
            // processedCodes[someId] = true;
        }
    }
}
```

## 4. Blockchain Integration

### Wallet Provider Setup
```typescript
// src/custom-plugins/providers/wallet.ts
import { WalletProvider } from "@elizaos/plugin-evm";

export async function initWalletProvider(runtime: IAgentRuntime): Promise<WalletProvider> {
    const walletProvider = new WalletProvider();
    await walletProvider.initializeFromRuntime(runtime);
    return walletProvider;
}
```

### Contract Interaction
```typescript
// src/custom-plugins/actions/contractInteraction.ts
import { formatEther, parseEther, getContract } from "viem";
import contractAbi from "../artifacts/YourContract.json" with { type: "json" };

export class ContractAction {
    constructor(private walletProvider: WalletProvider) {}
    
    async executeContract(params: YourParams): Promise<Transaction> {
        const chainName = "avalancheFuji";
        const contractAddress: `0x${string}` = "0x..."; // Your deployed contract
        
        // Configuration - set these in your environment
        const donHostedSecretsSlotID = Number(process.env.DON_HOSTED_SECRETS_SLOT_ID);
        const donHostedSecretsVersion = Number(process.env.DON_HOSTED_SECRETS_VERSION);
        const clSubId = Number(process.env.CHAINLINK_SUBSCRIPTION_ID);
        
        this.walletProvider.switchChain(chainName);
        const walletClient = this.walletProvider.getWalletClient(chainName);
        
        const contract = getContract({
            address: contractAddress,
            abi: contractAbi.abi,
            client: walletClient
        });
        
        const args: string[] = [params.param1, params.param2];
        
        const hash = await contract.write.executeRequest([
            donHostedSecretsSlotID,
            donHostedSecretsVersion,
            args,
            clSubId,
            params.userAddress
        ]);
        
        return {
            hash,
            from: walletClient.account!.address,
            to: contractAddress,
            value: parseEther("0"),
            data: "0x",
        };
    }
}
```

## 5. External API Integration

### Database Setup (Supabase Example)
```sql
-- Create validation table
CREATE TABLE validations (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    data JSONB NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert test data
INSERT INTO validations (code, data) VALUES 
('TEST123', '{"type": "reward", "amount": 100}'),
('CODE456', '{"type": "discount", "percent": 20}');
```

### API Endpoint
```javascript
// Chainlink Functions JavaScript (executed in DON)
const code = args[0];
const userAddress = args[1];

if (!secrets.supabaseKey) {
    throw Error("Database key not configured");
}

const response = await Functions.makeHttpRequest({
    url: `${secrets.supabaseUrl}/rest/v1/validations?code=eq.${code}&is_used=eq.false`,
    method: "GET",
    headers: {
        "apikey": secrets.supabaseKey,
        "Authorization": `Bearer ${secrets.supabaseKey}`
    }
});

if (response.error || response.data.length === 0) {
    return Functions.encodeString("INVALID");
}

// Mark as used
await Functions.makeHttpRequest({
    url: `${secrets.supabaseUrl}/rest/v1/validations?id=eq.${response.data[0].id}`,
    method: "PATCH", 
    headers: {
        "apikey": secrets.supabaseKey,
        "Authorization": `Bearer ${secrets.supabaseKey}`,
        "Content-Type": "application/json"
    },
    data: { is_used: true }
});

return Functions.encodeString(JSON.stringify(response.data[0]));
```

## 6. Deployment Process

### 1. Deploy Smart Contract
```bash
# Using Foundry
forge create YourContract \
  --rpc-url $AVALANCHE_FUJI_RPC_URL \
  --private-key $DEPLOY_PRIVATE_KEY

# Or using Hardhat
npx hardhat deploy --network avalancheFuji
```

### 2. Configure Chainlink Functions
```bash
# Upload secrets to DON
npx chainlink-functions upload-secrets \
  --network avalancheFuji \
  --slot-id 0 \
  --ttl 86400 \
  --secrets '{"supabaseKey":"...","supabaseUrl":"..."}'
```

### 3. Start Agent
```bash
# Install dependencies
pnpm install

# Start agent
pnpm run start --characters=yourCharacter.json
```

## 7. Testing & Monitoring

### Test Commands
```bash
# Test contract interaction
pnpm run test:contract

# Test agent responses
echo "test message with params" | pnpm run test:agent

# Monitor blockchain events
pnpm run monitor:events
```

### Key Monitoring Points
- Twitter API rate limits
- Chainlink subscription balance
- Contract gas usage
- External API availability
- Agent response accuracy

## 8. Customization for Other Use Cases

### Common Patterns
1. **Reward Distribution**: Validate codes → Mint tokens/NFTs
2. **Access Control**: Verify credentials → Grant permissions
3. **Data Verification**: Check external data → Update state
4. **Multi-sig Operations**: Collect approvals → Execute transactions
5. **Oracle Services**: Fetch external data → Store on-chain

### Modification Points
- Change the JavaScript source code for different APIs
- Modify smart contract business logic
- Update parameter extraction templates
- Customize agent personality and responses
- Integrate different social media platforms

This architecture provides a complete framework for building AI agents that can seamlessly bridge social media interactions with blockchain state changes using Chainlink's decentralized infrastructure.