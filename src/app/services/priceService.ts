'use client';

import { readContract, getChainId } from '@wagmi/core';
import { parseEther, formatEther } from 'viem';
import { config } from '../lib/wagmi';
import { 
  CHAINLINK_PRICE_FEEDS, 
  AVALANCHE_FUJI_CHAIN_ID, 
  ETHEREUM_SEPOLIA_CHAIN_ID, 
  BASE_SEPOLIA_CHAIN_ID 
} from '../shared/constants';
import { CHAINLINK_PRICE_FEED_ABI } from '../abi/ChainlinkPriceFeed.abi';

export interface PriceData {
  price: number;
  decimals: number;
  updatedAt: number;
  roundId: string;
}

export interface FormattedPrice {
  crypto: string;
  usd: string;
  cryptoAmount: number;
  usdAmount: number;
}

export class PriceService {
  private priceCache: Map<string, { data: PriceData; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 60000; // 1 minute cache

  // Get the appropriate price feed address for current chain
  private getPriceFeedAddress(chainId: number): string | null {
    switch (chainId) {
      case AVALANCHE_FUJI_CHAIN_ID:
        return CHAINLINK_PRICE_FEEDS[AVALANCHE_FUJI_CHAIN_ID].AVAX_USD;
      case ETHEREUM_SEPOLIA_CHAIN_ID:
        return CHAINLINK_PRICE_FEEDS[ETHEREUM_SEPOLIA_CHAIN_ID].ETH_USD;
      case BASE_SEPOLIA_CHAIN_ID:
        return CHAINLINK_PRICE_FEEDS[BASE_SEPOLIA_CHAIN_ID].ETH_USD;
      default:
        console.warn(`No price feed configured for chain ${chainId}`);
        return null;
    }
  }

  // Get the native currency symbol for current chain
  private getNativeCurrencySymbol(chainId: number): string {
    switch (chainId) {
      case AVALANCHE_FUJI_CHAIN_ID:
        return 'AVAX';
      case ETHEREUM_SEPOLIA_CHAIN_ID:
      case BASE_SEPOLIA_CHAIN_ID:
        return 'ETH';
      default:
        return 'ETH';
    }
  }

  // Get latest price from Chainlink Price Feed
  async getLatestPrice(chainId?: number): Promise<PriceData> {
    try {
      const currentChainId = chainId || getChainId(config);
      const cacheKey = `price_${currentChainId}`;
      
      // Check cache first
      const cached = this.priceCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        console.log('🎯 Using cached price data');
        return cached.data;
      }

      const priceFeedAddress = this.getPriceFeedAddress(currentChainId);
      if (!priceFeedAddress) {
        throw new Error(`No price feed available for chain ${currentChainId}`);
      }

      console.log('📊 Fetching latest price from Chainlink:', {
        chainId: currentChainId,
        priceFeedAddress,
        currency: this.getNativeCurrencySymbol(currentChainId)
      });

      // Get latest round data from Chainlink
      const roundData = await readContract(config, {
        address: priceFeedAddress as `0x${string}`,
        abi: CHAINLINK_PRICE_FEED_ABI,
        functionName: 'latestRoundData'
      }) as [bigint, bigint, bigint, bigint, bigint];

      const [roundId, answer, startedAt, updatedAt, answeredInRound] = roundData;

      // Get decimals for proper price formatting
      const decimals = await readContract(config, {
        address: priceFeedAddress as `0x${string}`,
        abi: CHAINLINK_PRICE_FEED_ABI,
        functionName: 'decimals'
      }) as number;

      // Convert price to readable format
      const price = Number(answer) / Math.pow(10, decimals);

      const priceData: PriceData = {
        price,
        decimals,
        updatedAt: Number(updatedAt),
        roundId: roundId.toString()
      };

      // Cache the result
      this.priceCache.set(cacheKey, {
        data: priceData,
        timestamp: Date.now()
      });

      console.log('✅ Price fetched successfully:', {
        price: `$${price.toFixed(2)}`,
        currency: this.getNativeCurrencySymbol(currentChainId),
        updatedAt: new Date(Number(updatedAt) * 1000).toISOString()
      });

      return priceData;

    } catch (error) {
      console.error('❌ Failed to fetch price from Chainlink:', error);
      
      // Return fallback price data (approximate current prices)
      const fallbackPrices = {
        [AVALANCHE_FUJI_CHAIN_ID]: 32.50, // AVAX approximate price
        [ETHEREUM_SEPOLIA_CHAIN_ID]: 3200.00, // ETH approximate price
        [BASE_SEPOLIA_CHAIN_ID]: 3200.00 // ETH on Base
      };

      const currentChainId = chainId || getChainId(config);
      const fallbackPrice = fallbackPrices[currentChainId as keyof typeof fallbackPrices] || 100;

      console.warn('⚠️ Using fallback price:', fallbackPrice);

      return {
        price: fallbackPrice,
        decimals: 8,
        updatedAt: Math.floor(Date.now() / 1000),
        roundId: 'fallback'
      };
    }
  }

