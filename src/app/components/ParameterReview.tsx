'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TokenBundle, AgenticAnalysis } from '../services/tokenizeAgent';
import { ParameterValidationService, CreateTokenParams, ValidationResult } from '../services/parameterValidation';

interface ParameterReviewProps {
  bundle: TokenBundle;
  goal: string;
  analysis: AgenticAnalysis;
  onConfirm: () => void;
  onBack: () => void;
}

export default function ParameterReview({ 
  bundle, 
  goal, 
  analysis, 
  onConfirm, 
  onBack 
}: ParameterReviewProps) {
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    // Validate all tokens in the bundle
    const validateTokens = () => {
      const results = bundle.tokens.map(token => {
        const params: CreateTokenParams = ParameterValidationService.tokenSuggestionToParams(token);
        return ParameterValidationService.validateTokenCreation(params);
      });
      setValidationResults(results);
      setIsValidating(false);
    };

    validateTokens();
  }, [bundle]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'conservative': return 'text-green-600 bg-green-50 border-green-200';
      case 'balanced': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'aggressive': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
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

  const allTokensValid = validationResults.every(result => result.isValid);
  const hasWarnings = validationResults.some(result => result.warnings.length > 0);

  if (isValidating) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-black mx-auto mb-6"></div>
          <h2 className="text-black text-2xl font-bold mb-2">Validating Parameters</h2>
          <p className="text-gray-600">Checking token parameters for smart contract compatibility...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-black mb-4">
            ✅ Review Your Token Strategy
          </h1>
          <p className="text-gray-600 text-lg mb-2">
            Goal: "{goal}"
          </p>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${getStrategyColor(bundle.strategy)}`}>
            <span className="text-lg">{getStrategyIcon(bundle.strategy)}</span>
            <span className="font-semibold">{bundle.bundleName}</span>
          </div>
        </motion.div>

        {/* Bundle Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6"
        >
          <h3 className="text-black font-bold text-lg mb-4">Strategy Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <div className="text-gray-500 text-sm">Total Revenue</div>
              <div className="text-black font-bold text-xl">{formatCurrency(bundle.totalRevenue)}</div>
            </div>
            <div>
              <div className="text-gray-500 text-sm">Total Hours</div>
              <div className="text-black font-bold text-xl">{bundle.totalHours}h</div>
            </div>
            <div>
              <div className="text-gray-500 text-sm">Avg. Rate</div>
              <div className="text-black font-bold text-xl">{formatCurrency(bundle.averageHourlyRate)}/hr</div>
            </div>
            <div>
              <div className="text-gray-500 text-sm">Success Rate</div>
              <div className="text-black font-bold text-xl">{bundle.successProbability}/10</div>
            </div>
          </div>
          <p className="text-gray-600 text-sm">{bundle.description}</p>
        </motion.div>

        {/* Token Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <h3 className="text-black font-bold text-lg mb-4">Tokens to be Created</h3>
          <div className="space-y-4">
            {bundle.tokens.map((token, index) => {
              const validation = validationResults[index];
              const params = ParameterValidationService.tokenSuggestionToParams(token);
              const insights = ParameterValidationService.calculateTokenInsights(params);

              return (
                <div key={token.id} className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-black font-semibold text-lg">{token.serviceName}</h4>
                      <p className="text-gray-600 text-sm">{token.description}</p>
                    </div>
                    <div className="text-right">
                      {validation?.isValid ? (
                        <span className="text-green-600 text-sm font-medium">✓ Valid</span>
                      ) : (
                        <span className="text-red-600 text-sm font-medium">⚠ Issues</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-gray-500 text-xs">Price per Hour</div>
                      <div className="text-black font-bold">{formatCurrency(token.suggestedPricePerHour)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Total Hours</div>
                      <div className="text-black font-bold">{token.suggestedTotalHours}h</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Valid For</div>
                      <div className="text-black font-bold">{token.suggestedValidityDays} days</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Token Value</div>
                      <div className="text-black font-bold">{formatCurrency(token.estimatedRevenue)}</div>
                    </div>
                  </div>

                  {/* Economics Insights */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                    <h5 className="text-black font-medium text-sm mb-2">Token Economics</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>• Daily value: {formatCurrency(insights.dailyValue)}</div>
                      <div>• Hours per day: {insights.hoursPerDay.toFixed(1)}</div>
                      <div>• Market demand: {token.marketDemand}</div>
                      <div>• Competition level: {token.competitiveness}/10</div>
                    </div>
                  </div>

                  {/* Validation Results */}
                  {validation && (
                    <div className="space-y-2">
                      {validation.errors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <h6 className="text-red-800 font-medium text-sm">Errors:</h6>
                          {validation.errors.map((error, i) => (
                            <div key={i} className="text-red-600 text-xs">• {error}</div>
                          ))}
                        </div>
                      )}
                      
                      {validation.warnings.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <h6 className="text-yellow-800 font-medium text-sm">Warnings:</h6>
                          {validation.warnings.map((warning, i) => (
                            <div key={i} className="text-yellow-600 text-xs">• {warning}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Transaction Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6"
        >
          <h3 className="text-black font-bold text-lg mb-4">📋 Transaction Summary</h3>
          <div className="space-y-2 text-sm text-gray-600 mb-4">
            <div>• {bundle.tokens.length} token(s) will be created</div>
            <div>• Each token creation requires a separate transaction</div>
            <div>• Estimated gas fees: ~$5-15 per transaction (depending on network)</div>
            <div>• All tokens will be deployed to the marketplace automatically</div>
            <div>• You'll receive transaction hashes for each creation</div>
          </div>
          
          {hasWarnings && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <span className="text-yellow-600">⚠️</span>
                <div>
                  <div className="text-yellow-800 font-medium text-sm">Review Warnings</div>
                  <div className="text-yellow-700 text-xs">
                    Some tokens have warnings. Review them above before proceeding.
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <span className="text-blue-600">💡</span>
              <div>
                <div className="text-blue-800 font-medium text-sm">Next Steps</div>
                <div className="text-blue-700 text-xs">
                  After confirmation, you'll be prompted to approve each transaction in your wallet. 
                  Keep your wallet open and ready to sign {bundle.tokens.length} transaction(s).
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex gap-4 justify-center"
        >
          <button
            onClick={onBack}
            className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-black rounded-lg font-medium transition-all border border-gray-300"
          >
            Choose Different Strategy
          </button>
          
          <button
            onClick={onConfirm}
            disabled={!allTokensValid}
            className={`px-8 py-3 rounded-lg font-medium transition-all ${
              allTokensValid
                ? 'bg-black hover:bg-gray-800 text-white'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-300'
            }`}
          >
            {allTokensValid ? 'Create Tokens 🚀' : 'Fix Issues to Continue'}
          </button>
        </motion.div>
      </div>
    </div>
  );
}