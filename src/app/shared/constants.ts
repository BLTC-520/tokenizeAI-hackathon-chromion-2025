// constants.ts
// Clean TokenizeAI Smart Contract Configuration

// ===== CHAIN CONFIGURATION =====
export const AVALANCHE_FUJI_CHAIN_ID = 43113;
export const BASE_SEPOLIA_CHAIN_ID = 84532;
export const ETHEREUM_SEPOLIA_CHAIN_ID = 11155111;

// ===== CONTRACT ADDRESSES =====
// Time Token Contract Addresses (ERC-1155)
export const TIME_TOKEN_CONTRACT_ADDRESSES = {
	[ETHEREUM_SEPOLIA_CHAIN_ID]: "0xcEC74F686A7EEC2d818a1646996F3eDc9da890EA",
	[BASE_SEPOLIA_CHAIN_ID]: "0xf38C634Eaa7af92762673FBa910b44E2DCB2282B",
	[AVALANCHE_FUJI_CHAIN_ID]: "0xcEC74F686A7EEC2d818a1646996F3eDc9da890EA"
} as const;

// GetSkillPrice Contract Addresses (Chainlink Functions)
export const GETSKILLPRICE_CONTRACT_ADDRESSES = {
	[AVALANCHE_FUJI_CHAIN_ID]: process.env.NEXT_PUBLIC_GETSKILLPRICE_CONTRACT_AVALANCHE || "0x5f6b3e64a1823ab48bf4acb8b3716ac7b77defb1"
} as const;

// KYC Contract Addresses (GetWalletKYC.sol)
export const KYC_CONTRACT_ADDRESSES = {
	ETHEREUM_SEPOLIA: process.env.NEXT_PUBLIC_KYC_CONTRACT_ETHEREUM || "0x0000000000000000000000000000000000000000",
	BASE_SEPOLIA: process.env.NEXT_PUBLIC_KYC_CONTRACT_BASE || "0x0000000000000000000000000000000000000000",
	AVALANCHE_FUJI: process.env.NEXT_PUBLIC_KYC_CONTRACT_AVALANCHE || "0xE552B807E1A1A6B2393aF3781fEc54127756be0E"
} as const;

// Default contract addresses for easy access
export const DEFAULT_TIME_TOKEN_CONTRACT = TIME_TOKEN_CONTRACT_ADDRESSES[AVALANCHE_FUJI_CHAIN_ID];
export const DEFAULT_GETSKILLPRICE_CONTRACT = GETSKILLPRICE_CONTRACT_ADDRESSES[AVALANCHE_FUJI_CHAIN_ID];
export const KYC_CONTRACT_ADDRESS = KYC_CONTRACT_ADDRESSES.AVALANCHE_FUJI;

// ===== NETWORK CONFIGURATION =====
export const RPC_URLS = {
	[AVALANCHE_FUJI_CHAIN_ID]: process.env.AVALANCHE_FUJI_RPC || 'https://avax-fuji.g.alchemy.com/v2/ZDRXbJd_qraq5rTvWv4Qv',
	[BASE_SEPOLIA_CHAIN_ID]: process.env.SEPOLIA_BASE_RPC || 'https://base-sepolia.g.alchemy.com/v2/ZDRXbJd_qraq5rTvWv4Qv',
	[ETHEREUM_SEPOLIA_CHAIN_ID]: process.env.SEPOLIA_ETH_RPC || 'https://eth-sepolia.g.alchemy.com/v2/ZDRXbJd_qraq5rTvWv4Qv'
} as const;

export const BLOCK_EXPLORERS = {
	[AVALANCHE_FUJI_CHAIN_ID]: 'https://testnet.snowtrace.io',
	[BASE_SEPOLIA_CHAIN_ID]: 'https://sepolia.basescan.org',
	[ETHEREUM_SEPOLIA_CHAIN_ID]: 'https://sepolia.etherscan.io'
} as const;