  // Convert USD amount to native crypto amount (AVAX/ETH)
  async convertUSDToCrypto(usdAmount: number, chainId?: number): Promise<bigint> {
    try {
      const priceData = await this.getLatestPrice(chainId);
      const cryptoAmount = usdAmount / priceData.price;
      
      console.log('💱 USD to Crypto conversion:', {
        usdAmount: `$${usdAmount}`,
        pricePerCrypto: `$${priceData.price.toFixed(2)}`,
        cryptoAmount: `${cryptoAmount.toFixed(6)}`,
        currency: this.getNativeCurrencySymbol(chainId || getChainId(config))
      });

      return parseEther(cryptoAmount.toString());
    } catch (error) {
      console.error('❌ USD to Crypto conversion failed:', error);
      throw error;
    }
  }

  // Convert crypto amount to USD
  async convertCryptoToUSD(cryptoAmount: bigint, chainId?: number): Promise<number> {
    try {
      const priceData = await this.getLatestPrice(chainId);
      const cryptoNumber = Number(formatEther(cryptoAmount));
      const usdAmount = cryptoNumber * priceData.price;

      console.log('💱 Crypto to USD conversion:', {
        cryptoAmount: `${cryptoNumber.toFixed(6)}`,
        currency: this.getNativeCurrencySymbol(chainId || getChainId(config)),
        pricePerCrypto: `$${priceData.price.toFixed(2)}`,
        usdAmount: `$${usdAmount.toFixed(2)}`
      });

      return usdAmount;
    } catch (error) {
      console.error('❌ Crypto to USD conversion failed:', error);
      throw error;
    }
  }

  // Format price for display with both crypto and USD
  async formatPrice(cryptoAmountWei: bigint, chainId?: number): Promise<FormattedPrice> {
    try {
      const currentChainId = chainId || getChainId(config);
      const currency = this.getNativeCurrencySymbol(currentChainId);
      const cryptoAmount = Number(formatEther(cryptoAmountWei));
      const usdAmount = await this.convertCryptoToUSD(cryptoAmountWei, currentChainId);

      return {
        crypto: `${cryptoAmount.toFixed(4)} ${currency}`,
        usd: `≈ $${usdAmount.toFixed(2)} USD`,
        cryptoAmount,
        usdAmount
      };
    } catch (error) {
      console.error('❌ Price formatting failed:', error);
      const currency = this.getNativeCurrencySymbol(chainId || getChainId(config));
      const cryptoAmount = Number(formatEther(cryptoAmountWei));
      
      return {
        crypto: `${cryptoAmount.toFixed(4)} ${currency}`,
        usd: 'Price unavailable',
        cryptoAmount,
        usdAmount: 0
      };
    }
  }

  // Get current native currency info
  getCurrentCurrencyInfo(chainId?: number) {
    const currentChainId = chainId || getChainId(config);
    return {
      symbol: this.getNativeCurrencySymbol(currentChainId),
      chainId: currentChainId,
      priceFeedAddress: this.getPriceFeedAddress(currentChainId)
    };
  }

  // Clear price cache (useful for testing or manual refresh)
  clearCache(): void {
    this.priceCache.clear();
    console.log('🗑️ Price cache cleared');
  }
}

// Global price service instance
let priceServiceInstance: PriceService | null = null;

export const getPriceService = (): PriceService => {
  if (!priceServiceInstance) {
    priceServiceInstance = new PriceService();
  }
  return priceServiceInstance;
};

export default PriceService;