// constants.ts
// Complete TokenizeAI Smart Contract Configuration

// Import GetSkillPrice ABI
import { GET_SKILL_PRICE_ABI } from './src/app/abi/GetSkillPrice.abi';

// Core Contract Addresses
export const CONTRACT_ADDRESSES = {
	ETHEREUM_SEPOLIA: "0xcEC74F686A7EEC2d818a1646996F3eDc9da890EA",
	BASE_SEPOLIA: "0xf38C634Eaa7af92762673FBa910b44E2DCB2282B",
	AVALANCHE_FUJI: "0xcEC74F686A7EEC2d818a1646996F3eDc9da890EA"
} as const;

// GetSkillPrice Contract Addresses
export const GETSKILLPRICE_CONTRACT_ADDRESSES = {
	ETHEREUM_SEPOLIA: process.env.NEXT_PUBLIC_GETSKILLPRICE_CONTRACT_ETHEREUM || "0xYourEthereumContract",
	BASE_SEPOLIA: process.env.NEXT_PUBLIC_GETSKILLPRICE_CONTRACT_BASE || "0xYourBaseContract",
	AVALANCHE_FUJI: process.env.NEXT_PUBLIC_GETSKILLPRICE_CONTRACT_AVALANCHE || "0x5f6b3e64a1823ab48bf4acb8b3716ac7b77defb1"
} as const;

// Chain IDs
export const AVALANCHE_FUJI_CHAIN_ID = 43113;
export const BASE_SEPOLIA_CHAIN_ID = 84532;
export const ETHEREUM_SEPOLIA_CHAIN_ID = 11155111;

// Default Contract Addresses
export const TOKENIZE_AI_CONTRACT_ADDRESS = "0xcEC74F686A7EEC2d818a1646996F3eDc9da890EA";
export const GETSKILLPRICE_CONTRACT_ADDRESS = GETSKILLPRICE_CONTRACT_ADDRESSES.AVALANCHE_FUJI;

// Supabase Configuration
export const SUPABASE_CONFIG = {
	url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wtsruzsccudercdaxbmp.supabase.co',
	anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
	// Table structure configuration
	tables: {
		skillMarketData: 'skill_market_data',
		columns: {
			skill: 'skill',
			hourlyRate: 'average_hourly_rate',
			demandLevel: 'demand_level',
			marketTrend: 'market_trend',
			competitionLevel: 'competition_level',
			projectVolume: 'project_volume',
			regionMultiplier: 'region_multiplier',
			lastUpdated: 'last_updated',
			createdAt: 'created_at'
		}
	}
} as const;

// RPC URLs Configuration
export const RPC_URLS = {
	[AVALANCHE_FUJI_CHAIN_ID]: process.env.AVALANCHE_FUJI_RPC || 'https://avax-fuji.g.alchemy.com/v2/ZDRXbJd_qraq5rTvWv4Qv',
	[BASE_SEPOLIA_CHAIN_ID]: process.env.SEPOLIA_BASE_RPC || 'https://base-sepolia.g.alchemy.com/v2/ZDRXbJd_qraq5rTvWv4Qv',
	[ETHEREUM_SEPOLIA_CHAIN_ID]: process.env.SEPOLIA_ETH_RPC || 'https://eth-sepolia.g.alchemy.com/v2/ZDRXbJd_qraq5rTvWv4Qv'
} as const;

// Time Token Contract Mapping
export const TIME_TOKEN_CONTRACT_ADDRESS = {
	[ETHEREUM_SEPOLIA_CHAIN_ID]: CONTRACT_ADDRESSES.ETHEREUM_SEPOLIA,
	[BASE_SEPOLIA_CHAIN_ID]: CONTRACT_ADDRESSES.BASE_SEPOLIA,
	[AVALANCHE_FUJI_CHAIN_ID]: CONTRACT_ADDRESSES.AVALANCHE_FUJI,
	43113: CONTRACT_ADDRESSES.AVALANCHE_FUJI,
	84532: CONTRACT_ADDRESSES.BASE_SEPOLIA,
	11155111: CONTRACT_ADDRESSES.ETHEREUM_SEPOLIA
} as const;

