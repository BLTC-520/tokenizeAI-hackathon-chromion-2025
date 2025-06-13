'use client';

import { writeContract, readContract, waitForTransactionReceipt, getAccount, getChainId } from '@wagmi/core';
import { parseEther, formatEther, parseUnits, formatUnits } from 'viem';
import { erc1155Abi, CONTRACT_ADDRESSES } from '../../../constants';
import { getContractAddress } from '../lib/wagmi';
import { config } from '../lib/wagmi';
import { getAlertAgent } from './alertAgent';
import { handleError } from '../utils/errorHandling';
import { validateTokenCreation, validateWallet } from '../utils/validation';

export interface TimeToken {
  tokenId: string;
  creator: string;
  serviceName: string;
  pricePerHour: bigint;
  totalHours: bigint;
  availableHours: bigint;
  validUntil: bigint;
  isActive: boolean;
}

export interface TokenCreationParams {
  serviceName: string;
  pricePerHour: number; // in USD (will be converted to wei)
  totalHours: number;
  validityDays: number;
}

export interface TokenPurchaseParams {
  tokenId: string;
  hoursAmount: number;
  totalPrice: bigint;
}

export interface ContractTransaction {
  hash: string;
  type: 'create' | 'purchase' | 'complete' | 'deactivate';
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  tokenId?: string;
  metadata?: any;
}

export class ContractService {
  private alertAgent = getAlertAgent();

  // Create a new time token
  async createTimeToken(params: TokenCreationParams): Promise<{ hash: string; tokenId?: string }> {
    try {
      console.log('🚀 Creating time token:', params);

      // Validate input parameters
      const validation = validateTokenCreation(params);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const account = getAccount(config);
      const chainId = getChainId(config);
      
      if (!account.address) {
        throw new Error('Wallet not connected');
      }

      // Validate wallet
      const walletValidation = validateWallet({ address: account.address, chainId });
      if (!walletValidation.isValid) {
        throw new Error(`Wallet validation failed: ${walletValidation.errors.join(', ')}`);
      }

      const contractAddress = getContractAddress(chainId);
      console.log('📍 Using contract:', contractAddress, 'on chain:', chainId);

      // Convert price from USD to wei (assuming 1 USD = 1 wei for simplicity in testnet)
      const pricePerHourWei = parseUnits(params.pricePerHour.toString(), 18);
      
      // Call the smart contract
      const hash = await writeContract(config, {
        address: contractAddress as `0x${string}`,
        abi: erc1155Abi,
        functionName: 'createTimeToken',
        args: [
          account.address,
          params.serviceName,
          pricePerHourWei,
          BigInt(params.totalHours),
          BigInt(params.validityDays)
        ]
      });

      console.log('📝 Transaction submitted:', hash);

      // Add pending notification
      this.alertAgent.addNotification({
        type: 'system',
        title: '⏳ Token Creation Pending',
        message: `Creating "${params.serviceName}" token...`,
        priority: 'medium',
        metadata: { 
          transactionHash: hash,
          serviceName: params.serviceName 
        }
      });

      // Wait for transaction confirmation
      try {
        const receipt = await waitForTransactionReceipt(config, { hash });
        console.log('✅ Transaction confirmed:', receipt);

        // Get the token ID from events (simplified - in real implementation, parse logs)
        const currentTokenId = await this.getCurrentTokenId();
        
        // Add success notification
        this.alertAgent.addNotification({
          type: 'token_created',
          title: '🎉 Token Created Successfully',
          message: `Your "${params.serviceName}" token is now live at $${params.pricePerHour}/hour`,
          priority: 'high',
          actionUrl: `/tokens/${currentTokenId}`,
          actionLabel: 'View Token',
          metadata: { 
            tokenId: currentTokenId.toString(),
            amount: params.pricePerHour 
          }
        });

        return { hash, tokenId: currentTokenId.toString() };
      } catch (waitError) {
        console.error('❌ Transaction failed:', waitError);
        
        // Add failure notification
        this.alertAgent.addNotification({
          type: 'system',
          title: '❌ Token Creation Failed',
          message: `Failed to create "${params.serviceName}" token`,
          priority: 'high'
        });

        throw waitError;
      }

    } catch (error) {
      console.error('❌ Failed to create time token:', error);
      
      // Handle error using error handling system
      const errorDetails = handleError(error, {
        component: 'ContractService',
        action: 'createTimeToken',
        chainId: getChainId(config),
        contractAddress: getContractAddress(getChainId(config))
      });

      throw error;
    }
  }