// ===== WEB3 CONFIGURATION =====
export const WEB3_CONFIG = {
	WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
	PRIVATE_KEY: process.env.PRIVATE_KEY || "",
	SUPPORTED_CHAINS: [AVALANCHE_FUJI_CHAIN_ID, BASE_SEPOLIA_CHAIN_ID, ETHEREUM_SEPOLIA_CHAIN_ID]
} as const;

// ===== AI CONFIGURATION =====
export const AI_CONFIG = {
	GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "",
	MODEL_NAME: "gemini-1.5-flash",
	MAX_TOKENS: 8192,
	TEMPERATURE: 0.7
} as const;

// ===== CHAINLINK FUNCTIONS CONFIGURATION =====
export const CHAINLINK_CONFIG = {
	DON_ID: process.env.CHAINLINK_DON_ID || 'fun-avalanche-fuji-1',
	DON_HOSTED_SECRETS_SLOT_ID: parseInt(process.env.CHAINLINK_SECRETS_SLOT_ID || '0'),
	DON_HOSTED_SECRETS_VERSION: parseInt(process.env.CHAINLINK_SECRETS_VERSION || '1'),
	SUBSCRIPTION_ID: process.env.CHAINLINK_SUBSCRIPTION_ID || "15603",
	GAS_LIMIT: 500000,
	BATCH_GAS_LIMIT: 1000000,
	REQUEST_TIMEOUT: 60000
} as const;

// ===== SUPABASE CONFIGURATION =====
export const SUPABASE_CONFIG = {
	url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wtsruzsccudercdaxbmp.supabase.co',
	anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
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

// API Endpoints
export const API_ENDPOINTS = {
	SUPABASE_SKILLS_ENDPOINT: `${SUPABASE_CONFIG.url}/rest/v1/${SUPABASE_CONFIG.tables.skillMarketData}`,
	CHAINLINK_FUNCTIONS_ENDPOINT: 'https://functions.chain.link',
	AVALANCHE_EXPLORER: 'https://testnet.snowtrace.io',
	BASE_EXPLORER: 'https://sepolia.basescan.org',
	ETHEREUM_EXPLORER: 'https://sepolia.etherscan.io'
} as const;

// ===== MARKET ANALYSIS CONFIGURATION =====
export const MARKET_ANALYSIS_CONFIG = {
	CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
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
	PRICE_RANGES: {
		premium: { min: 120, skills: ['defi', 'nft', 'blockchain'] },
		high: { min: 80, skills: ['ai', 'fullstack'] },
		medium: { min: 65, skills: ['backend', 'mobile', 'frontend'] },
		standard: { min: 55, skills: ['design', 'marketing'] }
	}
} as const;

// ===== HELPER FUNCTIONS =====
export const getTimeTokenContract = (chainId?: number): string => {
	if (!chainId) return DEFAULT_TIME_TOKEN_CONTRACT;
	return TIME_TOKEN_CONTRACT_ADDRESSES[chainId as keyof typeof TIME_TOKEN_CONTRACT_ADDRESSES] || DEFAULT_TIME_TOKEN_CONTRACT;
};

export const getSkillPriceContract = (chainId?: number): string => {
	if (!chainId) return DEFAULT_GETSKILLPRICE_CONTRACT;
	return GETSKILLPRICE_CONTRACT_ADDRESSES[chainId as keyof typeof GETSKILLPRICE_CONTRACT_ADDRESSES] || DEFAULT_GETSKILLPRICE_CONTRACT;
};

// ===== CONTRACT ABIs =====


// Import GetSkillPrice ABI from proper file
export { GET_SKILL_PRICE_ABI as GETSKILLPRICE_ABI } from '../abi/GetSkillPrice.abi';
export const GETSKILLPRICE_CONTRACT_ADDRESS = DEFAULT_GETSKILLPRICE_CONTRACT;

// ===== ERROR & SUCCESS MESSAGES =====
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
	TABLE_NOT_FOUND: 'Data table does not exist',
	COLUMN_NOT_FOUND: 'Data column does not exist',
	CONTRACT_ADDRESS_MISMATCH: 'Contract address configuration mismatch'
} as const;

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