// GetSkillPrice Contract Mapping
export const GETSKILLPRICE_CONTRACT_BY_CHAIN = {
	[ETHEREUM_SEPOLIA_CHAIN_ID]: GETSKILLPRICE_CONTRACT_ADDRESSES.ETHEREUM_SEPOLIA,
	[BASE_SEPOLIA_CHAIN_ID]: GETSKILLPRICE_CONTRACT_ADDRESSES.BASE_SEPOLIA,
	[AVALANCHE_FUJI_CHAIN_ID]: GETSKILLPRICE_CONTRACT_ADDRESSES.AVALANCHE_FUJI,
} as const;

// Helper function to get chain-specific contract
export const getCurrentChainSkillPriceContract = (chainId?: number): string => {
	if (!chainId) return GETSKILLPRICE_CONTRACT_ADDRESS;
	return GETSKILLPRICE_CONTRACT_BY_CHAIN[chainId as keyof typeof GETSKILLPRICE_CONTRACT_BY_CHAIN] || GETSKILLPRICE_CONTRACT_ADDRESS;
};

// Chainlink Functions Configuration
export const CHAINLINK_CONFIG = {
	DON_ID: process.env.CHAINLINK_DON_ID || 'fun-avalanche-fuji-1',
	DON_HOSTED_SECRETS_SLOT_ID: parseInt(process.env.CHAINLINK_SECRETS_SLOT_ID || '0'),
	DON_HOSTED_SECRETS_VERSION: parseInt(process.env.CHAINLINK_SECRETS_VERSION || '1'),
	SUBSCRIPTION_ID: process.env.CHAINLINK_SUBSCRIPTION_ID || "15603",
	GAS_LIMIT: 500000,
	BATCH_GAS_LIMIT: 1000000,
	REQUEST_TIMEOUT: 60000
} as const;

// Web3 Configuration
export const WEB3_CONFIG = {
	WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "2258d78dbda104f2e4feb4243e1c00c6",
	PRIVATE_KEY: process.env.PRIVATE_KEY || "",
	SUPPORTED_CHAINS: [AVALANCHE_FUJI_CHAIN_ID, BASE_SEPOLIA_CHAIN_ID, ETHEREUM_SEPOLIA_CHAIN_ID]
} as const;

// AI Configuration
export const AI_CONFIG = {
	GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "AIzaSyBcWd8-saOpSMbpST9WThYVoT7rSOCaY2g",
	MODEL_NAME: "gemini-pro",
	MAX_TOKENS: 8192,
	TEMPERATURE: 0.7
} as const;

// Market Analysis Configuration
export const MARKET_ANALYSIS_CONFIG = {
	CACHE_DURATION: 5 * 60 * 1000, // 5 minutes cache
	MAX_RETRY_ATTEMPTS: 3,
	RETRY_DELAY: 2000,
	SUPPORTED_SKILLS: [
		'frontend', 'backend', 'fullstack', 'blockchain', 'ai', 'mobile',
		'design', 'marketing', 'defi', 'nft', 'solidity', 'react', 'node',
		'python', 'java', 'golang', 'rust', 'smart_contracts', 'web3'
	],
	VERIFIED_SKILLS: [
		'frontend', 'backend', 'fullstack', 'blockchain', 'ai', 'mobile',
		'design', 'marketing', 'defi', 'nft'
	],
	DEFAULT_SKILLS_FOR_ANALYSIS: ['frontend', 'backend', 'blockchain', 'ai'],
	SUPABASE_TABLE: SUPABASE_CONFIG.tables.skillMarketData,
	BATCH_SIZE: 10,
	// Real skill price ranges based on database
	PRICE_RANGES: {
		premium: { min: 120, skills: ['defi', 'nft', 'blockchain'] },
		high: { min: 80, skills: ['ai', 'fullstack'] },
		medium: { min: 65, skills: ['backend', 'mobile', 'frontend'] },
		standard: { min: 55, skills: ['design', 'marketing'] }
	}
} as const;

// API Endpoints
export const API_ENDPOINTS = {
	SUPABASE_SKILLS_ENDPOINT: `${SUPABASE_CONFIG.url}/rest/v1/${SUPABASE_CONFIG.tables.skillMarketData}`,
	CHAINLINK_FUNCTIONS_ENDPOINT: 'https://functions.chain.link',
	AVALANCHE_EXPLORER: 'https://testnet.snowtrace.io',
	BASE_EXPLORER: 'https://sepolia.basescan.org',
	ETHEREUM_EXPLORER: 'https://sepolia.etherscan.io'
} as const;

