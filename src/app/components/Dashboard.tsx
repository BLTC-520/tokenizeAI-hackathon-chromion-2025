'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useChainId } from 'wagmi';
import { getContractService, TimeToken } from '../services/contractService';
import { formatEther } from 'viem';
import { isSupportedChain, getChainDisplayName } from '../lib/wagmi';
import NotificationCenter from './NotificationCenter';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { getAlertAgent, AlertNotification } from '../services/alertAgent';

interface DashboardProps {
  onCreateToken?: () => void;
  onViewMarketplace?: () => void;
}

interface DashboardStats {
  totalTokensCreated: number;
  totalTokensPurchased: number;
  totalEarnings: number;
  totalSpent: number;
  activeTokens: number;
  completedServices: number;
}

export default function Dashboard({ onCreateToken, onViewMarketplace }: DashboardProps) {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'created' | 'purchased' | 'earnings' | 'activity'>('overview');
  const [createdTokens, setCreatedTokens] = useState<TimeToken[]>([]);
  const [purchasedTokens, setPurchasedTokens] = useState<TimeToken[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalTokensCreated: 0,
    totalTokensPurchased: 0,
    totalEarnings: 0,
    totalSpent: 0,
    activeTokens: 0,
    completedServices: 0
  });
  const [recentActivity, setRecentActivity] = useState<AlertNotification[]>([]);
  const [avaxPriceUSD, setAvaxPriceUSD] = useState<number>(0);

  const contractService = getContractService();
  const alertAgent = getAlertAgent();

  // Function to fetch current AVAX price in USD
  const fetchAvaxPrice = async (): Promise<number> => {
    try {
      console.log('💰 Fetching AVAX price...');
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=avalanche-2&vs_currencies=usd');

      if (!response.ok) {
        throw new Error('Failed to fetch AVAX price');
      }

      const data = await response.json();
      const price = data['avalanche-2']?.usd || 0;
      console.log('💰 Current AVAX price:', price, 'USD');
      return price;
    } catch (error) {
      console.error('❌ Failed to fetch AVAX price:', error);
      // Return a fallback price or 0 if API fails
      return 40; // Fallback price - you can adjust this or use a cached price
    }
  };

  useEffect(() => {
    if (isConnected && address && isSupportedChain(chainId)) {
      loadDashboardData();
    } else {
      setLoading(false);
    }
  }, [isConnected, address, chainId]);

  const loadDashboardData = async () => {
    if (!address) return;

    try {
      setLoading(true);
      console.log('📊 Loading dashboard data for:', address);

      // Fetch AVAX price first
      const currentAvaxPrice = await fetchAvaxPrice();
      setAvaxPriceUSD(currentAvaxPrice);

      // Load created tokens
      const createdTokenIds = await contractService.getCreatorTokens(address);
      const createdTokensPromises = createdTokenIds.map(id =>
        contractService.getTimeToken(id.toString())
      );
      const createdTokensData = await Promise.all(createdTokensPromises);
      const validCreatedTokens = createdTokensData.filter((token): token is TimeToken => token !== null);

      // Load purchased tokens
      const purchasedTokenIds = await contractService.getBuyerTokens(address);
      const purchasedTokensPromises = purchasedTokenIds.map(id =>
        contractService.getTimeToken(id.toString())
      );
      const purchasedTokensData = await Promise.all(purchasedTokensPromises);
      const validPurchasedTokens = purchasedTokensData.filter((token): token is TimeToken => token !== null);

      setCreatedTokens(validCreatedTokens);
      setPurchasedTokens(validPurchasedTokens);

      // Calculate stats with USD conversion
      const dashboardStats: DashboardStats = {
        totalTokensCreated: validCreatedTokens.length,
        totalTokensPurchased: validPurchasedTokens.length,

        // Convert totalEarnings from AVAX to USD
        totalEarnings: validCreatedTokens.reduce((total, token) => {
          const soldHours = Number(token.totalHours) - Number(token.availableHours);
          const avaxAmount = soldHours * parseFloat(formatEther(token.pricePerHour));
          const usdAmount = avaxAmount * currentAvaxPrice;
          return total + usdAmount;
        }, 0),

        // Convert totalSpent from AVAX to USD
        totalSpent: validPurchasedTokens.reduce((total, token) => {
          // Simplified calculation - in production, track actual purchase amounts
          const avaxAmount = 10 * parseFloat(formatEther(token.pricePerHour)); // Assume average 10 hours purchased
          const usdAmount = avaxAmount * currentAvaxPrice;
          return total + usdAmount;
        }, 0),

        activeTokens: validCreatedTokens.filter(token =>
          token.isActive && Number(token.availableHours) > 0 && !contractService.isTokenExpired(token.validUntil)
        ).length,
        completedServices: validCreatedTokens.reduce((total, token) => {
          return total + (Number(token.totalHours) - Number(token.availableHours));
        }, 0)
      };

      setStats(dashboardStats);

      // Load recent activity from notifications
      const notifications = alertAgent.getNotifications().slice(0, 10);
      setRecentActivity(notifications);

      console.log('✅ Dashboard data loaded:', dashboardStats);
      console.log('💰 AVAX Price used for conversion:', currentAvaxPrice, 'USD');

    } catch (error) {
      console.error('❌ Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateToken = async (tokenId: string) => {
    if (!confirm('Are you sure you want to deactivate this token? This action cannot be undone.')) {
      return;
    }

    try {
      await contractService.deactivateToken(tokenId);
      await loadDashboardData(); // Reload data
    } catch (error) {
      console.error('❌ Failed to deactivate token:', error);
    }
  };

  const formatPrice = (priceWei: bigint) => {
    return parseFloat(formatEther(priceWei)).toFixed(2);
  };

  // New function to format price in USD
  const formatPriceUSD = (priceWei: bigint) => {
    const avaxAmount = parseFloat(formatEther(priceWei));
    const usdAmount = avaxAmount * avaxPriceUSD;
    return usdAmount.toFixed(2);
  };

  const formatValidUntil = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString();
  };

  const isExpired = (timestamp: bigint) => {
    return contractService.isTokenExpired(timestamp);
  };

  const getTokenStatus = (token: TimeToken) => {
    if (!token.isActive) return { status: 'Deactivated', color: 'text-gray-400 bg-gray-500/20' };
    if (isExpired(token.validUntil)) return { status: 'Expired', color: 'text-red-400 bg-red-500/20' };
    if (Number(token.availableHours) === 0) return { status: 'Sold Out', color: 'text-yellow-400 bg-yellow-500/20' };
    return { status: 'Active', color: 'text-green-400 bg-green-500/20' };
  };

  const formatActivityTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const tabs = [
    { id: 'overview', label: '📊 Overview', icon: '📊' },
    { id: 'created', label: '🎨 Created Tokens', icon: '🎨' },
    { id: 'purchased', label: '🛒 Purchased', icon: '🛒' },
    { id: 'earnings', label: '💰 Earnings', icon: '💰' },
    { id: 'activity', label: '📈 Activity', icon: '📈' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-blue-500 to-purple-600 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-white text-xl font-bold mb-2">Loading Dashboard</h2>
          <p className="text-white/70">Fetching your time token portfolio...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-blue-500 to-purple-600 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 text-center max-w-md">
          <div className="text-6xl mb-6">🔗</div>
          <h2 className="text-white text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-white/70 mb-6">Connect your wallet to view your Time Tokenizer dashboard</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  if (!isSupportedChain(chainId)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-blue-500 to-purple-600 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 text-center max-w-md">
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className="text-white text-2xl font-bold mb-4">Unsupported Network</h2>
          <p className="text-white/70 mb-6">
            Please switch to {getChainDisplayName(chainId)} to view your dashboard
          </p>
          <ConnectButton />
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
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              📊 Your Dashboard
            </h1>
            <p className="text-white/80 text-xl">
              Manage your time tokens and track your earnings
            </p>
            {avaxPriceUSD > 0 && (
              <p className="text-white/60 text-sm mt-1">
                💰 AVAX Price: ${avaxPriceUSD.toFixed(2)} USD
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <NotificationCenter />
            <ConnectButton />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.totalTokensCreated}</div>
            <div className="text-white/70 text-sm">Tokens Created</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{stats.activeTokens}</div>
            <div className="text-white/70 text-sm">Active Tokens</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">{stats.totalTokensPurchased}</div>
            <div className="text-white/70 text-sm">Purchased</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">${stats.totalEarnings.toFixed(2)}</div>
            <div className="text-white/70 text-sm">Earnings (USD)</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-red-400">${stats.totalSpent.toFixed(2)}</div>
            <div className="text-white/70 text-sm">Spent (USD)</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-orange-400">{stats.completedServices}</div>
            <div className="text-white/70 text-sm">Hours Completed</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-4 mb-8">
          {onCreateToken && (
            <button
              onClick={onCreateToken}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-all"
            >
              🚀 Create New Token
            </button>
          )}
          {onViewMarketplace && (
            <button
              onClick={onViewMarketplace}
              className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-medium transition-all border border-white/30"
            >
              🏪 View Marketplace
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-2 border border-white/20">
            <div className="flex space-x-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${activeTab === tab.id
                    ? 'bg-white text-purple-600'
                    : 'text-white hover:bg-white/10'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Portfolio Summary */}
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-6">📈 Portfolio Summary</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Total Portfolio Value:</span>
                    <span className="text-white font-bold">${(stats.totalEarnings + stats.totalSpent).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Net Earnings:</span>
                    <span className="text-green-400 font-bold">${(stats.totalEarnings - stats.totalSpent).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Active Revenue Streams:</span>
                    <span className="text-white font-bold">{stats.activeTokens}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Hours Monetized:</span>
                    <span className="text-white font-bold">{stats.completedServices}h</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity Preview */}
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-6">⚡ Recent Activity</h2>
                <div className="space-y-3">
                  {recentActivity.slice(0, 5).map((activity, index) => (
                    <div key={activity.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                      <div className="text-lg">
                        {activity.type === 'token_created' ? '🎉' :
                          activity.type === 'token_purchased' ? '💰' :
                            activity.type === 'service_completed' ? '✅' :
                              activity.type === 'payment_received' ? '💳' : '📬'}
                      </div>
                      <div className="flex-1">
                        <div className="text-white text-sm font-medium">{activity.title}</div>
                        <div className="text-white/60 text-xs">{formatActivityTime(activity.timestamp)}</div>
                      </div>
                    </div>
                  ))}
                  {recentActivity.length === 0 && (
                    <div className="text-center py-4">
                      <div className="text-white/60 text-sm">No recent activity</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'created' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">🎨 Your Created Tokens</h2>
                <div className="text-white/70">{createdTokens.length} tokens</div>
              </div>

              {createdTokens.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🎨</div>
                  <h3 className="text-2xl font-bold text-white mb-2">No Tokens Created Yet</h3>
                  <p className="text-white/70 mb-6">Start monetizing your time by creating your first token</p>
                  {onCreateToken && (
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
                  {createdTokens.map((token, index) => {
                    const status = getTokenStatus(token);
                    const soldHours = Number(token.totalHours) - Number(token.availableHours);
                    const completionRate = (soldHours / Number(token.totalHours)) * 100;

                    return (
                      <motion.div
                        key={token.tokenId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-white font-bold text-lg mb-1">{token.serviceName}</h3>
                            <p className="text-white/60 text-sm">Token #{token.tokenId}</p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            {status.status}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <div className="text-white/60 text-xs">Price/Hour</div>
                            <div className="text-white font-bold">${formatPrice(token.pricePerHour)}</div>
                          </div>
                          <div>
                            <div className="text-white/60 text-xs">Available</div>
                            <div className="text-white font-bold">{token.availableHours.toString()}h</div>
                          </div>
                          <div>
                            <div className="text-white/60 text-xs">Sold Hours</div>
                            <div className="text-green-400 font-bold">{soldHours}h</div>
                          </div>
                          <div>
                            <div className="text-white/60 text-xs">Valid Until</div>
                            <div className="text-white font-bold">{formatValidUntil(token.validUntil)}</div>
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="flex justify-between text-white/60 text-xs mb-1">
                            <span>Completion</span>
                            <span>{completionRate.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-white/20 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${completionRate}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {token.isActive && !isExpired(token.validUntil) && (
                            <button
                              onClick={() => handleDeactivateToken(token.tokenId)}
                              className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 py-2 px-4 rounded-xl text-sm font-medium transition-all"
                            >
                              Deactivate
                            </button>
                          )}
                          <button className="flex-1 bg-white/20 hover:bg-white/30 text-white py-2 px-4 rounded-xl text-sm font-medium transition-all">
                            View Details
                          </button>
                        </div>

                        <div className="mt-3 text-center">
                          <div className="text-green-400 font-bold">
                            ${(soldHours * parseFloat(formatPrice(token.pricePerHour))).toFixed(2)} earned
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'purchased' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">🛒 Purchased Tokens</h2>
                <div className="text-white/70">{purchasedTokens.length} tokens</div>
              </div>

              {purchasedTokens.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🛒</div>
                  <h3 className="text-2xl font-bold text-white mb-2">No Tokens Purchased Yet</h3>
                  <p className="text-white/70 mb-6">Browse the marketplace to find professional services</p>
                  {onViewMarketplace && (
                    <button
                      onClick={onViewMarketplace}
                      className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-8 py-4 rounded-xl font-medium transition-all"
                    >
                      🏪 Browse Marketplace
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {purchasedTokens.map((token, index) => (
                    <motion.div
                      key={token.tokenId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-white font-bold text-lg mb-1">{token.serviceName}</h3>
                          <p className="text-white/60 text-sm">
                            by {token.creator.slice(0, 6)}...{token.creator.slice(-4)}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${isExpired(token.validUntil) ? 'text-red-400 bg-red-500/20' : 'text-green-400 bg-green-500/20'
                          }`}>
                          {isExpired(token.validUntil) ? 'Expired' : 'Active'}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-white/60 text-xs">Price/Hour</div>
                          <div className="text-white font-bold">${formatPrice(token.pricePerHour)}</div>
                        </div>
                        <div>
                          <div className="text-white/60 text-xs">Valid Until</div>
                          <div className="text-white font-bold">{formatValidUntil(token.validUntil)}</div>
                        </div>
                      </div>

                      <button className="w-full bg-white/20 hover:bg-white/30 text-white py-3 px-4 rounded-xl font-medium transition-all">
                        View Service Details
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'earnings' && (
            <div className="space-y-8">
              <h2 className="text-3xl font-bold text-white text-center">💰 Earnings Overview</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-green-500/20 to-green-700/20 backdrop-blur-lg rounded-3xl p-8 border border-green-500/30">
                  <h3 className="text-green-400 font-bold text-2xl mb-4">Total Earnings</h3>
                  <p className="text-white text-4xl font-bold mb-2">${stats.totalEarnings.toFixed(2)}</p>
                  <p className="text-green-300">From {stats.completedServices} hours completed</p>
                </div>

                <div className="bg-gradient-to-br from-blue-500/20 to-blue-700/20 backdrop-blur-lg rounded-3xl p-8 border border-blue-500/30">
                  <h3 className="text-blue-400 font-bold text-2xl mb-4">Average Rate</h3>
                  <p className="text-white text-4xl font-bold mb-2">
                    ${stats.completedServices > 0 ? (stats.totalEarnings / stats.completedServices).toFixed(2) : '0.00'}
                  </p>
                  <p className="text-blue-300">Per hour completed</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500/20 to-purple-700/20 backdrop-blur-lg rounded-3xl p-8 border border-purple-500/30">
                  <h3 className="text-purple-400 font-bold text-2xl mb-4">Active Revenue</h3>
                  <p className="text-white text-4xl font-bold mb-2">{stats.activeTokens}</p>
                  <p className="text-purple-300">Revenue streams</p>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
                <h3 className="text-2xl font-bold text-white mb-6">💡 Earnings Optimization</h3>
                <div className="space-y-4">
                  <div className="flex items-center p-4 bg-white/5 rounded-2xl border border-white/10">
                    <span className="text-2xl mr-4">📈</span>
                    <div>
                      <h4 className="text-white font-semibold">Increase Your Rates</h4>
                      <p className="text-white/70 text-sm">Your completion rate is high - consider raising prices for new tokens</p>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-white/5 rounded-2xl border border-white/10">
                    <span className="text-2xl mr-4">🎯</span>
                    <div>
                      <h4 className="text-white font-semibold">Create More Tokens</h4>
                      <p className="text-white/70 text-sm">Diversify your income streams with additional service offerings</p>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-white/5 rounded-2xl border border-white/10">
                    <span className="text-2xl mr-4">⏰</span>
                    <div>
                      <h4 className="text-white font-semibold">Optimize Token Duration</h4>
                      <p className="text-white/70 text-sm">Shorter validity periods can create urgency and increase sales</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">📈 Activity Feed</h2>

              {recentActivity.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">📈</div>
                  <h3 className="text-2xl font-bold text-white mb-2">No Activity Yet</h3>
                  <p className="text-white/70">Your recent transactions and activities will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
                    >
                      <div className="flex items-start gap-4">
                        <div className="text-3xl">
                          {activity.type === 'token_created' ? '🎉' :
                            activity.type === 'token_purchased' ? '💰' :
                              activity.type === 'service_completed' ? '✅' :
                                activity.type === 'payment_received' ? '💳' :
                                  activity.type === 'token_expired' ? '⏰' :
                                    activity.type === 'market_update' ? '📊' : '📬'}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-white font-bold">{activity.title}</h3>
                            <span className="text-white/60 text-sm">{formatActivityTime(activity.timestamp)}</span>
                          </div>
                          <p className="text-white/80 mb-3">{activity.message}</p>
                          <div className="flex justify-between items-center">
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${activity.priority === 'urgent' ? 'text-red-400 bg-red-500/20' :
                              activity.priority === 'high' ? 'text-orange-400 bg-orange-500/20' :
                                activity.priority === 'medium' ? 'text-yellow-400 bg-yellow-500/20' :
                                  'text-green-400 bg-green-500/20'
                              }`}>
                              {activity.priority} priority
                            </div>
                            {activity.actionLabel && activity.actionUrl && (
                              <button className="text-blue-400 hover:text-blue-300 text-sm">
                                {activity.actionLabel} →
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}