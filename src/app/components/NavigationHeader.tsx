'use client';

import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import NotificationCenter from './NotificationCenter';
import { localStorage_utils } from '../utils/localStorage';

interface NavigationHeaderProps {
  currentState: string;
  onNavigate?: (state: string) => void;
  showNavigation?: boolean;
}

export default function NavigationHeader({
  currentState,
  onNavigate,
  showNavigation = false
}: NavigationHeaderProps) {
  const navigationSteps = [
    { id: 'questionnaire', label: '📝 Questionnaire', icon: '📝' },
    { id: 'portfolio', label: '📊 Portfolio', icon: '📊' },
    { id: 'tokenization', label: '🤖 Agentic Mode', icon: '🤖' },
    { id: 'marketplace', label: '🏪 Marketplace', icon: '🏪' },
    { id: 'dashboard', label: '📈 Dashboard', icon: '📈' },
  ];

  const getStepStatus = (stepId: string) => {
    const stepOrder = ['questionnaire', 'portfolio', 'tokenization', 'marketplace', 'dashboard'];
    const currentIndex = stepOrder.indexOf(currentState);
    const stepIndex = stepOrder.indexOf(stepId);
    const userHasReachedDashboard = localStorage_utils.hasUserReachedDashboard();

    // If user has reached dashboard, all steps are considered completed (except current)
    if (userHasReachedDashboard) {
      if (stepIndex === currentIndex) return 'current';
      return 'completed';
    }

    // Normal progression logic for first-time users
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-lg border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo/Title */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-3"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">⏰</span>
            </div>
            <h1 className="text-white font-bold text-xl">Time Tokenizer</h1>
          </motion.div>

          {/* Navigation Steps */}
          {showNavigation && (
            <motion.nav
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="hidden md:flex items-center space-x-1"
            >
              {navigationSteps.map((step) => {
                const status = getStepStatus(step.id);
                const isClickable = status === 'completed' || status === 'current';

                return (
                  <motion.button
                    key={step.id}
                    onClick={() => isClickable && onNavigate?.(step.id)}
                    disabled={!isClickable}
                    whileHover={isClickable ? { scale: 1.05 } : {}}
                    whileTap={isClickable ? { scale: 0.95 } : {}}
                    className={`
                      px-4 py-2 rounded-lg font-medium text-sm transition-all
                      ${status === 'current'
                        ? 'bg-white text-purple-600 shadow-lg'
                        : status === 'completed'
                          ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30 cursor-pointer'
                          : 'bg-white/10 text-white/50 cursor-not-allowed'
                      }
                    `}
                  >
                    <span className="mr-2">{step.icon}</span>
                    <span className="hidden lg:inline">{step.label.split(' ')[1] || step.label}</span>
                  </motion.button>
                );
              })}
            </motion.nav>
          )}

          {/* Right side controls */}
          <div className="flex items-center space-x-3">
            <NotificationCenter />
            <ConnectButton />
          </div>
        </div>

        {/* Mobile Navigation */}
        {showNavigation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="md:hidden mt-3 pt-3 border-t border-white/10"
          >
            <div className="flex items-center justify-center space-x-2 overflow-x-auto">
              {navigationSteps.map((step) => {
                const status = getStepStatus(step.id);
                const isClickable = status === 'completed' || status === 'current';

                return (
                  <button
                    key={step.id}
                    onClick={() => isClickable && onNavigate?.(step.id)}
                    disabled={!isClickable}
                    className={`
                      flex flex-col items-center space-y-1 px-3 py-2 rounded-lg min-w-[80px] transition-all
                      ${status === 'current'
                        ? 'bg-white text-purple-600'
                        : status === 'completed'
                          ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                          : 'bg-white/10 text-white/50 cursor-not-allowed'
                      }
                    `}
                  >
                    <span className="text-lg">{step.icon}</span>
                    <span className="text-xs font-medium">{step.label.split(' ')[1] || step.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}