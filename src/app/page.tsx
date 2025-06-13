'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId } from 'wagmi';
import Questionnaire from './components/Questionnaire';
import ProcessingState from './components/ProcessingState';
import Portfolio from './components/Portfolio';
import StorageDebug from './components/StorageDebug';
import ChainSwitcher from './components/ChainSwitcher';
import { PortfolioData } from './services/elizaAgent';
import TokenizationPlan from './components/TokenizationPlan';
import TokenCreation from './components/TokenCreation';
import Marketplace from './components/Marketplace';
import Dashboard from './components/Dashboard';
import ClientOnly from './components/ClientOnly';
import { TokenSuggestion } from './services/tokenizeAgent';
import { useTimeTokenizerStorage } from './hooks/useLocalStorage';
import { UserAnswers } from './utils/localStorage';
import { isSupportedChain, getChainDisplayName } from './lib/wagmi';

type AppState = 'landing' | 'questionnaire' | 'processing' | 'portfolio' | 'tokenization' | 'token_creation' | 'marketplace' | 'dashboard';

export default function Home() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const storage = useTimeTokenizerStorage();
  
  // Local state for immediate UI updates
  const [isInitialized, setIsInitialized] = useState(false);
  const [showChainWarning, setShowChainWarning] = useState(false);
  const [selectedTokenSuggestion, setSelectedTokenSuggestion] = useState<TokenSuggestion | null>(null);

  // Initialize app state from localStorage on mount
  useEffect(() => {
    if (storage.isFullyLoaded) {
      console.log('📱 Initializing app from localStorage...');
      
      // Restore wallet data if connected
      if (isConnected && address) {
        storage.wallet.saveWallet({
          address,
          chainId: chainId || 43113, // Default to Avalanche Fuji if no chainId
          isConnected: true,
          lastConnected: Date.now(),
        });
        
        // Update chain preference
        if (chainId) {
          storage.chainPreference.updateChainPreference(chainId);
        }
      }

      // Log restored session data
      const sessionData = storage.session.sessionData;
      if (sessionData.userAnswers) {
        console.log('✅ Restored user answers for:', sessionData.userAnswers.name);
      }
      if (sessionData.portfolioData) {
        console.log('✅ Restored portfolio data');
      }
      if (sessionData.tokenDrafts.length > 0) {
        console.log('✅ Restored', sessionData.tokenDrafts.length, 'token drafts');
      }

      setIsInitialized(true);
    }
  }, [storage.isFullyLoaded, isConnected, address]);

  // Handle app state transitions based on wallet connection and stored data
  useEffect(() => {
    if (!isInitialized) return;

    const currentAppState = storage.appState.appState;
    const hasUserAnswers = !!storage.userAnswers.userAnswers;
    const hasPortfolioData = !!storage.portfolio.portfolioData;

    console.log('🔄 App state transition check:', {
      currentAppState,
      isConnected,
      hasUserAnswers,
      hasPortfolioData,
    });

    // Landing page logic
    if (!isConnected) {
      if (currentAppState !== 'landing') {
        console.log('🏠 Redirecting to landing - wallet disconnected');
        storage.appState.updateAppState('landing');
      }
      return;
    }

    // Wallet connected - determine next state
    if (isConnected) {
      if (currentAppState === 'landing') {
        if (hasPortfolioData) {
          console.log('📊 Redirecting to portfolio - data found');
          storage.appState.updateAppState('portfolio');
        } else if (hasUserAnswers) {
          console.log('⏳ Redirecting to processing - answers found');
          storage.appState.updateAppState('processing');
        } else {
          console.log('📝 Redirecting to questionnaire - starting fresh');
          storage.appState.updateAppState('questionnaire');
        }
      }
    }
  }, [isInitialized, isConnected, storage]);

  // Handle chain validation
  useEffect(() => {
    if (isConnected && chainId) {
      const isSupported = isSupportedChain(chainId);
      setShowChainWarning(!isSupported);
      
      if (!isSupported) {
        console.warn(`⚠️ Unsupported chain: ${getChainDisplayName(chainId)} (${chainId})`);
      } else {
        console.log(`✅ Connected to supported chain: ${getChainDisplayName(chainId)}`);
      }
    } else {
      setShowChainWarning(false);
    }
  }, [isConnected, chainId]);

  const handleQuestionnaireComplete = (answers: UserAnswers) => {
    console.log('📝 Questionnaire completed for:', answers.name);
    storage.userAnswers.saveAnswers(answers);
    storage.appState.updateAppState('processing');
  };

  const handleProcessingComplete = (generatedPortfolio: PortfolioData) => {
    console.log('🤖 Portfolio generation completed');
    storage.portfolio.savePortfolio(generatedPortfolio);
    storage.appState.updateAppState('portfolio');
  };

  const handleProceedToTokenization = () => {
    console.log('🚀 Proceeding to tokenization phase');
    storage.appState.updateAppState('tokenization');
  };

  const handleTokenizeSelected = (suggestion: TokenSuggestion) => {
    console.log('🎯 Token selected for creation:', suggestion);
    setSelectedTokenSuggestion(suggestion);
    storage.appState.updateAppState('token_creation');
  };

  const handleTokenCreationSuccess = (tokenId: string) => {
    console.log('✅ Token created successfully:', tokenId);
    setSelectedTokenSuggestion(null);
    storage.appState.updateAppState('marketplace');
  };

  const handleTokenCreationCancel = () => {
    console.log('❌ Token creation cancelled');
    setSelectedTokenSuggestion(null);
    storage.appState.updateAppState('tokenization');
  };

  const handleViewMarketplace = () => {
    console.log('📊 Navigating to marketplace');
    storage.appState.updateAppState('marketplace');
  };

  const handleCreateTokenFromMarketplace = () => {
    console.log('🚀 Creating token from marketplace');
    storage.appState.updateAppState('tokenization');
  };

  const handleViewDashboard = () => {
    console.log('📊 Navigating to dashboard');
    storage.appState.updateAppState('dashboard');
  };

  // Show loading until localStorage is hydrated
  if (!storage.isFullyLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-blue-500 to-purple-600 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mb-4"></div>
          <p className="text-white text-xl">Loading Time Tokenizer...</p>
          <p className="text-white/70 text-sm mt-2">Restoring your session...</p>
        </div>
      </div>
    );
  }

  const currentAppState = storage.appState.appState;
  const userAnswers = storage.userAnswers.userAnswers;
  const portfolioData = storage.portfolio.portfolioData;

  return (
    <ClientOnly fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-blue-500 to-purple-600 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mb-4"></div>
          <p className="text-white text-xl">Loading Time Tokenizer...</p>
        </div>
      </div>
    }>
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-blue-500 to-purple-600">
        {/* Debug Info - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed top-4 right-4 bg-black/20 backdrop-blur text-white p-2 rounded text-xs z-50">
            State: {currentAppState} | Connected: {isConnected ? '✅' : '❌'} | 
            Chain: {chainId ? getChainDisplayName(chainId) : 'None'} |
            Answers: {userAnswers ? '✅' : '❌'} | Portfolio: {portfolioData ? '✅' : '❌'}
          </div>
        )}

      {/* Chain Warning */}
      {showChainWarning && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500/20 backdrop-blur border border-red-500/50 text-red-400 px-6 py-3 rounded-2xl z-40 max-w-md text-center">
          <p className="font-semibold mb-1">⚠️ Unsupported Network</p>
          <p className="text-sm">Please switch to Avalanche Fuji to use Time Tokenizer</p>
        </div>
      )}

      {currentAppState === 'landing' && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-8 px-8">
            <h1 className="text-6xl md:text-8xl font-bold text-white drop-shadow-2xl animate-fade-in">
              Your time, Your token
            </h1>
            
            <div className="space-y-6">
              {!isConnected ? (
                <div className="space-y-4 animate-slide-up">
                  <p className="text-white/90 text-xl md:text-2xl">
                    Start tokenizing your time and unlock the value of every moment
                  </p>
                  <ConnectButton.Custom>
                    {({
                      account,
                      chain,
                      openAccountModal,
                      openChainModal,
                      openConnectModal,
                      mounted,
                    }) => {
                      const ready = mounted;
                      const connected = ready && account && chain;

                      return (
                        <div
                          {...(!ready && {
                            'aria-hidden': true,
                            'style': {
                              opacity: 0,
                              pointerEvents: 'none',
                              userSelect: 'none',
                            },
                          })}
                        >
                          {(() => {
                            if (!connected) {
                              return (
                                <button
                                  onClick={openConnectModal}
                                  className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-12 py-4 rounded-full text-xl font-semibold hover:bg-white/30 transition-all duration-300 transform hover:scale-105 shadow-xl"
                                >
                                  Start tokenizing your time!
                                </button>
                              );
                            }

                            if (chain.unsupported) {
                              return (
                                <button
                                  onClick={openChainModal}
                                  className="bg-red-500/80 backdrop-blur-md border border-red-300/50 text-white px-8 py-3 rounded-full font-medium hover:bg-red-500/90 transition-all duration-300"
                                >
                                  Wrong network
                                </button>
                              );
                            }

                            return (
                              <div className="flex gap-4 justify-center flex-wrap">
                                <ChainSwitcher className="order-1" />
                                
                                <button
                                  onClick={openAccountModal}
                                  className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-6 py-3 rounded-full font-medium hover:bg-white/30 transition-all duration-300 order-2"
                                >
                                  {account.displayName}
                                  {account.displayBalance
                                    ? ` (${account.displayBalance})`
                                    : ''}
                                </button>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    }}
                  </ConnectButton.Custom>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {currentAppState === 'questionnaire' && (
        <Questionnaire onComplete={handleQuestionnaireComplete} />
      )}

      {currentAppState === 'processing' && userAnswers && (
        <ProcessingState 
          userAnswers={userAnswers} 
          onComplete={handleProcessingComplete} 
        />
      )}

      {currentAppState === 'portfolio' && userAnswers && portfolioData && (
        <Portfolio 
          userAnswers={userAnswers} 
          portfolioData={portfolioData}
          onProceedToTokenization={handleProceedToTokenization}
        />
      )}

      {currentAppState === 'tokenization' && userAnswers && portfolioData && (
        <TokenizationPlan
          userAnswers={userAnswers}
          portfolioData={portfolioData}
          onTokenizeSelected={handleTokenizeSelected}
          onViewMarketplace={handleViewMarketplace}
        />
      )}

      {currentAppState === 'token_creation' && selectedTokenSuggestion && (
        <TokenCreation
          suggestion={selectedTokenSuggestion}
          onSuccess={handleTokenCreationSuccess}
          onCancel={handleTokenCreationCancel}
        />
      )}

      {currentAppState === 'marketplace' && (
        <Marketplace
          onCreateToken={handleCreateTokenFromMarketplace}
          onViewDashboard={handleViewDashboard}
        />
      )}

      {currentAppState === 'dashboard' && (
        <Dashboard
          onCreateToken={handleCreateTokenFromMarketplace}
          onViewMarketplace={handleViewMarketplace}
        />
      )}

        {/* Debug Panel - Development Only */}
        {process.env.NODE_ENV === 'development' && <StorageDebug />}
      </div>
    </ClientOnly>
  );
}
