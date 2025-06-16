# Time Tokenizer - AI-Powered Time Portfolio & Blockchain Tokenization

A Next.js application that transforms your skills and time into tradeable blockchain tokens using **multi-agent AI system** and comprehensive Web3 integration.

## 🤖 Multi-Agent AI Architecture

This project features a sophisticated **three-agent ElizaOS-inspired system**:

### 1. Portfolio Maker Agent (`elizaAgent.ts`)
- **AI Model**: Google Gemini 1.5 Flash for portfolio analysis
- **Character**: Expert freelance market analyst with Web3 expertise
- **Function**: Generates comprehensive skill assessments and project recommendations
- **Fallback**: Smart offline portfolio generation system

### 2. Tokenize Agent (`tokenizeAgent.ts`)
- **AI Model**: Google Gemini 1.5 Flash for tokenization strategy
- **Character**: Blockchain tokenization specialist
- **Function**: Analyzes portfolios to create optimal token strategies
- **Output**: Structured token suggestions with market analysis

### 3. Alert Agent (`alertAgent.ts`)
- **Function**: Real-time notification system for blockchain transactions
- **Features**: Browser notifications, transaction status tracking
- **Integration**: SSR-safe implementation with client-side guards

### 4. Market Analysis Agent (`marketAnalyzeAgent.ts`)
- **AI Model**: Google Gemini 1.5 Flash for advanced market analysis
- **Character**: Expert freelance market analyst with 15+ years of experience
- **Unique Feature: 100% on-chain data**: Only accepts verified Chainlink Functions oracle data
- **Multi-Dimensional Analysis**: Price, demand, competition, trends, and regional multipliers 


## 🚀 Complete Feature Set

### 🎨 Modern UI/UX Design
- **Theme**: Purple-to-blue gradient with glassmorphism effects
- **Animations**: Smooth Framer Motion transitions and micro-interactions
- **Navigation**: Persistent header with progress tracking across all phases
- **Responsive**: Mobile-first design that adapts to all screen sizes
- **Typography**: Inter font with optimized readability

### 🔗 Advanced Web3 Integration
- **Wallets**: RainbowKit with full wallet ecosystem support
- **Chains**: Multi-chain support (Avalanche Fuji primary, Ethereum Sepolia, Base Sepolia)
- **Contracts**: ERC-1155 Time Token smart contracts
- **State**: Wagmi + Viem for robust blockchain state management

### 📋 Intelligent Questionnaire System
- **Steps**: 7-step interactive questionnaire with keyboard navigation
- **Features**: Auto-save, progress tracking, skill categorization
- **Validation**: Real-time input validation with helpful feedback
- **Storage**: Persistent localStorage with session restoration

### 🤖 Real AI Processing Pipeline
- **Live Processing**: Actual AI model execution with visual feedback
- **Error Handling**: Comprehensive fallback systems
- **Rate Limiting**: Intelligent API usage optimization
- **Transparency**: Clear indicators of AI vs fallback generation

### 📊 Comprehensive Portfolio Analysis
- **Sections**: Overview, Projects, Skills, Earnings tabs
- **Insights**: AI-generated market analysis and optimization tips
- **Scoring**: Compatibility scores and skill assessments
- **Projections**: Weekly, monthly, and yearly earnings estimates

### 🔍 Market Intelligence System
- **Real-time Oracle Data**: Chainlink Functions integration for 100% verified on-chain market data
- **Multi-Dimensional Analysis**: Price, demand, competition, trends, and regional multipliers across 19+ technical skills
- **Predictive Modeling**: 3-month, 6-month, and yearly rate forecasting with market health scoring
- **Smart Performance**: Intelligent 5-minute data caching with confidence metrics and source attribution

### 🎯 Advanced Tokenization Features
- **Agentic Mode**: AI-powered token strategy planning
- **Bundle Selection**: Multi-token package creation
- **Parameter Review**: Detailed token configuration with validation
- **Smart Contracts**: Automated token minting on blockchain

