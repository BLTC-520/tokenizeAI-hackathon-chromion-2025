# Time TokenAIzer

AI-powered platform that transforms skills into tradeable blockchain tokens using Chainlink Functions and Google Gemini.

## Key Features

- **Chainlink Functions Integration** - Decentralized skill market data fetching and KYC verification
- **Google Gemini Agents** - AI-powered portfolio analysis and tokenization strategies  
- **Smart Contract Tokenization** - ERC-1155 time tokens with automated pricing
- **KYC-Gated Access** - Soulbound NFT verification system via Chainlink oracles

## Architecture

### Chainlink Functions Implementation
- **GetSkillPrice.sol** - Fetches skill pricing data from Supabase via DON
- **GetWalletKYC.sol** - Verifies KYC status and mints access NFTs
- **DON Integration** - Avalanche Fuji testnet (`fun-avalanche-fuji-1`)
- **Decentralized Data** - No centralized API dependencies in production

### Chainlink Automation Implementation
- **TokenExpirationAutomation.sol** - To perform upkeep on deactivating expired tokens every hour (CRON job)

### Chainlink Price Feed 
- **AVAX/USD** - Implementation Chainlink Price Feed for Marketplace USD to AVAX conversion
  
### Google Gemini AI Agents
- **Portfolio Agent** - Analyzes user skills and generates market insights
- **Tokenization Agent** - Creates optimal token strategies based on market data
- **Alert Agent** - Real-time transaction notifications and updates

### Smart Contract Architecture
```solidity
// Chainlink Functions for market data
function sendRequest() external returns (bytes32 requestId) {
    FunctionsRequest.Request memory req;
    req.initializeRequestForInlineJavaScript(source);
    return _sendRequest(req.encodeCBOR(), subscriptionId, gasLimit, donID);
}

// KYC verification with NFT minting
function requestKYCVerification() external {
    // Query Supabase via Chainlink Functions
    // Mint soulbound KYC NFT on verification
}
```

## Installation

### Prerequisites
```bash
Node.js 18+
npm or yarn
```

### Environment Setup
```bash
# AI Configuration
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key

# Web3 Configuration  
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-walletconnect-id

# Chainlink Functions
CHAINLINK_SUBSCRIPTION_ID=15603
CHAINLINK_SECRETS_SLOT_ID=0
CHAINLINK_SECRETS_VERSION=1750362435
```

### Quick Start
```bash
git clone <repository-url>
cd time-tokenizer
npm install
npm run dev
```

## User Flow

1. **Connect Wallet** - RainbowKit integration with multi-chain support
2. **KYC Verification** - Chainlink Functions verify identity via Supabase
3. **Skill Assessment** - Google Gemini analyzes expertise and market demand
4. **Token Strategy** - AI generates optimal tokenization recommendations
5. **Smart Contract Deployment** - Automated ERC-1155 token creation
6. **Marketplace** - Trade tokens with real-time Chainlink pricing data

## Technical Highlights

### Chainlink Functions Usage
- **Subscription ID**: 15603 (Avalanche Fuji)
- **DON Secrets**: Encrypted Supabase credentials stored on-chain
- **Gas Optimization**: 300k callback limit with efficient data parsing
- **Error Handling**: Comprehensive fallback systems for oracle failures

### Google Gemini Integration
- **Model**: Gemini 1.5 Flash for portfolio analysis
- **Structured Output**: JSON-validated AI responses
- **Rate Limiting**: Intelligent API usage optimization
- **Fallback System**: Offline generation when API unavailable

### Security Features
- **Soulbound KYC NFTs** - Non-transferable access tokens
- **Input Validation** - Comprehensive data sanitization
- **Rate Limiting** - API abuse prevention
- **Error Boundaries** - Graceful failure handling

## Smart Contracts

### Deployed Contracts (Avalanche Fuji)
- **GetSkillPrice**: Market data oracle
- **GetWalletKYC**: KYC verification and NFT minting
- **TimeToken**: ERC-1155 time tokenization contract

### Chainlink Configuration
```javascript
const CHAINLINK_CONFIG = {
  DON_ID: 'fun-avalanche-fuji-1',
  ROUTER: '0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0',
  SUBSCRIPTION_ID: 15603,
  GAS_LIMIT: 500000
}
```

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, Framer Motion
- **Web3**: Wagmi, Viem, RainbowKit, Ethers.js
- **AI**: Google Gemini 1.5 Flash API
- **Blockchain**: Chainlink Functions, ERC-1155, Avalanche
- **Database**: Supabase (accessed via Chainlink Functions)

## Demo

Access the live application at `http://localhost:3001` after setup.

### Key Demo Features
- Real Chainlink Functions data fetching
- Live Google Gemini AI processing
- Smart contract token creation
- KYC verification with NFT minting
- Multi-chain marketplace functionality

## Hackathon Differentiators

1. **Full Chainlink Functions Integration** - Not just price feeds, but custom data fetching and KYC verification
2. **Multi-Agent AI System** - Three specialized Google Gemini agents working in coordination
3. **Decentralized KYC** - Soulbound NFTs for access control via Chainlink oracles
4. **Production-Ready Architecture** - Comprehensive error handling, rate limiting, and security measures
5. **Real Market Application** - Practical time tokenization with actual economic utility

---

**Built for TokenizeAI Hackathon** - Showcasing advanced Chainlink Functions integration with Google Gemini AI

🔗 **Chainlink Functions** | 🤖 **Google Gemini** | ⛓️ **Multi-Chain** | 🎯 **Production-Ready**
