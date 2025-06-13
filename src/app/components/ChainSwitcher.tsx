'use client';

import { useState } from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  avalancheFuji, 
  getChainDisplayName, 
  isSupportedChain, 
  getContractAddress,
  defaultChain 
} from '../lib/wagmi';
import { useChainPreference } from '../hooks/useLocalStorage';
import { AVALANCHE_FUJI_CHAIN_ID, ETHEREUM_SEPOLIA_CHAIN_ID, BASE_SEPOLIA_CHAIN_ID } from '../../../constants';

const supportedTestnets = [
  {
    id: AVALANCHE_FUJI_CHAIN_ID,
    name: 'Avalanche Fuji',
    symbol: 'AVAX',
    icon: '🔺',
    description: 'Primary testnet for Time Tokenizer',
    recommended: true,
  },
  {
    id: ETHEREUM_SEPOLIA_CHAIN_ID,
    name: 'Ethereum Sepolia',
    symbol: 'ETH',
    icon: '⟠',
    description: 'Ethereum testnet',
    recommended: false,
  },
  {
    id: BASE_SEPOLIA_CHAIN_ID,
    name: 'Base Sepolia',
    symbol: 'ETH',
    icon: '🔵',
    description: 'Base testnet',
    recommended: false,
  },
];

interface ChainSwitcherProps {
  className?: string;
  showFullInterface?: boolean;
}

export default function ChainSwitcher({ className = '', showFullInterface = false }: ChainSwitcherProps) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { updateChainPreference } = useChainPreference();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const currentChain = supportedTestnets.find(chain => chain.id === chainId);
  const isCurrentChainSupported = isSupportedChain(chainId);

  const handleChainSwitch = async (targetChainId: number) => {
    if (!isConnected || !switchChain) return;

    setIsSwitching(true);
    try {
      await switchChain({ chainId: targetChainId });
      updateChainPreference(targetChainId);
      console.log(`✅ Switched to ${getChainDisplayName(targetChainId)}`);
      setIsOpen(false);
    } catch (error) {
      console.error('❌ Failed to switch chain:', error);
    } finally {
      setIsSwitching(false);
    }
  };

  // Compact button view for main interface
  if (!showFullInterface) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={!isConnected}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all
            ${isCurrentChainSupported 
              ? 'bg-white/20 border border-white/30 text-white hover:bg-white/30' 
              : 'bg-red-500/80 border border-red-300/50 text-white hover:bg-red-500/90'
            }
            ${!isConnected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <span className="text-lg">
            {currentChain?.icon || '⚠️'}
          </span>
          <span className="hidden sm:inline">
            {currentChain?.name || 'Unsupported'}
          </span>
          <span className="text-xs">▼</span>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full right-0 mt-2 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl z-50 min-w-[250px]"
            >
              <div className="p-4">
                <h3 className="text-white font-semibold mb-3 text-sm">
                  Switch Network
                </h3>
                
                {supportedTestnets.map((chain) => (
                  <button
                    key={chain.id}
                    onClick={() => handleChainSwitch(chain.id)}
                    disabled={isSwitching || chain.id === chainId}
                    className={`
                      w-full flex items-center gap-3 p-3 rounded-xl transition-all mb-2 last:mb-0
                      ${chain.id === chainId 
                        ? 'bg-white/20 border border-white/40' 
                        : 'hover:bg-white/10 border border-transparent'
                      }
                      ${isSwitching ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <span className="text-2xl">{chain.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="text-white font-medium flex items-center gap-2">
                        {chain.name}
                        {chain.recommended && (
                          <span className="bg-green-500 text-xs px-2 py-0.5 rounded-full">
                            Recommended
                          </span>
                        )}
                      </div>
                      <div className="text-white/70 text-xs">{chain.description}</div>
                    </div>
                    {chain.id === chainId && (
                      <span className="text-green-400 text-sm">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Full interface view for settings/dashboard
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Network Selection</h3>
        {isCurrentChainSupported ? (
          <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
            ✓ Supported
          </span>
        ) : (
          <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm">
            ⚠ Unsupported
          </span>
        )}
      </div>

      {!isCurrentChainSupported && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
          <p className="text-red-400 text-sm mb-2">
            ⚠️ Current network is not supported for Time Tokenizer
          </p>
          <p className="text-white/70 text-sm">
            Please switch to one of the supported testnets below to create and trade time tokens.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {supportedTestnets.map((chain) => {
          const contractAddress = getContractAddress(chain.id);
          
          return (
            <motion.div
              key={chain.id}
              whileHover={{ scale: 1.02 }}
              className={`
                p-4 rounded-2xl border-2 transition-all
                ${chain.id === chainId 
                  ? 'bg-white/20 border-white/60' 
                  : 'bg-white/5 border-white/20 hover:bg-white/10'
                }
              `}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{chain.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-white font-semibold">{chain.name}</h4>
                      {chain.recommended && (
                        <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-white/70 text-sm">{chain.description}</p>
                  </div>
                </div>
                
                {chain.id === chainId ? (
                  <span className="bg-green-500 text-white px-4 py-2 rounded-xl font-medium">
                    ✓ Active
                  </span>
                ) : (
                  <button
                    onClick={() => handleChainSwitch(chain.id)}
                    disabled={!isConnected || isSwitching}
                    className={`
                      px-4 py-2 rounded-xl font-medium transition-all
                      ${!isConnected || isSwitching
                        ? 'bg-white/10 text-white/50 cursor-not-allowed'
                        : 'bg-white text-purple-600 hover:bg-white/90'
                      }
                    `}
                  >
                    {isSwitching ? 'Switching...' : 'Switch'}
                  </button>
                )}
              </div>
              
              <div className="text-xs text-white/60 bg-white/5 rounded-lg p-2">
                <div>Contract: {contractAddress}</div>
                <div>Chain ID: {chain.id}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {!isConnected && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4">
          <p className="text-yellow-400 text-sm">
            💡 Connect your wallet to switch networks
          </p>
        </div>
      )}
    </div>
  );
}