### 🏪 Marketplace & Dashboard
- **Token Browsing**: Comprehensive marketplace with filtering
- **Portfolio Tracking**: Personal dashboard with analytics
- **Transaction History**: Complete audit trail of all activities
- **Performance Metrics**: Token performance and earnings tracking

### Oracle Infrastructure
- **Chainlink Functions**: Custom GetSkillPrice.sol contract on Avalanche Fuji
- **Oracle Network**: DON (Decentralized Oracle Network) for secure data fetching
- **Data Source**: Real-time Supabase API integration with skill market data
- **Security**: Allow-list access control and request validation


## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS with custom design system
- **Animations**: Framer Motion for smooth interactions
- **State**: Custom localStorage hooks with SSR safety

### Web3 Infrastructure
- **Wallet**: RainbowKit + Wagmi for wallet connectivity
- **Blockchain**: Viem for low-level blockchain interactions
- **Contracts**: ERC-1155 multi-token standard
- **Networks**: Multi-chain deployment architecture

### AI Integration
- **Models**: Google Gemini 1.5 Flash via REST API
- **Architecture**: Multi-agent system with specialized roles
- **Fallbacks**: Intelligent offline generation capabilities
- **Safety**: Rate limiting and error handling

### Development Tools
- **Package Manager**: npm with optimized dependencies
- **Linting**: ESLint + TypeScript for code quality
- **Build**: Next.js with Turbopack for fast development
- **Deployment**: Optimized for production environments

### Oracle Infrastructure
- **Chainlink Functions**: Custom GetSkillPrice.sol contract on Avalanche Fuji
- **Oracle Network**: DON (Decentralized Oracle Network) for secure data fetching
- **Data Source**: Real-time Supabase API integration with skill market data
- **Security**: Allow-list access control and request validation


## 🔧 Setup & Installation

### Prerequisites
```bash
# Required
Node.js 18+ 
npm or yarn

# API Keys needed
Google Gemini API Key
WalletConnect Project ID
Supabase Project URL and Anon Key
Chainlink Functions Subscription ID
```

### Environment Configuration
Create `.env.local` with:
```bash
# AI Configuration
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key

# Web3 Configuration  
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-walletconnect-id

# Blockchain RPC Endpoints
AVALANCHE_FUJI_RPC=your-avalanche-rpc
SEPOLIA_ETH_RPC=your-ethereum-rpc
SEPOLIA_BASE_RPC=your-base-rpc

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Chainlink Functions Configuration
CHAINLINK_SUBSCRIPTION_ID=your-subscription-id
CHAINLINK_DON_ID=fun-avalanche-fuji-1
CHAINLINK_SECRETS_SLOT_ID=0
CHAINLINK_SECRETS_VERSION=1

# Development (optional)
PRIVATE_KEY=your-private-key-for-testing
```

### Database Setup
```bash
# Navigate to https://supabase.com
# Create new project
# Get your project URL and anon key

# Run the SQL script in Supabase SQL Editor
# File: database/supabase-setup.sql
# This creates skill_market_data table with initial data

# Check that skill_market_data table exists
# Verify 19+ skills are populated with market data
```

### Chainlink Functions
1. **Deploy GetSkillPrice Contract**
```bash
# Contract: src/app/artifacts/GetSkillprice.sol
# Network: Avalanche Fuji Testnet
# Update contract address in constants.ts
```

2. **Configure DON Secrets**
```bash
# Upload Supabase API key to DON
# Use scripts/upload-secrets.js
# Update secrets slot ID and version
```

### Installation Steps
```bash
# Clone repository
git clone <repository-url>
cd time-tokenizer

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build Commands
```bash
# Development
npm run dev          # Start dev server (typically port 3001)