// Error Messages
export const ERROR_MESSAGES = {
	NETWORK_ERROR: 'Network connection error, please check network settings',
	CONTRACT_ERROR: 'Contract call failed, please check contract address and network',
	WALLET_ERROR: 'Wallet connection error, please reconnect wallet',
	SUPABASE_ERROR: 'Supabase database connection error',
	CHAINLINK_ERROR: 'Chainlink Functions request failed',
	AI_ERROR: 'AI analysis service temporarily unavailable',
	TIMEOUT_ERROR: 'Request timeout, please try again later',
	INVALID_SKILL: 'Unsupported skill type',
	NO_DATA: 'No relevant data available',
	TABLE_NOT_FOUND: 'Data table does not exist, please check table name configuration',
	COLUMN_NOT_FOUND: 'Data column does not exist, please check column name configuration',
	CONTRACT_ADDRESS_MISMATCH: 'Contract address configuration mismatch, please check environment variables'
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
	DATA_FETCHED: 'Data fetched successfully',
	ANALYSIS_COMPLETED: 'Market analysis completed',
	CONTRACT_CALLED: 'Contract call successful',
	WALLET_CONNECTED: 'Wallet connected successfully',
	TRANSACTION_CONFIRMED: 'Transaction confirmed successfully',
	DATABASE_CONNECTED: 'Supabase database connected successfully',
	REAL_DATA_LOADED: 'Real market data loaded successfully',
	CONFIG_VERIFIED: 'Configuration verified successfully'
} as const;

// Development Configuration
export const DEV_CONFIG = {
	ENABLE_LOGGING: process.env.NODE_ENV === 'development',
	ENABLE_MOCK_DATA: process.env.NODE_ENV === 'development',
	DEBUG_MODE: process.env.NODE_ENV === 'development',
	SKIP_WALLET_CHECK: process.env.NODE_ENV === 'development'
} as const;

