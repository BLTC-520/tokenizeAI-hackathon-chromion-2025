'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TokenizeAgent, TokenizationPlan, TokenSuggestion } from '../services/tokenizeAgent';
import { PortfolioData } from '../services/elizaAgent';
import { UserAnswers } from '../utils/localStorage';
import { useTimeTokenizerStorage } from '../hooks/useLocalStorage';

interface TokenizationPlanProps {
  portfolioData: PortfolioData;
  userAnswers: UserAnswers;
  onTokenizeSelected: (suggestion: TokenSuggestion) => void;
  onViewMarketplace: () => void;
}

export default function TokenizationPlan({ 
  portfolioData, 
  userAnswers, 
  onTokenizeSelected,
  onViewMarketplace 
}: TokenizationPlanProps) {
  const [plan, setPlan] = useState<TokenizationPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'analysis' | 'suggestions' | 'customize'>('analysis');
  const storage = useTimeTokenizerStorage();

  useEffect(() => {
    analyzePortfolio();
  }, [portfolioData, userAnswers]);

  const analyzePortfolio = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Starting tokenization analysis...');

      // Get Gemini API key from environment variables or session
      const sessionData = storage.session.sessionData;
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || sessionData?.geminiApiKey || '';
      
      console.log('🔑 API Key check:', {
        envKey: !!process.env.NEXT_PUBLIC_GEMINI_API_KEY,
        sessionKey: !!sessionData?.geminiApiKey,
        finalKey: !!apiKey,
        keyLength: apiKey?.length
      });

      if (!apiKey) {
        console.warn('⚠️ No Gemini API key found, using fallback plan');
        throw new Error('Gemini API key not found');
      }

      // Always create agent (it will handle missing API key gracefully)
      const agent = new TokenizeAgent(apiKey);
      const tokenizationPlan = await agent.analyzePortfolioForTokenization(portfolioData, userAnswers);
      
      setPlan(tokenizationPlan);
      setCurrentStep('suggestions');
    } catch (error) {
      console.error('❌ Tokenization analysis failed:', error);
      // Use fallback plan with empty API key
      try {
        const agent = new TokenizeAgent('');
        const fallbackPlan = await agent.analyzePortfolioForTokenization(portfolioData, userAnswers);
        setPlan(fallbackPlan);
        setCurrentStep('suggestions');
      } catch (fallbackError) {
        console.error('❌ Fallback plan also failed:', fallbackError);
        // Create minimal plan to prevent crash
        setPlan({
          totalServices: 1,
          estimatedTotalRevenue: 1500,
          recommendedStartOrder: [{
            id: 'emergency-1',
            serviceName: 'Professional Service',
            description: 'General professional service offering',
            suggestedPricePerHour: 75,
            suggestedTotalHours: 20,
            suggestedValidityDays: 60,
            reasoning: 'Emergency fallback service',
            marketDemand: 'medium',
            competitiveness: 7,
            estimatedRevenue: 1500,
            priority: 'high',
            category: 'Professional',
            tags: ['Service']
          }],
          marketAnalysis: {
            totalPotentialMarket: 25000,
            averageHourlyRate: 75,
            competitorCount: 10,
            marketTrends: ['Professional services demand']
          },
          aiInsights: ['Start with core services'],
          riskFactors: ['Market competition'],
          optimizationTips: ['Focus on quality delivery']
        });
        setCurrentStep('suggestions');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSuggestion = (suggestion: TokenSuggestion) => {
    setSelectedSuggestion(suggestion.id);
    storage.tokenDrafts.saveTokenDraft({
      id: Date.now().toString(),
      suggestion,
      customizations: {},
      createdAt: Date.now(),
      status: 'draft'
    });
  };

  const handleProceedWithTokenization = () => {
    if (selectedSuggestion && plan) {
      const suggestion = plan.recommendedStartOrder.find(s => s.id === selectedSuggestion);
      if (suggestion) {
        onTokenizeSelected(suggestion);
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getDemandColor = (demand: string) => {
    switch (demand) {
      case 'high': return 'text-green-400 bg-green-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-400 bg-red-500/5';
      case 'medium': return 'border-l-yellow-400 bg-yellow-500/5';
      case 'low': return 'border-l-green-400 bg-green-500/5';
      default: return 'border-l-gray-400 bg-gray-500/5';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-blue-500 to-purple-600 flex items-center justify-center p-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-6"></div>
          <h2 className="text-white text-2xl font-bold mb-2">Analyzing Your Portfolio</h2>
          <p className="text-white/80 mb-4">AI is crafting optimal tokenization strategies...</p>
          <div className="bg-white/20 rounded-lg p-4">
            <div className="text-white/90 text-sm space-y-2">
              <div>🔍 Analyzing service potential</div>
              <div>📊 Calculating market demand</div>
              <div>💰 Optimizing pricing strategies</div>
              <div>🎯 Creating launch recommendations</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-blue-500 to-purple-600 flex items-center justify-center p-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full text-center">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <h2 className="text-white text-2xl font-bold mb-2">Analysis Failed</h2>
          <p className="text-white/80 mb-6">Unable to generate tokenization plan</p>
          <button
            onClick={analyzePortfolio}
            className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-blue-500 to-purple-600 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            🎯 Your Tokenization Strategy
          </h1>
          <p className="text-white/80 text-xl">
            AI-optimized plan to tokenize your {plan.totalServices} services
          </p>
        </div>

        {/* Market Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {formatCurrency(plan.estimatedTotalRevenue)}
            </div>
            <div className="text-white/80 text-sm">Estimated Revenue</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {plan.totalServices}
            </div>
            <div className="text-white/80 text-sm">Services to Tokenize</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">
              {formatCurrency(plan.marketAnalysis.averageHourlyRate)}
            </div>
            <div className="text-white/80 text-sm">Average Rate</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">
              {plan.marketAnalysis.competitorCount}
            </div>
            <div className="text-white/80 text-sm">Competitors</div>
          </div>
        </div>

        {/* Token Suggestions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Suggestions List */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4">💡 Recommended Tokens</h2>
            {plan.recommendedStartOrder.map((suggestion, index) => (
              <motion.div
                key={suggestion.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white/10 backdrop-blur-lg rounded-2xl p-6 border-l-4 ${getPriorityColor(suggestion.priority)} ${
                  selectedSuggestion === suggestion.id ? 'ring-2 ring-white/50' : ''
                } cursor-pointer transition-all hover:bg-white/15`}
                onClick={() => handleSelectSuggestion(suggestion)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-white font-bold text-lg mb-1">{suggestion.serviceName}</h3>
                    <p className="text-white/70 text-sm mb-2">{suggestion.description}</p>
                    <div className="flex gap-2 flex-wrap">
                      {suggestion.tags.map(tag => (
                        <span key={tag} className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${getDemandColor(suggestion.marketDemand)}`}>
                    {suggestion.marketDemand} demand
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-white/60 text-xs">Price per Hour</div>
                    <div className="text-white font-bold">{formatCurrency(suggestion.suggestedPricePerHour)}</div>
                  </div>
                  <div>
                    <div className="text-white/60 text-xs">Total Hours</div>
                    <div className="text-white font-bold">{suggestion.suggestedTotalHours}h</div>
                  </div>
                  <div>
                    <div className="text-white/60 text-xs">Validity</div>
                    <div className="text-white font-bold">{suggestion.suggestedValidityDays} days</div>
                  </div>
                  <div>
                    <div className="text-white/60 text-xs">Est. Revenue</div>
                    <div className="text-white font-bold">{formatCurrency(suggestion.estimatedRevenue)}</div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-3 mb-4">
                  <div className="text-white/80 text-sm">
                    <strong>AI Reasoning:</strong> {suggestion.reasoning}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-white/60 text-sm">
                    Competitiveness: {suggestion.competitiveness}/10
                  </div>
                  {selectedSuggestion === suggestion.id && (
                    <div className="text-green-400 font-medium">✓ Selected</div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Analysis Insights */}
          <div className="space-y-6">
            {/* AI Insights */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                🤖 AI Insights
              </h3>
              <div className="space-y-3">
                {plan.aiInsights.map((insight, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="text-blue-400 text-sm">💡</div>
                    <div className="text-white/80 text-sm">{insight}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Market Trends */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                📈 Market Trends
              </h3>
              <div className="space-y-2">
                {plan.marketAnalysis.marketTrends.map((trend, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="text-green-400 text-sm">↗️</div>
                    <div className="text-white/80 text-sm">{trend}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Factors */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                ⚠️ Risk Factors
              </h3>
              <div className="space-y-2">
                {plan.riskFactors.map((risk, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="text-red-400 text-sm">⚠️</div>
                    <div className="text-white/80 text-sm">{risk}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Optimization Tips */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                🎯 Optimization Tips
              </h3>
              <div className="space-y-2">
                {plan.optimizationTips.map((tip, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="text-yellow-400 text-sm">💡</div>
                    <div className="text-white/80 text-sm">{tip}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={onViewMarketplace}
            className="bg-white/20 hover:bg-white/30 text-white px-8 py-3 rounded-xl font-medium transition-all border border-white/30"
          >
            📊 View Marketplace
          </button>
          
          {selectedSuggestion && (
            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={handleProceedWithTokenization}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-8 py-3 rounded-xl font-medium transition-all shadow-lg"
            >
              🚀 Create Token
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}