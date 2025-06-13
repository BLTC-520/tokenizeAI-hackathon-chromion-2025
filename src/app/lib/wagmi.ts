import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, optimism, arbitrum, base, sepolia, baseSepolia } from 'wagmi/chains';
import { defineChain } from 'viem';
import { 
  CONTRACT_ADDRESSES, 
  AVALANCHE_FUJI_CHAIN_ID, 
  BASE_SEPOLIA_CHAIN_ID, 
  ETHEREUM_SEPOLIA_CHAIN_ID 
} from '../../../constants';

// Define Avalanche Fuji testnet
export const avalancheFuji = defineChain({
  id: AVALANCHE_FUJI_CHAIN_ID,
  name: 'Avalanche Fuji',
  nativeCurrency: {
    decimals: 18,
    name: 'AVAX',
    symbol: 'AVAX',
  },
  rpcUrls: {
    default: {
      http: [process.env.AVALANCHE_FUJI_RPC || 'https://api.avax-test.network/ext/bc/C/rpc'],
    },
  },
  blockExplorers: {
    default: { 
      name: 'SnowTrace', 
      url: 'https://testnet.snowtrace.io' 
    },
  },
  testnet: true,
});

// Chain configurations with contract addresses
export const supportedChains = [
  // Testnets (primary focus)
  avalancheFuji,
  sepolia,
  baseSepolia,
  // Mainnets (for future use)
  mainnet,
  base,
  polygon,
  optimism,
  arbitrum,
];

// Contract address mapping by chain ID
export const getContractAddress = (chainId: number): string => {
  switch (chainId) {
    case AVALANCHE_FUJI_CHAIN_ID:
      return CONTRACT_ADDRESSES.AVALANCHE_FUJI;
    case ETHEREUM_SEPOLIA_CHAIN_ID:
      return CONTRACT_ADDRESSES.ETHEREUM_SEPOLIA;
    case BASE_SEPOLIA_CHAIN_ID:
      return CONTRACT_ADDRESSES.BASE_SEPOLIA;
    default:
      // Default to Avalanche Fuji contract
      console.warn(`No contract address found for chainId ${chainId}, using Avalanche Fuji`);
      return CONTRACT_ADDRESSES.AVALANCHE_FUJI;
  }
};

// Chain display names
export const getChainDisplayName = (chainId: number): string => {
  switch (chainId) {
    case AVALANCHE_FUJI_CHAIN_ID:
      return 'Avalanche Fuji';
    case ETHEREUM_SEPOLIA_CHAIN_ID:
      return 'Ethereum Sepolia';
    case BASE_SEPOLIA_CHAIN_ID:
      return 'Base Sepolia';
    case 1:
      return 'Ethereum';
    case 8453:
      return 'Base';
    case 137:
      return 'Polygon';
    case 10:
      return 'Optimism';
    case 42161:
      return 'Arbitrum';
    default:
      return `Chain ${chainId}`;
  }
};

// Check if chain is supported for Time Tokenizer
export const isSupportedChain = (chainId: number): boolean => {
  return [
    AVALANCHE_FUJI_CHAIN_ID,
    ETHEREUM_SEPOLIA_CHAIN_ID,
    BASE_SEPOLIA_CHAIN_ID,
  ].includes(chainId);
};

// Default chain (Avalanche Fuji)
export const defaultChain = avalancheFuji;

export const config = getDefaultConfig({
  appName: 'Time Tokenizer',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'b76a362849ddcf14e3d326135eed54fe',
  chains: supportedChains,
  ssr: false,
  enableWalletConnect: true,
  enableInjected: true,
  enableCoinbase: true,
});