# Production
npm run build        # Create optimized build
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint checks
```

## 🎯 Complete User Journey

### 1. **Landing Page**
- Modern gradient design with animated elements
- Wallet connection via RainbowKit
- Chain validation and switching assistance
- Session restoration for returning users

### 2. **Questionnaire Phase**
- **Personal Info**: Name and experience level
- **Skills**: Multi-select from categorized options
- **Availability**: Time commitment and scheduling
- **Goals**: Career objectives and target earnings
- **Projects**: Preferred project types and industries
- **Rate**: Hourly rate expectations
- **Review**: Final confirmation of all inputs

### 3. **AI Processing Phase**
- Real-time AI agent execution with visual feedback
- Portfolio generation using Gemini AI
- Skill analysis and market demand assessment
- Project recommendations with match scoring
- Earnings projections and optimization strategies

### 4. **Portfolio Presentation**
- **Overview**: Profile summary and key metrics
- **Projects**: AI-curated project recommendations
- **Skills**: Detailed skill assessment with market demand
- **Earnings**: Financial projections and optimization tips

### 5. **Tokenization Phase (Agentic Mode)**
- AI-powered tokenization strategy planning
- Multiple token suggestions with reasoning
- Bundle creation for complementary services
- Parameter optimization and validation

### 6. **Token Creation**
- Smart contract parameter review
- Gas estimation and cost calculation
- Blockchain transaction execution
- Real-time transaction progress tracking

### 7. **Marketplace & Dashboard**
- Browse created and available tokens
- Portfolio performance analytics
- Transaction history and earnings tracking
- Advanced filtering and search capabilities

## 🌟 Key Technical Innovations

### AI Architecture
- **Multi-Agent System**: Specialized agents for different tasks
- **Structured Output**: JSON-formatted AI responses with validation
- **Fallback Intelligence**: Smart offline capabilities when API unavailable
- **Rate Optimization**: Intelligent API usage with caching

### Blockchain Integration
- **Multi-Chain Support**: Seamless operation across multiple networks
- **Smart Contract Safety**: Comprehensive parameter validation
- **Transaction Handling**: Robust error handling and retry logic
- **Gas Optimization**: Intelligent gas estimation and fee management

### User Experience
- **Progressive Navigation**: Clear progress indication across all phases
- **State Persistence**: Complete session restoration capabilities
- **Error Recovery**: Comprehensive error boundaries and fallbacks
- **Performance**: Optimized loading and smooth transitions

### Code Quality
- **TypeScript**: Full type safety throughout the application
- **Modular Architecture**: Clean separation of concerns
- **Testing Ready**: Structured for easy test implementation
- **Documentation**: Comprehensive inline and external documentation

## 🔒 Security & Reliability

- **Input Validation**: Comprehensive validation at all entry points
- **Error Boundaries**: React error boundaries for graceful failures
- **Rate Limiting**: AI API usage optimization and protection
- **Wallet Security**: Industry-standard wallet integration practices
- **Data Privacy**: No sensitive data storage, session-only persistence
- **Access Control**: Allow-list protected smart contract functions

## 📊 Market Metrics

- **Real-time Rates**: Current hourly rates from verified sources
- **Demand Levels**: Market demand scoring (1-100)
- **Competition Analysis**: Competition intensity (1-10)
- **Market Trends**: declining/stable/growing/surging
- **Regional Multipliers**: Geographic pricing adjustments
- **Project Volume**: Available project quantities

## 🚀 Deployment

The application is optimized for deployment on:
- **Vercel**: Native Next.js optimization
- **Netlify**: Static site generation support  
- **Custom Servers**: Docker containerization ready
- **CDN**: Optimized asset delivery

## 📈 Performance Features

- **Code Splitting**: Automatic route-based code splitting
- **Image Optimization**: Next.js automatic image optimization
- **Caching**: Intelligent API response caching
- **Lazy Loading**: Component-based lazy loading
- **Bundle Analysis**: Optimized bundle size management
- **Oracle Optimization**: Smart contract gas optimization

---

*Transform your time into tradeable digital assets with AI-powered precision* 🚀

**Live Demo**: `http://localhost:3001` (development server)

Built with ❤️ using Next.js, TypeScript, and cutting-edge AI technology.
