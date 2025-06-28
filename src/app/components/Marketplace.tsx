'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useChainId } from 'wagmi';
import { getContractService, TimeToken } from '../services/contractService';
import { formatEther } from 'viem';
import { isSupportedChain, getChainDisplayName, getContractAddress } from '../lib/wagmi';
import { getPriceService, FormattedPrice } from '../services/priceService';
import NotificationCenter from './NotificationCenter';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import ChainlinkUpkeepWidget from './ChainlinkUpkeepWidget';
import { FEATURE_FLAGS } from '../shared/constants';

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
  const [tokenPrices, setTokenPrices] = useState<Map<string, FormattedPrice>>(new Map());
  const [purchaseCost, setPurchaseCost] = useState<FormattedPrice | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const [modalNotification, setModalNotification] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const modalClosingRef = useRef(false);
  const [useEscrowProtection, setUseEscrowProtection] = useState(true); // Default to enabled for demo
  const [escrowTimeoutDays, setEscrowTimeoutDays] = useState(FEATURE_FLAGS.ESCROW_TIMEOUT_DAYS);

  const contractService = getContractService();
  const priceService = getPriceService();

  useEffect(() => {
    loadMarketplaceData();
  }, [isConnected, address, chainId]);

  // Update purchase cost when hours or selected token changes
  useEffect(() => {
    const updatePurchaseCost = async () => {
      if (selectedToken && purchaseHours > 0) {
        try {
          const cost = await calculatePurchaseCost(selectedToken.pricePerHour, purchaseHours);
          setPurchaseCost(cost);
        } catch (error) {
          console.error('Failed to update purchase cost:', error);
          setPurchaseCost(null);
        }
      } else {
        setPurchaseCost(null);
      }
    };

    updatePurchaseCost();
  }, [selectedToken, purchaseHours, chainId]);

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

      // Load price data for all tokens
      await loadTokenPrices(validTokens);

    } catch (error) {
      console.error('❌ Failed to load marketplace data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTokenPrices = async (tokensToLoad: TimeToken[]) => {
    try {
      console.log('💰 Loading price data for tokens...');
      const priceMap = new Map<string, FormattedPrice>();

      // Load prices for all tokens in parallel
      const pricePromises = tokensToLoad.map(async (token) => {
        try {
          const formattedPrice = await contractService.formatPrice(token.pricePerHour, chainId);
          priceMap.set(token.tokenId, formattedPrice);
        } catch (error) {
          console.error(`Failed to load price for token ${token.tokenId}:`, error);
          // Fallback to simple formatting
          const currency = priceService.getCurrentCurrencyInfo(chainId).symbol;
          const cryptoAmount = Number(formatEther(token.pricePerHour));
          priceMap.set(token.tokenId, {
            crypto: `${cryptoAmount.toFixed(4)} ${currency}`,
            usd: 'Price unavailable',
            cryptoAmount,
            usdAmount: 0
          });
        }
      });

      await Promise.all(pricePromises);
      setTokenPrices(priceMap);
      console.log('✅ Price data loaded for', priceMap.size, 'tokens');
    } catch (error) {
      console.error('❌ Failed to load token prices:', error);
    }
  };

  const handlePurchaseToken = async (token: TimeToken) => {
    if (!isConnected || !address) {
      console.error('❌ Wallet not connected');
      return;
    }

    if (!isSupportedChain(chainId)) {
      console.error('❌ Unsupported chain:', chainId);
      return;
    }

    let shouldCloseModal = false;

    try {
      setIsPurchasing(true);
      console.log('🛒 Starting purchase process...');
      console.log('Token details:', {
        tokenId: token.tokenId,
        pricePerHour: token.pricePerHour.toString(),
        availableHours: token.availableHours.toString(),
        purchaseHours,
        buyer: address
      });

      // Validate purchase
      if (purchaseHours <= 0 || purchaseHours > Number(token.availableHours)) {
        throw new Error(`Invalid hours amount: ${purchaseHours}. Available: ${token.availableHours}`);
      }

      if (isExpired(token.validUntil)) {
        throw new Error('Token has expired');
      }

      const totalCost = contractService.calculatePurchaseCost(token.pricePerHour, purchaseHours);
      console.log('💰 Total cost calculated:', {
        pricePerHour: formatEther(token.pricePerHour),
        hours: purchaseHours,
        totalCost: formatEther(totalCost),
        totalCostWei: totalCost.toString()
      });

      // Check user balance (simplified check)
      try {
        const balance = await contractService.estimateGasCost('purchase');
        console.log('💳 Estimated gas cost:', formatEther(balance));
      } catch (balanceError) {
        console.warn('Could not estimate gas:', balanceError);
      }

      console.log('📝 Calling contract purchase function...');
      const txHash = await contractService.purchaseTimeToken({
        tokenId: token.tokenId,
        hoursAmount: purchaseHours,
        totalPrice: totalCost
      });

      console.log('✅ Purchase transaction successful:', txHash);

      // Show success notification
      setNotification({ type: 'success', message: `Successfully purchased ${purchaseHours}h of service!` });

      // Auto-hide notification after 5 seconds
      setTimeout(() => setNotification(null), 5000);

      // Reload marketplace data to reflect changes
      console.log('🔄 Reloading marketplace data...');
      await loadMarketplaceData();
      setSelectedToken(null);
      setPurchaseHours(1);
      setPurchaseCost(null); // Reset

    } catch (error) {
      // Don't log to console for user cancellations - handle gracefully
      if (!(error instanceof Error && (error.message.includes('user rejected') || error.message.includes('User denied transaction') || error.message.includes('cancelled by user')))) {
        console.error('❌ Purchase failed:', error);
      }

      // Show user-friendly error message and add notification
      let errorMessage = 'Purchase failed. Please try again.';

      if (error instanceof Error) {
        if (error.message.includes('user rejected') || error.message.includes('User denied transaction')) {
          errorMessage = 'Transaction was cancelled by user.';
          shouldCloseModal = true; // Close modal on user cancellation
        } else if (error.message.includes('insufficient funds') || error.message.includes('balance')) {
          errorMessage = 'Insufficient balance for this transaction.';
          shouldCloseModal = true; // Close modal on insufficient funds
        } else if (error.message.includes('Invalid hours')) {
          errorMessage = error.message;
        } else if (error.message.includes('expired')) {
          errorMessage = 'This token has expired.';
        }
      }

      // Show notification in modal if it's staying open, otherwise show general notification
      if (shouldCloseModal) {
        setNotification({ type: 'error', message: errorMessage });
        setTimeout(() => setNotification(null), 5000);
      } else {
        setModalNotification({ type: 'error', message: errorMessage });
        setTimeout(() => setModalNotification(null), 5000);
      }

      // Close modal and reset state for certain error types
      if (shouldCloseModal) {
        console.log('🚪 Closing modal due to error:', errorMessage);
        setIsModalClosing(true);
        modalClosingRef.current = true;
        setSelectedToken(null);
        setPurchaseHours(1);
        setPurchaseCost(null);
        // Delay data reload and reset modal closing flag
        setTimeout(() => {
          console.log('🔄 Reloading data and resetting modal flags');
          loadMarketplaceData();
          setIsModalClosing(false);
          modalClosingRef.current = false;
        }, 300);
      }

    } finally {
      setIsPurchasing(false);
      // Only reload marketplace data if modal is staying open
      if (!shouldCloseModal) {
        loadMarketplaceData();
      }
    }
  };

  const filteredTokens = tokens.filter(token => {
    switch (filter) {
      case 'available':
        // Only show tokens that can be purchased (not owned by current user)
        return Number(token.availableHours) > 0 &&
          !contractService.isTokenExpired(token.validUntil) &&
          token.creator.toLowerCase() !== address?.toLowerCase();
      case 'my_tokens':
        return token.creator.toLowerCase() === address?.toLowerCase();
      default:
        // By default, show all tokens but highlight purchasable ones
        return true;
    }
  });


  const formatValidUntil = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString();
  };

  const isExpired = (timestamp: bigint) => {
    return contractService.isTokenExpired(timestamp);
  };

  const calculatePurchaseCost = async (pricePerHour: bigint, hours: number) => {
    try {
      const cost = contractService.calculatePurchaseCost(pricePerHour, hours);
      const formattedCost = await contractService.formatPrice(cost, chainId);
      return formattedCost;
    } catch (error) {
      console.error('Failed to calculate purchase cost:', error);
      const cost = contractService.calculatePurchaseCost(pricePerHour, hours);
      const currency = priceService.getCurrentCurrencyInfo(chainId).symbol;
      const cryptoAmount = Number(formatEther(cost));
      return {
        crypto: `${cryptoAmount.toFixed(4)} ${currency}`,
        usd: 'Cost calculation failed',
        cryptoAmount,
        usdAmount: 0
      };
    }
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
      {/* Toast Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 rounded-xl font-medium shadow-lg backdrop-blur-lg border ${notification.type === 'success'
              ? 'bg-green-500/20 text-green-100 border-green-500/50'
              : notification.type === 'error'
                ? 'bg-red-500/20 text-red-100 border-red-500/50'
                : 'bg-blue-500/20 text-blue-100 border-blue-500/50'
              }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">
                {notification.type === 'success' ? '✅' : notification.type === 'error' ? '❌' : 'ℹ️'}
              </span>
              {notification.message}
              <button
                onClick={() => setNotification(null)}
                className="ml-2 text-white/70 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
        {/* Action Buttons */}
        <div className="flex gap-4 mb-8 items-start">
          <div>
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
                className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-medium transition-all border border-white/30 ml-4"
              >
                📊 My Dashboard
              </button>
            )}
          </div>
          <div className="ml-auto">
            <ChainlinkUpkeepWidget />
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 mb-8 border border-white/20">
          <div className="flex gap-4">
            {[
              { key: 'all', label: '🌐 All Tokens', count: tokens.length },
              { key: 'available', label: '🛒 Available to Buy', count: tokens.filter(t => Number(t.availableHours) > 0 && !isExpired(t.validUntil) && t.creator.toLowerCase() !== address?.toLowerCase()).length },
              { key: 'my_tokens', label: '👤 My Tokens', count: tokens.filter(t => t.creator.toLowerCase() === address?.toLowerCase()).length }
            ].map(filterOption => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key as any)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${filter === filterOption.key
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
            {filteredTokens.map((token, index) => {
              const isOwnToken = token.creator.toLowerCase() === address?.toLowerCase();
              const canPurchase = !isOwnToken && !isExpired(token.validUntil) && Number(token.availableHours) > 0;
              const priceData = tokenPrices.get(token.tokenId);

              return (
                <motion.div
                  key={token.tokenId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-white/10 backdrop-blur-lg rounded-3xl p-6 border transition-all relative ${isExpired(token.validUntil) ? 'border-red-500/30' :
                    canPurchase ? 'border-green-500/50 hover:border-green-400 hover:bg-white/15 cursor-pointer' :
                      'border-white/20'
                    }`}
                  onClick={() => {
                    console.log('🔍 Card clicked:', { canPurchase, isModalClosing, modalClosingRefCurrent: modalClosingRef.current, tokenName: token.serviceName });
                    if (canPurchase && !isModalClosing && !modalClosingRef.current) {
                      console.log('✅ Opening modal for token:', token.serviceName);
                      setSelectedToken(token);
                    } else {
                      console.log('❌ Modal opening blocked');
                    }
                  }}
                >
                  {/* Purchase Badge for purchasable tokens */}
                  {canPurchase && (
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                      💰 AVAILABLE
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-white font-bold text-lg mb-1">{token.serviceName}</h3>
                      <p className="text-white/60 text-sm">
                        by {isOwnToken ? 'You' : `${token.creator.slice(0, 6)}...${token.creator.slice(-4)}`}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${isExpired(token.validUntil)
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
                      <div className="text-white font-bold text-lg">
                        {priceData ? priceData.crypto : 'Loading...'}
                      </div>
                      {priceData && priceData.usd !== 'Price unavailable' && (
                        <div className="text-white/50 text-xs">{priceData.usd}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-white/60 text-xs">Available Hours</div>
                      <div className="text-white font-bold text-lg">{token.availableHours.toString()}h</div>
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

                  {/* Action Area */}
                  <div className="flex justify-between items-center">
                    <div className="text-white/60 text-sm">
                      Token #{token.tokenId}
                    </div>

                    {/* Purchase Button for purchasable tokens */}
                    {canPurchase && (
                      <button
                        className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all transform hover:scale-105 shadow-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('🔍 BUY NOW clicked:', { isModalClosing, modalClosingRefCurrent: modalClosingRef.current, tokenName: token.serviceName });
                          if (!isModalClosing && !modalClosingRef.current) {
                            console.log('✅ Opening modal via BUY NOW for token:', token.serviceName);
                            setSelectedToken(token);
                          } else {
                            console.log('❌ BUY NOW modal opening blocked');
                          }
                        }}
                      >
                        🛒 BUY NOW
                      </button>
                    )}

                    {/* Your Token indicator */}
                    {isOwnToken && (
                      <div className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-lg text-sm font-medium">
                        👤 Your Token
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
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
              onClick={() => {
                setSelectedToken(null);
                setPurchaseHours(1);
                setPurchaseCost(null);
                setModalNotification(null);
                setIsModalClosing(false);
                modalClosingRef.current = false;
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-white/20"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Notification */}
                <AnimatePresence>
                  {modalNotification && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`mb-4 px-4 py-3 rounded-xl font-medium shadow-lg border ${modalNotification.type === 'success'
                        ? 'bg-green-500/20 text-green-100 border-green-500/50'
                        : modalNotification.type === 'error'
                          ? 'bg-red-500/20 text-red-100 border-red-500/50'
                          : 'bg-blue-500/20 text-blue-100 border-blue-500/50'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {modalNotification.type === 'success' ? '✅' : modalNotification.type === 'error' ? '❌' : 'ℹ️'}
                        </span>
                        {modalNotification.message}
                        <button
                          onClick={() => setModalNotification(null)}
                          className="ml-auto text-white/70 hover:text-white transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <h2 className="text-xl font-bold text-white mb-3">{selectedToken.serviceName}</h2>

                <div className="space-y-3 mb-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-white/60">Creator:</span>
                      <div className="text-white font-medium">
                        {selectedToken.creator.slice(0, 6)}...{selectedToken.creator.slice(-4)}
                      </div>
                    </div>
                    <div>
                      <span className="text-white/60">Price per Hour:</span>
                      <div className="text-white font-medium">
                        {tokenPrices.get(selectedToken.tokenId)?.crypto || 'Loading...'}
                      </div>
                      {tokenPrices.get(selectedToken.tokenId)?.usd !== 'Price unavailable' && (
                        <div className="text-white/50 text-xs">
                          {tokenPrices.get(selectedToken.tokenId)?.usd}
                        </div>
                      )}
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
                          <div className="font-semibold">Total Cost:</div>
                          {purchaseCost ? (
                            <div>
                              <div className="text-white font-bold text-lg">{purchaseCost.crypto}</div>
                              {purchaseCost.usd !== 'Cost calculation failed' && (
                                <div className="text-white/60 text-sm">{purchaseCost.usd}</div>
                              )}
                            </div>
                          ) : (
                            <div>Calculating...</div>
                          )}
                        </div>
                      </div>
                    )}

                  {/* Escrow Protection Options */}
                  {FEATURE_FLAGS.ESCROW_ENABLED && selectedToken.creator.toLowerCase() !== address?.toLowerCase() &&
                    !isExpired(selectedToken.validUntil) && Number(selectedToken.availableHours) > 0 && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🔒</span>
                          <h4 className="text-white font-semibold">Escrow Protection</h4>
                          <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full text-xs font-bold">
                            RECOMMENDED
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setUseEscrowProtection(!useEscrowProtection)}
                          className={`relative inline-flex items-center w-12 h-6 rounded-full transition-colors ${
                            useEscrowProtection ? 'bg-blue-500' : 'bg-white/20'
                          }`}
                        >
                          <span
                            className={`inline-block w-4 h-4 bg-white rounded-full transition-transform ${
                              useEscrowProtection ? 'translate-x-7' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      
                      {useEscrowProtection ? (
                        <div className="space-y-2">
                          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-green-400">✓</span>
                              <span className="text-white font-medium text-sm">Payment Protection Enabled</span>
                            </div>
                            <div className="space-y-1 text-xs text-white/70">
                              <div>• Payment held safely in smart contract</div>
                              <div>• Released after service completion</div>
                              <div>• Auto-release after {escrowTimeoutDays} days</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-white/60">Protection Period:</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={escrowTimeoutDays}
                                onChange={(e) => setEscrowTimeoutDays(parseInt(e.target.value) || 7)}
                                min="3"
                                max="30"
                                className="w-16 bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-blue-400"
                              />
                              <span className="text-white/60">days</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-white/60">Escrow Fee:</span>
                            <span className="text-white font-medium">{FEATURE_FLAGS.ESCROW_FEE_PERCENTAGE}% of total</span>
                          </div>
                          
                          {purchaseCost && (
                            <div className="bg-white/5 rounded-lg p-2">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-white/60">Service:</span>
                                <span className="text-white">{purchaseCost.crypto}</span>
                              </div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-white/60">Escrow Fee:</span>
                                <span className="text-white/80">
                                  +{(purchaseCost.cryptoAmount * FEATURE_FLAGS.ESCROW_FEE_PERCENTAGE / 100).toFixed(4)} 
                                  {purchaseCost.crypto.split(' ')[1]}
                                </span>
                              </div>
                              <div className="border-t border-white/10 pt-1 mt-1">
                                <div className="flex justify-between font-semibold text-sm">
                                  <span className="text-white">Total:</span>
                                  <span className="text-green-400">
                                    {(purchaseCost.cryptoAmount * (1 + FEATURE_FLAGS.ESCROW_FEE_PERCENTAGE / 100)).toFixed(4)} 
                                    {purchaseCost.crypto.split(' ')[1]}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-red-400">⚠️</span>
                            <span className="text-white font-medium text-sm">No Payment Protection</span>
                          </div>
                          <div className="space-y-1 text-xs text-white/70">
                            <div>• Direct payment to seller (higher risk)</div>
                            <div>• No dispute resolution available</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setSelectedToken(null);
                      setPurchaseHours(1);
                      setPurchaseCost(null);
                      setModalNotification(null);
                      setIsModalClosing(false);
                      modalClosingRef.current = false;
                    }}
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
                        className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 disabled:from-gray-500 disabled:to-gray-600 text-white py-4 px-8 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
                      >
                        {isPurchasing ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Processing...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            {useEscrowProtection && FEATURE_FLAGS.ESCROW_ENABLED ? '🔒' : '🛒'} 
                            {useEscrowProtection && FEATURE_FLAGS.ESCROW_ENABLED ? 'Secure Purchase' : 'Purchase'} {purchaseHours}h
                            {useEscrowProtection && FEATURE_FLAGS.ESCROW_ENABLED && purchaseCost
                              ? ` for ${(purchaseCost.cryptoAmount * (1 + FEATURE_FLAGS.ESCROW_FEE_PERCENTAGE / 100)).toFixed(4)} ${purchaseCost.crypto.split(' ')[1]}`
                              : ` for ${purchaseCost?.crypto || 'Calculating...'}`
                            }
                          </div>
                        )}
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