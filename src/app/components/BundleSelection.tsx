'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AgenticAnalysis, TokenBundle } from '../services/tokenizeAgent';

interface BundleSelectionProps {
  analysis: AgenticAnalysis;
  goal: string;
  onSelectBundle: (bundle: TokenBundle) => void;
  onBack: () => void;
}

export default function BundleSelection({ 
  analysis, 
  goal, 
  onSelectBundle, 
  onBack 
}: BundleSelectionProps) {
  const [selectedBundleId, setSelectedBundleId] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'conservative': return 'border-l-green-500 bg-green-50';
      case 'balanced': return 'border-l-blue-500 bg-blue-50';
      case 'aggressive': return 'border-l-red-500 bg-red-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getStrategyIcon = (strategy: string) => {
    switch (strategy) {
      case 'conservative': return '🛡️';
      case 'balanced': return '⚖️';
      case 'aggressive': return '🚀';
      default: return '📊';
    }
  };

  const getSuccessColor = (probability: number) => {
    if (probability >= 7) return 'text-green-600';
    if (probability >= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleSelectBundle = (bundle: TokenBundle) => {
    setSelectedBundleId(bundle.id);
  };

  const handleConfirm = () => {
    const selectedBundle = analysis.bundles.find(b => b.id === selectedBundleId);
    console.log('🎯 BundleSelection: Confirming bundle selection');
    console.log('Selected Bundle ID:', selectedBundleId);
    console.log('Selected Bundle:', selectedBundle);
    console.log('Selected Bundle Tokens:', selectedBundle?.tokens);
    if (selectedBundle) {
      onSelectBundle(selectedBundle);
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-black mb-4">
            📊 Your Custom Token Strategies
          </h1>
          <p className="text-gray-600 text-lg mb-2">
            Goal: "{goal}"
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 inline-block">
            <div className="text-sm text-gray-700">
              <strong>Analysis Summary:</strong> {analysis.recommendation}
            </div>
          </div>
        </motion.div>

        {/* Educational Message */}
        {analysis.goalAnalysis.educationalMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <span className="text-yellow-600 text-lg">💡</span>
              <div>
                <h4 className="text-yellow-800 font-semibold">Educational Insight:</h4>
                <p className="text-yellow-700 text-sm mt-1">
                  {analysis.goalAnalysis.educationalMessage}
                </p>
                {analysis.goalAnalysis.adjustedGoal && (
                  <div className="mt-2 p-2 bg-yellow-100 rounded border">
                    <p className="text-yellow-800 text-xs">
                      <strong>Suggested Adjustment:</strong> ${analysis.goalAnalysis.adjustedGoal.amount} 
                      in {analysis.goalAnalysis.adjustedGoal.timeframe}
                      <br />
                      <em>{analysis.goalAnalysis.adjustedGoal.reasoning}</em>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Bundle Options */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {analysis.bundles.map((bundle, index) => (
            <motion.div
              key={bundle.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className={`border-l-4 ${getStrategyColor(bundle.strategy)} border border-gray-200 rounded-lg p-6 cursor-pointer transition-all ${
                selectedBundleId === bundle.id 
                  ? 'ring-2 ring-black transform scale-105' 
                  : 'hover:shadow-lg'
              }`}
              onClick={() => handleSelectBundle(bundle)}
            >
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-black font-bold text-lg flex items-center gap-2">
                    {getStrategyIcon(bundle.strategy)} {bundle.bundleName}
                  </h3>
                  {selectedBundleId === bundle.id && (
                    <span className="text-black font-medium">✓ Selected</span>
                  )}
                </div>
                <p className="text-gray-600 text-sm mb-3">{bundle.description}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-gray-500 text-xs">Total Revenue</div>
                    <div className="text-black font-bold text-lg">
                      {formatCurrency(bundle.totalRevenue)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">Total Hours</div>
                    <div className="text-black font-bold text-lg">{bundle.totalHours}h</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">Avg. Rate</div>
                    <div className="text-black font-bold">
                      {formatCurrency(bundle.averageHourlyRate)}/hr
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">Success Rate</div>
                    <div className={`font-bold ${getSuccessColor(bundle.successProbability)}`}>
                      {bundle.successProbability}/10
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-gray-500 text-xs mb-1">Time to Complete</div>
                  <div className="text-black font-medium">{bundle.timeToComplete}</div>
                </div>
              </div>

              {/* Pros & Cons */}
              <div className="space-y-3">
                <div>
                  <h5 className="text-green-600 font-semibold text-sm mb-1">✓ Pros:</h5>
                  <ul className="text-gray-600 text-xs space-y-1">
                    {bundle.pros.map((pro, i) => (
                      <li key={i}>• {pro}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="text-red-600 font-semibold text-sm mb-1">⚠ Cons:</h5>
                  <ul className="text-gray-600 text-xs space-y-1">
                    {bundle.cons.map((con, i) => (
                      <li key={i}>• {con}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Token Preview */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h5 className="text-black font-semibold text-sm mb-2">
                  Tokens in this bundle:
                </h5>
                {bundle.tokens.map((token, tokenIndex) => (
                  <div key={token.id} className="text-xs text-gray-600 mb-1">
                    {tokenIndex + 1}. {token.serviceName} - {formatCurrency(token.suggestedPricePerHour)}/hr 
                    × {token.suggestedTotalHours}h
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Educational Insights */}
        {analysis.educationalInsights.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-lg"
          >
            <h3 className="text-black font-bold text-lg mb-4">
              📚 Educational Insights
            </h3>
            <div className="space-y-2">
              {analysis.educationalInsights.map((insight, index) => (
                <div key={index} className="flex gap-3">
                  <span className="text-blue-500 text-sm">💡</span>
                  <p className="text-gray-700 text-sm">{insight}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex gap-4 justify-center"
        >
          <button
            onClick={onBack}
            className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-black rounded-lg font-medium transition-all border border-gray-300"
          >
            Change Goal
          </button>
          
          {selectedBundleId && (
            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={handleConfirm}
              className="bg-black hover:bg-gray-800 text-white px-8 py-3 rounded-lg font-medium transition-all"
            >
              Proceed with {analysis.bundles.find(b => b.id === selectedBundleId)?.bundleName} 🚀
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  );
}