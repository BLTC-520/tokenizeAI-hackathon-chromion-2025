'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useChainId } from 'wagmi';
import { getContractService, TimeToken } from '../services/contractService';
import { formatEther } from 'viem';
import { isSupportedChain, getChainDisplayName } from '../lib/wagmi';
import NotificationCenter from './NotificationCenter';
import { ConnectButton } from '@rainbow-me/rainbowkit';

interface MarketplaceProps {
  onCreateToken?: () => void;
  onViewDashboard?: () => void;
}

export default function Marketplace({ onCreateToken, onViewDashboard }: MarketplaceProps) {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const [tokens, setTokens] = useState<TimeToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'available' | 'my_tokens'>('all');
  const [selectedToken, setSelectedToken] = useState<TimeToken | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseHours, setPurchaseHours] = useState(1);

  const contractService = getContractService();

  useEffect(() => {
    loadMarketplaceData();
  }, [isConnected, address, chainId]);

  const loadMarketplaceData = async () => {
    if (!isConnected || !isSupportedChain(chainId)) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('📊 Loading marketplace data...');

      // Get current token ID to know how many tokens exist
      const currentTokenId = await contractService.getCurrentTokenId();
      console.log('Current token ID:', currentTokenId.toString());

      // Load all tokens (simplified - in production, use pagination)
      const tokenPromises: Promise<TimeToken | null>[] = [];
      for (let i = 1; i <= Number(currentTokenId); i++) {
        tokenPromises.push(contractService.getTimeToken(i.toString()));
      }

      const allTokens = await Promise.all(tokenPromises);
      const validTokens = allTokens.filter((token): token is TimeToken => 
        token !== null && token.isActive
      );

      setTokens(validTokens);
      console.log('✅ Loaded', validTokens.length, 'active tokens');

    } catch (error) {
      console.error('❌ Failed to load marketplace data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseToken = async (token: TimeToken) => {
    if (!isConnected || !address) return;

    try {
      setIsPurchasing(true);
      
      const totalCost = contractService.calculatePurchaseCost(token.pricePerHour, purchaseHours);
      
      await contractService.purchaseTimeToken({
        tokenId: token.tokenId,
        hoursAmount: purchaseHours,
        totalPrice: totalCost
      });

      // Reload marketplace data to reflect changes
      await loadMarketplaceData();
      setSelectedToken(null);

    } catch (error) {
      console.error('❌ Purchase failed:', error);
    } finally {
      setIsPurchasing(false);
    }
  };

  const filteredTokens = tokens.filter(token => {
    switch (filter) {
      case 'available':
        return Number(token.availableHours) > 0 && !contractService.isTokenExpired(token.validUntil);
      case 'my_tokens':
        return token.creator.toLowerCase() === address?.toLowerCase();
      default:
        return true;
    }
  });

  const formatPrice = (priceWei: bigint) => {
    return parseFloat(formatEther(priceWei)).toFixed(2);
  };

  const formatValidUntil = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString();
  };

  const isExpired = (timestamp: bigint) => {
    return contractService.isTokenExpired(timestamp);
  };

  const calculatePurchaseCost = (pricePerHour: bigint, hours: number) => {
    const cost = contractService.calculatePurchaseCost(pricePerHour, hours);
    return parseFloat(formatEther(cost)).toFixed(4);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-blue-500 to-purple-600 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-white text-xl font-bold mb-2">Loading Marketplace</h2>
          <p className="text-white/70">Fetching active time tokens...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-blue-500 to-purple-600 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              🏪 Time Token Marketplace
            </h1>
            <p className="text-white/80 text-xl">
              Discover and purchase professional time tokens
            </p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationCenter />
            <ConnectButton />
          </div>
        </div>

        {/* Network Warning */}
        {isConnected && !isSupportedChain(chainId) && (
          <div className="bg-red-500/20 backdrop-blur border border-red-500/50 text-red-400 p-4 rounded-2xl mb-6">
            <p className="font-semibold">⚠️ Unsupported Network</p>
            <p className="text-sm">Please switch to {getChainDisplayName(chainId)} to view and purchase tokens</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          {onCreateToken && (
            <button
              onClick={onCreateToken}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-all"
            >
              🚀 Create New Token
            </button>
          )}
          {onViewDashboard && (
            <button
              onClick={onViewDashboard}
              className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-medium transition-all border border-white/30"
            >
              📊 My Dashboard
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 mb-8 border border-white/20">
          <div className="flex gap-4">
            {[
              { key: 'all', label: '🌐 All Tokens', count: tokens.length },
              { key: 'available', label: '✅ Available', count: tokens.filter(t => Number(t.availableHours) > 0 && !isExpired(t.validUntil)).length },
              { key: 'my_tokens', label: '👤 My Tokens', count: tokens.filter(t => t.creator.toLowerCase() === address?.toLowerCase()).length }
            ].map(filterOption => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key as any)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  filter === filterOption.key
                    ? 'bg-white text-purple-600'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                {filterOption.label} ({filterOption.count})
              </button>
            ))}
          </div>
        </div>

        {/* Tokens Grid */}
        {filteredTokens.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-2xl font-bold text-white mb-2">No Tokens Found</h3>
            <p className="text-white/70 mb-6">
              {filter === 'my_tokens' 
                ? 'You haven\'t created any tokens yet.' 
                : 'No active tokens match your current filter.'
              }
            </p>
            {filter === 'my_tokens' && onCreateToken && (
              <button
                onClick={onCreateToken}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-8 py-4 rounded-xl font-medium transition-all"
              >
                🚀 Create Your First Token
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTokens.map((token, index) => (
              <motion.div
                key={token.tokenId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white/10 backdrop-blur-lg rounded-3xl p-6 border transition-all hover:bg-white/15 cursor-pointer ${
                  isExpired(token.validUntil) ? 'border-red-500/30' : 'border-white/20'
                }`}
                onClick={() => setSelectedToken(token)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-white font-bold text-lg mb-1">{token.serviceName}</h3>
                    <p className="text-white/60 text-sm">
                      by {token.creator.slice(0, 6)}...{token.creator.slice(-4)}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    isExpired(token.validUntil) 
                      ? 'bg-red-500/20 text-red-400' 
                      : Number(token.availableHours) > 0
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {isExpired(token.validUntil) 
                      ? 'Expired' 
                      : Number(token.availableHours) > 0 
                        ? 'Available' 
                        : 'Sold Out'
                    }
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-white/60 text-xs">Price per Hour</div>
                    <div className="text-white font-bold">${formatPrice(token.pricePerHour)}</div>
                  </div>
                  <div>
                    <div className="text-white/60 text-xs">Available Hours</div>
                    <div className="text-white font-bold">{token.availableHours.toString()}h</div>
                  </div>
                  <div>
                    <div className="text-white/60 text-xs">Total Hours</div>
                    <div className="text-white font-bold">{token.totalHours.toString()}h</div>
                  </div>
                  <div>
                    <div className="text-white/60 text-xs">Valid Until</div>
                    <div className="text-white font-bold">{formatValidUntil(token.validUntil)}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-white/60 text-sm">
                    Token #{token.tokenId}
                  </div>
                  {token.creator.toLowerCase() !== address?.toLowerCase() && 
                   !isExpired(token.validUntil) && 
                   Number(token.availableHours) > 0 && (
                    <div className="text-green-400 font-medium text-sm">
                      Click to Purchase →
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Purchase Modal */}
        <AnimatePresence>
          {selectedToken && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedToken(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full border border-white/20"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold text-white mb-4">{selectedToken.serviceName}</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-white/60">Creator:</span>
                      <div className="text-white font-medium">
                        {selectedToken.creator.slice(0, 6)}...{selectedToken.creator.slice(-4)}
                      </div>
                    </div>
                    <div>
                      <span className="text-white/60">Price per Hour:</span>
                      <div className="text-white font-medium">${formatPrice(selectedToken.pricePerHour)}</div>
                    </div>
                    <div>
                      <span className="text-white/60">Available:</span>
                      <div className="text-white font-medium">{selectedToken.availableHours.toString()}h</div>
                    </div>
                    <div>
                      <span className="text-white/60">Valid Until:</span>
                      <div className="text-white font-medium">{formatValidUntil(selectedToken.validUntil)}</div>
                    </div>
                  </div>

                  {selectedToken.creator.toLowerCase() !== address?.toLowerCase() && 
                   !isExpired(selectedToken.validUntil) && 
                   Number(selectedToken.availableHours) > 0 && (
                    <div className="bg-white/5 rounded-2xl p-4">
                      <label className="block text-white/80 font-medium mb-2">Hours to Purchase</label>
                      <input
                        type="number"
                        min="1"
                        max={Number(selectedToken.availableHours)}
                        value={purchaseHours}
                        onChange={(e) => setPurchaseHours(parseInt(e.target.value) || 1)}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white/50"
                      />
                      <div className="mt-2 text-white/70 text-sm">
                        Total Cost: {calculatePurchaseCost(selectedToken.pricePerHour, purchaseHours)} ETH
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setSelectedToken(null)}
                    className="flex-1 bg-white/20 hover:bg-white/30 text-white py-3 px-6 rounded-xl font-medium transition-all"
                  >
                    Close
                  </button>
                  {selectedToken.creator.toLowerCase() !== address?.toLowerCase() && 
                   !isExpired(selectedToken.validUntil) && 
                   Number(selectedToken.availableHours) > 0 && (
                    <button
                      onClick={() => handlePurchaseToken(selectedToken)}
                      disabled={isPurchasing || !isConnected}
                      className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 disabled:from-gray-500 disabled:to-gray-600 text-white py-3 px-6 rounded-xl font-medium transition-all"
                    >
                      {isPurchasing ? 'Purchasing...' : 'Purchase'}
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}