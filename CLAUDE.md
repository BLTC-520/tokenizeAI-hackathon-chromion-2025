# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
```bash
npm run dev          # Start development server with Turbopack (port 3001 typically)
npm run build        # Build production application  
npm run start        # Start production server
npm run lint         # Run ESLint for code quality
```

### Environment Setup
- Environment variables in `.env.local`
- API keys: `NEXT_PUBLIC_GEMINI_API_KEY`, `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- RPC endpoints: `AVALANCHE_FUJI_RPC`, `SEPOLIA_ETH_RPC`, `SEPOLIA_BASE_RPC`
- Private key: `PRIVATE_KEY` (for smart contract interactions)

## Architecture Overview

### Multi-Agent AI System
The application uses a three-agent ElizaOS-inspired architecture:

1. **Portfolio Maker Agent** (`src/app/services/elizaAgent.ts`)
   - Uses Google Gemini AI for portfolio generation
   - ElizaOS-style character configuration with market expertise
   - Fallback intelligence for offline operation

2. **Tokenize Agent** (`src/app/services/tokenizeAgent.ts`) 
   - Analyzes portfolio data for optimal token strategies
   - Provides pricing recommendations and market insights
   - Calculates token economics and competitive positioning

3. **Alert Agent** (`src/app/services/alertAgent.ts`)
   - Browser notification system for transaction updates
   - SSR-safe implementation with client-side guards

### Smart Contract Integration
- **ERC-1155 Time Tokens** on multiple testnets (Avalanche Fuji primary)
- Contract addresses in `constants.ts` with multi-chain support
- Full contract service in `src/app/services/contractService.ts`
- Token creation, purchasing, and management functionality

### State Management Architecture
- **Local Storage Persistence** via custom hooks (`src/app/hooks/useLocalStorage.ts`)
- **App State Machine**: `landing → questionnaire → processing → portfolio → tokenization → marketplace/dashboard`
- **Session Management**: Auto-save/restore for user answers, portfolio data, token drafts
- **Chain State**: Wallet connection, chain switching, contract interactions

### Key UI Flow States
1. **Landing**: Wallet connection with RainbowKit
2. **Questionnaire**: 7-step form with keyboard navigation and auto-save
3. **Processing**: Real AI portfolio generation with visual feedback
4. **Portfolio**: Display AI-generated recommendations
5. **Tokenization**: AI-powered token strategy planning
6. **Token Creation**: Smart contract integration for minting
7. **Marketplace/Dashboard**: Token browsing and management

## Critical Design Patterns

### Component Architecture
- **ClientOnly wrapper** prevents SSR hydration issues (`src/app/components/ClientOnly.tsx`)
- **Processing animations** show real AI work in progress
- **Error boundaries** with comprehensive fallback systems
- **Minimalistic black/white design** with Inter font

### Data Flow
- **User Answers** → **AI Portfolio Generation** → **Token Strategy** → **Smart Contract Deployment**
- All data persists in localStorage with session restoration
- Chain-aware contract address resolution
- Real-time transaction status tracking

### Multi-Chain Support
- **Primary**: Avalanche Fuji (43113)
- **Secondary**: Ethereum Sepolia (11155111), Base Sepolia (84532)
- Contract addresses mapped by chain ID in `constants.ts`
- Chain switching functionality with user warnings

### AI Integration Patterns
- **Gemini API** with client-side access (`NEXT_PUBLIC_` prefix required)
- **Structured prompts** for consistent JSON responses
- **Fallback systems** when AI services are unavailable
- **Real-time processing** feedback during AI generation

## Local Storage Schema
Key data structures in `src/app/utils/localStorage.ts`:
- `UserAnswers`: Questionnaire responses
- `PortfolioData`: AI-generated portfolio analysis  
- `TokenDraft`: Token configuration before minting
- `WalletData`: Wallet connection state
- `SessionData`: Complete application state for restoration

## Web3 Integration Notes
- **RainbowKit + Wagmi + Viem** stack for wallet connectivity
- **Multi-chain configuration** in `src/app/lib/wagmi.ts`
- **Smart contract ABI** included in `constants.ts`
- **Transaction handling** with comprehensive error management
- **Chain validation** with user-friendly warnings for unsupported networks

## Key Implementation Details
- **Keyboard Navigation**: Full keyboard support in questionnaire (Enter to advance, Ctrl+Enter for textarea)
- **Animation System**: Framer Motion for smooth transitions between states
- **Error Handling**: Comprehensive validation and error recovery throughout
- **Font System**: Inter font configured via Next.js font optimization
- **Development**: Uses Turbopack for fast hot reloading during development