// GetSkillPrice Contract ABI (simplified version with main functions)
export const GETSKILLPRICE_ABI = [
	{
		"inputs": [
			{ "internalType": "uint8", "name": "donHostedSecretsSlotID", "type": "uint8" },
			{ "internalType": "uint64", "name": "donHostedSecretsVersion", "type": "uint64" },
			{ "internalType": "string[]", "name": "args", "type": "string[]" },
			{ "internalType": "uint64", "name": "subscriptionId", "type": "uint64" }
		],
		"name": "sendRequest",
		"outputs": [{ "internalType": "bytes32", "name": "requestId", "type": "bytes32" }],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getSkillsData",
		"outputs": [{ "internalType": "string", "name": "", "type": "string" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [{ "internalType": "address", "name": "addr", "type": "address" }],
		"name": "isAllowListed",
		"outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "s_lastRequestId",
		"outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "s_lastResponse",
		"outputs": [{ "internalType": "bytes", "name": "", "type": "bytes" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "s_lastError",
		"outputs": [{ "internalType": "bytes", "name": "", "type": "bytes" }],
		"stateMutability": "view",
		"type": "function"
	}
] as const;

// TIME_TOKEN_ABI (full version for backward compatibility)
export const TIME_TOKEN_ABI = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [
			{ "internalType": "address", "name": "sender", "type": "address" },
			{ "internalType": "uint256", "name": "balance", "type": "uint256" },
			{ "internalType": "uint256", "name": "needed", "type": "uint256" },
			{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }
		],
		"name": "ERC1155InsufficientBalance",
		"type": "error"
	},
	{
		"inputs": [{ "internalType": "address", "name": "approver", "type": "address" }],
		"name": "ERC1155InvalidApprover",
		"type": "error"
	},
	{
		"inputs": [
			{ "internalType": "uint256", "name": "idsLength", "type": "uint256" },
			{ "internalType": "uint256", "name": "valuesLength", "type": "uint256" }
		],
		"name": "ERC1155InvalidArrayLength",
		"type": "error"
	},
	{
		"inputs": [{ "internalType": "address", "name": "operator", "type": "address" }],
		"name": "ERC1155InvalidOperator",
		"type": "error"
	},
	{
		"inputs": [{ "internalType": "address", "name": "receiver", "type": "address" }],
		"name": "ERC1155InvalidReceiver",
		"type": "error"
	},
	{
		"inputs": [{ "internalType": "address", "name": "sender", "type": "address" }],
		"name": "ERC1155InvalidSender",
		"type": "error"
	},
	{
		"inputs": [
			{ "internalType": "address", "name": "operator", "type": "address" },
			{ "internalType": "address", "name": "owner", "type": "address" }
		],
		"name": "ERC1155MissingApprovalForAll",
		"type": "error"
	},
	{
		"inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
		"name": "OwnableInvalidOwner",
		"type": "error"
	},
	{
		"inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
		"name": "OwnableUnauthorizedAccount",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "ReentrancyGuardReentrantCall",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{ "indexed": true, "internalType": "address", "name": "account", "type": "address" },
			{ "indexed": true, "internalType": "address", "name": "operator", "type": "address" },
			{ "indexed": false, "internalType": "bool", "name": "approved", "type": "bool" }
		],
		"name": "ApprovalForAll",
		"type": "event"
	},
	{
		"inputs": [
			{ "internalType": "address", "name": "creator", "type": "address" },
			{ "internalType": "string", "name": "serviceName", "type": "string" },
			{ "internalType": "uint256", "name": "pricePerHour", "type": "uint256" },
			{ "internalType": "uint256", "name": "totalHours", "type": "uint256" },
			{ "internalType": "uint256", "name": "validityDays", "type": "uint256" }
		],
		"name": "createTimeToken",
		"outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
		"name": "deactivateToken",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{ "internalType": "uint256", "name": "tokenId", "type": "uint256" },
			{ "internalType": "address", "name": "buyer", "type": "address" },
			{ "internalType": "uint256", "name": "hoursAmount", "type": "uint256" }
		],
		"name": "markServiceCompleted",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{ "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" },
			{ "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }
		],
		"name": "OwnershipTransferred",
		"type": "event"
	},
	{
		"inputs": [
			{ "internalType": "uint256", "name": "tokenId", "type": "uint256" },
			{ "internalType": "uint256", "name": "hoursAmount", "type": "uint256" }
		],
		"name": "purchaseTimeToken",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "renounceOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{ "internalType": "address", "name": "from", "type": "address" },
			{ "internalType": "address", "name": "to", "type": "address" },
			{ "internalType": "uint256[]", "name": "ids", "type": "uint256[]" },
			{ "internalType": "uint256[]", "name": "values", "type": "uint256[]" },
			{ "internalType": "bytes", "name": "data", "type": "bytes" }
		],
		"name": "safeBatchTransferFrom",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{ "internalType": "address", "name": "from", "type": "address" },
			{ "internalType": "address", "name": "to", "type": "address" },
			{ "internalType": "uint256", "name": "id", "type": "uint256" },
			{ "internalType": "uint256", "name": "value", "type": "uint256" },
			{ "internalType": "bytes", "name": "data", "type": "bytes" }
		],
		"name": "safeTransferFrom",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{ "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" },
			{ "indexed": true, "internalType": "address", "name": "buyer", "type": "address" },
			{ "indexed": false, "internalType": "uint256", "name": "hoursCompleted", "type": "uint256" }
		],
		"name": "ServiceCompleted",
		"type": "event"
	},
	{
		"inputs": [
			{ "internalType": "address", "name": "operator", "type": "address" },
			{ "internalType": "bool", "name": "approved", "type": "bool" }
		],
		"name": "setApprovalForAll",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{ "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" },
			{ "indexed": true, "internalType": "address", "name": "creator", "type": "address" },
			{ "indexed": false, "internalType": "string", "name": "serviceName", "type": "string" },
			{ "indexed": false, "internalType": "uint256", "name": "pricePerHour", "type": "uint256" },
			{ "indexed": false, "internalType": "uint256", "name": "totalHours", "type": "uint256" }
		],
		"name": "TimeTokenCreated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{ "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" },
			{ "indexed": true, "internalType": "address", "name": "buyer", "type": "address" },
			{ "indexed": false, "internalType": "uint256", "name": "hoursAmount", "type": "uint256" },
			{ "indexed": false, "internalType": "uint256", "name": "totalPrice", "type": "uint256" }
		],
		"name": "TimeTokenPurchased",
		"type": "event"
	},
	{
		"inputs": [{ "internalType": "address", "name": "newOwner", "type": "address" }],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{ "indexed": true, "internalType": "address", "name": "operator", "type": "address" },
			{ "indexed": true, "internalType": "address", "name": "from", "type": "address" },
			{ "indexed": true, "internalType": "address", "name": "to", "type": "address" },
			{ "indexed": false, "internalType": "uint256[]", "name": "ids", "type": "uint256[]" },
			{ "indexed": false, "internalType": "uint256[]", "name": "values", "type": "uint256[]" }
		],
		"name": "TransferBatch",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{ "indexed": true, "internalType": "address", "name": "operator", "type": "address" },
			{ "indexed": true, "internalType": "address", "name": "from", "type": "address" },
			{ "indexed": true, "internalType": "address", "name": "to", "type": "address" },
			{ "indexed": false, "internalType": "uint256", "name": "id", "type": "uint256" },
			{ "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }
		],
		"name": "TransferSingle",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{ "indexed": false, "internalType": "string", "name": "value", "type": "string" },
			{ "indexed": true, "internalType": "uint256", "name": "id", "type": "uint256" }
		],
		"name": "URI",
		"type": "event"
	},
	{
		"inputs": [
			{ "internalType": "address", "name": "account", "type": "address" },
			{ "internalType": "uint256", "name": "id", "type": "uint256" }
		],
		"name": "balanceOf",
		"outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{ "internalType": "address[]", "name": "accounts", "type": "address[]" },
			{ "internalType": "uint256[]", "name": "ids", "type": "uint256[]" }
		],
		"name": "balanceOfBatch",
		"outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{ "internalType": "address", "name": "", "type": "address" },
			{ "internalType": "uint256", "name": "", "type": "uint256" }
		],
		"name": "buyerTokens",
		"outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{ "internalType": "address", "name": "", "type": "address" },
			{ "internalType": "uint256", "name": "", "type": "uint256" }
		],
		"name": "creatorTokens",
		"outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [{ "internalType": "address", "name": "buyer", "type": "address" }],
		"name": "getBuyerTokens",
		"outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [{ "internalType": "address", "name": "creator", "type": "address" }],
		"name": "getCreatorTokens",
		"outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getCurrentTokenId",
		"outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
		"name": "getMarketData",
		"outputs": [
			{ "internalType": "uint256", "name": "availableHours", "type": "uint256" },
			{ "internalType": "uint256", "name": "pricePerHour", "type": "uint256" },
			{ "internalType": "uint256", "name": "validUntil", "type": "uint256" },
			{ "internalType": "bool", "name": "isActive", "type": "bool" }
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
		"name": "getTimeToken",
		"outputs": [
			{
				"components": [
					{ "internalType": "address", "name": "creator", "type": "address" },
					{ "internalType": "string", "name": "serviceName", "type": "string" },
					{ "internalType": "uint256", "name": "pricePerHour", "type": "uint256" },
					{ "internalType": "uint256", "name": "totalHours", "type": "uint256" },
					{ "internalType": "uint256", "name": "availableHours", "type": "uint256" },
					{ "internalType": "uint256", "name": "validUntil", "type": "uint256" },
					{ "internalType": "bool", "name": "isActive", "type": "bool" }
				],
				"internalType": "struct TokenizeAI.TimeToken",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{ "internalType": "address", "name": "account", "type": "address" },
			{ "internalType": "address", "name": "operator", "type": "address" }
		],
		"name": "isApprovedForAll",
		"outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [{ "internalType": "address", "name": "", "type": "address" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [{ "internalType": "bytes4", "name": "interfaceId", "type": "bytes4" }],
		"name": "supportsInterface",
		"outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
		"name": "timeTokens",
		"outputs": [
			{ "internalType": "address", "name": "creator", "type": "address" },
			{ "internalType": "string", "name": "serviceName", "type": "string" },
			{ "internalType": "uint256", "name": "pricePerHour", "type": "uint256" },
			{ "internalType": "uint256", "name": "totalHours", "type": "uint256" },
			{ "internalType": "uint256", "name": "availableHours", "type": "uint256" },
			{ "internalType": "uint256", "name": "validUntil", "type": "uint256" },
			{ "internalType": "bool", "name": "isActive", "type": "bool" }
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
		"name": "uri",
		"outputs": [{ "internalType": "string", "name": "", "type": "string" }],
		"stateMutability": "view",
		"type": "function"
	}
] as const;

// Legacy export for backward compatibility
export const erc1155Abi = TIME_TOKEN_ABI;