  // Purchase time tokens
  async purchaseTimeToken(params: TokenPurchaseParams): Promise<string> {
    try {
      console.log('💰 Purchasing time token:', params);

      const account = getAccount(config);
      const chainId = getChainId(config);
      
      if (!account.address) {
        throw new Error('Wallet not connected');
      }

      const contractAddress = getContractAddress(chainId);

      const hash = await writeContract(config, {
        address: contractAddress as `0x${string}`,
        abi: erc1155Abi,
        functionName: 'purchaseTimeToken',
        args: [
          BigInt(params.tokenId),
          BigInt(params.hoursAmount)
        ],
        value: params.totalPrice
      });

      console.log('📝 Purchase transaction submitted:', hash);

      // Add pending notification
      this.alertAgent.addNotification({
        type: 'system',
        title: '⏳ Purchase Pending',
        message: `Purchasing ${params.hoursAmount}h of service...`,
        priority: 'medium',
        metadata: { transactionHash: hash }
      });

      // Wait for confirmation
      const receipt = await waitForTransactionReceipt(config, { hash });
      console.log('✅ Purchase confirmed:', receipt);

      // Add success notification
      this.alertAgent.addNotification({
        type: 'token_purchased',
        title: '💰 Purchase Successful',
        message: `Successfully purchased ${params.hoursAmount}h of service`,
        priority: 'high',
        actionUrl: `/dashboard/purchases`,
        actionLabel: 'View Purchase',
        metadata: { 
          tokenId: params.tokenId,
          amount: Number(formatEther(params.totalPrice))
        }
      });

      return hash;

    } catch (error) {
      console.error('❌ Failed to purchase time token:', error);
      
      this.alertAgent.addNotification({
        type: 'system',
        title: '❌ Purchase Failed',
        message: error instanceof Error ? error.message : 'Purchase failed',
        priority: 'high'
      });

      throw error;
    }
  }

  // Mark service as completed
  async markServiceCompleted(tokenId: string, buyer: string, hoursAmount: number): Promise<string> {
    try {
      console.log('✅ Marking service completed:', { tokenId, buyer, hoursAmount });

      const account = getAccount(config);
      const chainId = getChainId(config);
      
      if (!account.address) {
        throw new Error('Wallet not connected');
      }

      const contractAddress = getContractAddress(chainId);

      const hash = await writeContract(config, {
        address: contractAddress as `0x${string}`,
        abi: erc1155Abi,
        functionName: 'markServiceCompleted',
        args: [
          BigInt(tokenId),
          buyer as `0x${string}`,
          BigInt(hoursAmount)
        ]
      });

      console.log('📝 Service completion transaction submitted:', hash);

      const receipt = await waitForTransactionReceipt(config, { hash });
      console.log('✅ Service completion confirmed:', receipt);

      // Add notification
      this.alertAgent.addNotification({
        type: 'service_completed',
        title: '✅ Service Completed',
        message: `${hoursAmount}h of service has been marked as completed`,
        priority: 'medium',
        actionUrl: `/dashboard/services`,
        actionLabel: 'View Services',
        metadata: { tokenId }
      });

      return hash;

    } catch (error) {
      console.error('❌ Failed to mark service completed:', error);
      throw error;
    }
  }

  // Deactivate token
  async deactivateToken(tokenId: string): Promise<string> {
    try {
      console.log('🔒 Deactivating token:', tokenId);

      const account = getAccount(config);
      const chainId = getChainId(config);
      
      if (!account.address) {
        throw new Error('Wallet not connected');
      }

      const contractAddress = getContractAddress(chainId);

      const hash = await writeContract(config, {
        address: contractAddress as `0x${string}`,
        abi: erc1155Abi,
        functionName: 'deactivateToken',
        args: [BigInt(tokenId)]
      });

      console.log('📝 Deactivation transaction submitted:', hash);

      const receipt = await waitForTransactionReceipt(config, { hash });
      console.log('✅ Token deactivated:', receipt);

      this.alertAgent.addNotification({
        type: 'system',
        title: '🔒 Token Deactivated',
        message: `Token #${tokenId} has been deactivated`,
        priority: 'medium'
      });

      return hash;

    } catch (error) {
      console.error('❌ Failed to deactivate token:', error);
      throw error;
    }
  }

  // Read contract functions

  // Get current token ID
  async getCurrentTokenId(): Promise<bigint> {
    try {
      const chainId = getChainId(config);
      const contractAddress = getContractAddress(chainId);

      const tokenId = await readContract(config, {
        address: contractAddress as `0x${string}`,
        abi: erc1155Abi,
        functionName: 'getCurrentTokenId'
      });

      return tokenId as bigint;
    } catch (error) {
      console.error('❌ Failed to get current token ID:', error);
      return BigInt(0);
    }
  }

