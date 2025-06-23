'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useChainId } from 'wagmi';
import { TokenSuggestion } from '../services/tokenizeAgent';
import { getContractService, TokenCreationParams } from '../services/contractService';
import { isSupportedChain, getChainDisplayName } from '../lib/wagmi';
import { getAlertAgent } from '../services/alertAgent';
import { validateTokenCreation } from '../utils/validation';
import { useErrorHandler } from './ErrorBoundary';

interface TokenCreationProps {
  suggestion: TokenSuggestion;
  onSuccess: (tokenId: string) => void;
  onCancel: () => void;
}

export default function TokenCreation({ suggestion, onSuccess, onCancel }: TokenCreationProps) {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const [isCreating, setIsCreating] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [customizations, setCustomizations] = useState({
    serviceName: suggestion.serviceName,
    pricePerHour: suggestion.suggestedPricePerHour,
    totalHours: suggestion.suggestedTotalHours,
    validityDays: suggestion.suggestedValidityDays
  });
  const [gasEstimate, setGasEstimate] = useState<string>('');
  
  const contractService = getContractService();
  const alertAgent = getAlertAgent();
  const { captureError } = useErrorHandler();

  useEffect(() => {
    // Estimate gas cost when component loads
    estimateGas();
  }, []);

  const estimateGas = async () => {
    try {
      const cost = await contractService.estimateGasCost('create');
      const formattedPrice = await contractService.formatPrice(cost);
      setGasEstimate(formattedPrice.crypto); // Use the crypto amount as string
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      setGasEstimate('~0.001');
    }
  };

  const handleCustomizationChange = (field: string, value: string | number) => {
    setCustomizations(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateTotalValue = () => {
    return customizations.pricePerHour * customizations.totalHours;
  };

  const calculateDailyUtilization = () => {
    return (customizations.totalHours / customizations.validityDays).toFixed(2);
  };

  const handleTokenCreationCancel = () => {
    console.log('❌ Token creation cancelled');
    
    // Clean up component state before cancelling
    setIsCreating(false);
    setCurrentStep(1);
    setGasEstimate('');
    
    // Reset customizations to original suggestion values
    setCustomizations({
      serviceName: suggestion.serviceName,
      pricePerHour: suggestion.suggestedPricePerHour,
      totalHours: suggestion.suggestedTotalHours,
      validityDays: suggestion.suggestedValidityDays
    });
    
    onCancel();
  };

  const handleCreateToken = async () => {
    if (!isConnected || !address) {
      alertAgent.addNotification({
        type: 'system',
        title: '❌ Wallet Not Connected',
        message: 'Please connect your wallet to create tokens',
        priority: 'high'
      });
      return;
    }

    if (!isSupportedChain(chainId)) {
      alertAgent.addNotification({
        type: 'system',
        title: '❌ Unsupported Network',
        message: 'Please switch to a supported testnet',
        priority: 'high'
      });
      return;
    }

    try {
      // Validate form data before proceeding
      const validation = validateTokenCreation(customizations);
      if (!validation.isValid) {
        alertAgent.addNotification({
          type: 'system',
          title: '❌ Validation Error',
          message: validation.errors.join(', '),
          priority: 'medium'
        });
        return;
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        alertAgent.addNotification({
          type: 'system',
          title: '⚠️ Warning',
          message: validation.warnings.join(', '),
          priority: 'low'
        });
      }

      setIsCreating(true);
      setCurrentStep(2);

      const params: TokenCreationParams = {
        serviceName: customizations.serviceName,
        pricePerHour: customizations.pricePerHour,
        totalHours: customizations.totalHours,
        validityDays: customizations.validityDays
      };

      console.log('🚀 Creating token with params:', params);

      const result = await contractService.createTimeToken(params);
      
      setCurrentStep(3);
      
      setTimeout(() => {
        if (result.tokenId) {
          onSuccess(result.tokenId);
        }
      }, 2000);

    } catch (error) {
      setIsCreating(false);
      setCurrentStep(1); // Return to customization step
      
      // Handle user cancellation gracefully - no error logging
      if (error instanceof Error && (error.message.includes('user rejected') || error.message.includes('User denied transaction') || error.message.includes('cancelled by user') || error.message.includes('rejected'))) {
        console.log('🗙️ Token creation cancelled by user');
        
        alertAgent.addNotification({
          type: 'system',
          title: '⚠️ Token Creation Cancelled',
          message: 'You can modify your token settings and try again.',
          priority: 'medium'
        });
        
        return; // Exit without logging error
      }
      
      // Handle other errors (insufficient funds, network issues, etc.)
      console.error('❌ Token creation failed:', error);
      
      let errorMessage = 'Token creation failed. Please try again.';
      let errorTitle = '❌ Token Creation Failed';
      
      if (error instanceof Error) {
        if (error.message.includes('insufficient funds') || error.message.includes('balance')) {
          errorMessage = 'Insufficient balance for token creation and gas fees.';
          errorTitle = '💰 Insufficient Funds';
        } else if (error.message.includes('gas')) {
          errorMessage = 'Transaction failed due to gas estimation issues.';
          errorTitle = '⛽ Gas Error';
        } else {
          errorMessage = error.message;
        }
      }
      
      alertAgent.addNotification({
        type: 'system',
        title: errorTitle,
        message: errorMessage,
        priority: 'high'
      });
      
      // Only capture non-cancellation errors for debugging
      captureError(error as Error, {
        action: 'createToken',
        details: { customizations, chainId, address }
      });
    }
  };

  const steps = [
    { id: 1, title: 'Customize Token', icon: '⚙️' },
    { id: 2, title: 'Creating Token', icon: '⏳' },
    { id: 3, title: 'Success!', icon: '🎉' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-blue-500 to-purple-600 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            🎯 Create Your Time Token
          </h1>
          <p className="text-white/80 text-xl">
            Transform your "{suggestion.serviceName}" service into a tradeable token
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
            <div className="flex items-center space-x-8">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-12 h-12 rounded-full font-bold transition-all
                    ${currentStep >= step.id 
                      ? 'bg-green-500 text-white' 
                      : currentStep === step.id 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white/20 text-white/60'
                    }
                  `}>
                    {currentStep > step.id ? '✓' : step.icon}
                  </div>
                  <span className={`ml-3 font-medium ${
                    currentStep >= step.id ? 'text-white' : 'text-white/60'
                  }`}>
                    {step.title}
                  </span>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 ${
                      currentStep > step.id ? 'bg-green-500' : 'bg-white/20'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="customize"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {/* Customization Form */}
              <div className="space-y-6">
                <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
                  <h2 className="text-2xl font-bold text-white mb-6">Customize Your Token</h2>
                  
                  <div className="space-y-4">
                    {/* Service Name */}
                    <div>
                      <label className="block text-white/80 font-medium mb-2">Service Name</label>
                      <input
                        type="text"
                        value={customizations.serviceName}
                        onChange={(e) => handleCustomizationChange('serviceName', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white/50"
                        placeholder="Enter service name"
                      />
                    </div>

                    {/* Price Per Hour */}
                    <div>
                      <label className="block text-white/80 font-medium mb-2">Price per Hour (USD)</label>
                      <input
                        type="number"
                        value={customizations.pricePerHour}
                        onChange={(e) => handleCustomizationChange('pricePerHour', parseFloat(e.target.value) || 0)}
                        min="1"
                        step="1"
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white/50"
                      />
                    </div>

                    {/* Total Hours */}
                    <div>
                      <label className="block text-white/80 font-medium mb-2">Total Hours</label>
                      <input
                        type="number"
                        value={customizations.totalHours}
                        onChange={(e) => handleCustomizationChange('totalHours', parseInt(e.target.value) || 0)}
                        min="1"
                        step="1"
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white/50"
                      />
                    </div>

                    {/* Validity Days */}
                    <div>
                      <label className="block text-white/80 font-medium mb-2">Validity Period (Days)</label>
                      <input
                        type="number"
                        value={customizations.validityDays}
                        onChange={(e) => handleCustomizationChange('validityDays', parseInt(e.target.value) || 0)}
                        min="1"
                        step="1"
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Network Status */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">Network:</span>
                    <span className={`font-medium ${
                      isSupportedChain(chainId) ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {getChainDisplayName(chainId)}
                      {isSupportedChain(chainId) ? ' ✓' : ' ⚠️'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-white/80">Estimated Gas:</span>
                    <span className="text-white font-medium">~{gasEstimate} ETH</span>
                  </div>
                </div>
              </div>

              {/* Preview & Summary */}
              <div className="space-y-6">
                <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
                  <h3 className="text-xl font-bold text-white mb-4">Token Preview</h3>
                  
                  <div className="space-y-4">
                    <div className="bg-white/5 rounded-2xl p-4">
                      <h4 className="text-white font-semibold text-lg mb-2">{customizations.serviceName}</h4>
                      <p className="text-white/70 text-sm mb-3">{suggestion.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-white/60">Price/Hour:</span>
                          <div className="text-white font-medium">${customizations.pricePerHour}</div>
                        </div>
                        <div>
                          <span className="text-white/60">Total Hours:</span>
                          <div className="text-white font-medium">{customizations.totalHours}h</div>
                        </div>
                        <div>
                          <span className="text-white/60">Total Value:</span>
                          <div className="text-green-400 font-bold">${calculateTotalValue()}</div>
                        </div>
                        <div>
                          <span className="text-white/60">Valid For:</span>
                          <div className="text-white font-medium">{customizations.validityDays} days</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-500/20 rounded-xl p-3 text-center">
                        <div className="text-blue-400 text-sm">Daily Utilization</div>
                        <div className="text-white font-bold">{calculateDailyUtilization()}h/day</div>
                      </div>
                      <div className="bg-green-500/20 rounded-xl p-3 text-center">
                        <div className="text-green-400 text-sm">Market Demand</div>
                        <div className="text-white font-bold capitalize">{suggestion.marketDemand}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Insights */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
                  <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                    🤖 AI Insights
                  </h4>
                  <p className="text-white/80 text-sm">{suggestion.reasoning}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={handleTokenCreationCancel}
                    className="flex-1 bg-white/20 hover:bg-white/30 text-white py-4 px-6 rounded-xl font-medium transition-all border border-white/30"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateToken}
                    disabled={isCreating || !isConnected || !isSupportedChain(chainId)}
                    className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white py-4 px-6 rounded-xl font-medium transition-all shadow-lg"
                  >
                    {!isConnected ? 'Connect Wallet' : 
                     !isSupportedChain(chainId) ? 'Switch Network' :
                     'Create Token'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="creating"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 max-w-md mx-auto">
                <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-white mx-auto mb-6"></div>
                <h2 className="text-2xl font-bold text-white mb-4">Creating Your Token</h2>
                <p className="text-white/80 mb-6">
                  Processing blockchain transaction...
                </p>
                <div className="space-y-2 text-white/60 text-sm">
                  <div>✓ Validating parameters</div>
                  <div>✓ Submitting to blockchain</div>
                  <div className="text-yellow-400">⏳ Waiting for confirmation...</div>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 max-w-md mx-auto">
                <div className="text-6xl mb-6">🎉</div>
                <h2 className="text-3xl font-bold text-white mb-4">Token Created!</h2>
                <p className="text-white/80 mb-6">
                  Your "{customizations.serviceName}" token is now live on the blockchain
                </p>
                <div className="bg-green-500/20 rounded-xl p-4 mb-6">
                  <div className="text-green-400 text-sm">Total Value</div>
                  <div className="text-white font-bold text-2xl">${calculateTotalValue()}</div>
                </div>
                <p className="text-white/60 text-sm">
                  Redirecting to marketplace...
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}