  // Get time token details
  async getTimeToken(tokenId: string): Promise<TimeToken | null> {
    try {
      const chainId = getChainId(config);
      const contractAddress = getContractAddress(chainId);

      const tokenData = await readContract(config, {
        address: contractAddress as `0x${string}`,
        abi: erc1155Abi,
        functionName: 'getTimeToken',
        args: [BigInt(tokenId)]
      });

      if (!tokenData) return null;

      const token = tokenData as any;
      
      return {
        tokenId,
        creator: token.creator,
        serviceName: token.serviceName,
        pricePerHour: token.pricePerHour,
        totalHours: token.totalHours,
        availableHours: token.availableHours,
        validUntil: token.validUntil,
        isActive: token.isActive
      };

    } catch (error) {
      console.error('❌ Failed to get time token:', error);
      return null;
    }
  }

  // Get market data for a token
  async getMarketData(tokenId: string): Promise<{
    availableHours: bigint;
    pricePerHour: bigint;
    validUntil: bigint;
    isActive: boolean;
  } | null> {
    try {
      const chainId = getChainId(config);
      const contractAddress = getContractAddress(chainId);

      const marketData = await readContract(config, {
        address: contractAddress as `0x${string}`,
        abi: erc1155Abi,
        functionName: 'getMarketData',
        args: [BigInt(tokenId)]
      });

      const data = marketData as any;
      
      return {
        availableHours: data[0],
        pricePerHour: data[1],
        validUntil: data[2],
        isActive: data[3]
      };

    } catch (error) {
      console.error('❌ Failed to get market data:', error);
      return null;
    }
  }

  // Get user's created tokens
  async getCreatorTokens(creator: string): Promise<bigint[]> {
    try {
      const chainId = getChainId(config);
      const contractAddress = getContractAddress(chainId);

      const tokens = await readContract(config, {
        address: contractAddress as `0x${string}`,
        abi: erc1155Abi,
        functionName: 'getCreatorTokens',
        args: [creator as `0x${string}`]
      });

      return tokens as bigint[];

    } catch (error) {
      console.error('❌ Failed to get creator tokens:', error);
      return [];
    }
  }

  // Get user's purchased tokens
  async getBuyerTokens(buyer: string): Promise<bigint[]> {
    try {
      const chainId = getChainId(config);
      const contractAddress = getContractAddress(chainId);

      const tokens = await readContract(config, {
        address: contractAddress as `0x${string}`,
        abi: erc1155Abi,
        functionName: 'getBuyerTokens',
        args: [buyer as `0x${string}`]
      });

      return tokens as bigint[];

    } catch (error) {
      console.error('❌ Failed to get buyer tokens:', error);
      return [];
    }
  }

  // Get token balance for user
  async getTokenBalance(account: string, tokenId: string): Promise<bigint> {
    try {
      const chainId = getChainId(config);
      const contractAddress = getContractAddress(chainId);

      const balance = await readContract(config, {
        address: contractAddress as `0x${string}`,
        abi: erc1155Abi,
        functionName: 'balanceOf',
        args: [account as `0x${string}`, BigInt(tokenId)]
      });

      return balance as bigint;

    } catch (error) {
      console.error('❌ Failed to get token balance:', error);
      return BigInt(0);
    }
  }

  // Utility functions
  
  // Calculate token purchase cost
  calculatePurchaseCost(pricePerHour: bigint, hours: number): bigint {
    return pricePerHour * BigInt(hours);
  }

  // Check if token is expired
  isTokenExpired(validUntil: bigint): boolean {
    const now = BigInt(Math.floor(Date.now() / 1000));
    return now > validUntil;
  }

  // Format price for display
  formatPrice(priceWei: bigint): string {
    return formatEther(priceWei);
  }

  // Convert hours to display format
  formatHours(hours: bigint): string {
    return hours.toString();
  }

  // Convert timestamp to date
  formatValidUntil(timestamp: bigint): string {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString();
  }

  // Estimate gas cost (simplified)
  async estimateGasCost(type: 'create' | 'purchase' | 'complete'): Promise<bigint> {
    // Simplified gas estimates - in production, use actual gas estimation
    const gasEstimates = {
      create: parseEther('0.001'), // ~$2 at $2000 ETH
      purchase: parseEther('0.0005'), // ~$1 at $2000 ETH  
      complete: parseEther('0.0003') // ~$0.60 at $2000 ETH
    };
    
    return gasEstimates[type];
  }
}

// Global contract service instance
let contractServiceInstance: ContractService | null = null;

export const getContractService = (): ContractService => {
  if (!contractServiceInstance) {
    contractServiceInstance = new ContractService();
  }
  return contractServiceInstance;
};

export default ContractService;