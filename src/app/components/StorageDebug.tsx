// Debug component to test localStorage functionality
'use client';

import { useState } from 'react';
import { useTimeTokenizerStorage } from '../hooks/useLocalStorage';
import { getStorageStats } from '../utils/localStorage';

export default function StorageDebug() {
  const storage = useTimeTokenizerStorage();
  const [showDebug, setShowDebug] = useState(false);
  const [storageStats, setStorageStats] = useState<any>(null);

  const handleGetStats = () => {
    const stats = getStorageStats();
    setStorageStats(stats);
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all stored data?')) {
      storage.clearAllData();
      setStorageStats(null);
    }
  };

  if (!showDebug) {
    return (
      <button
        onClick={() => setShowDebug(true)}
        className="fixed bottom-4 left-4 bg-black/50 backdrop-blur text-white p-2 rounded text-xs hover:bg-black/70 transition-all"
      >
        🔧 Storage Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 bg-black/80 backdrop-blur text-white p-4 rounded-lg text-xs max-w-md z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-white">Storage Debug Panel</h3>
        <button
          onClick={() => setShowDebug(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* Storage Status */}
      <div className="space-y-2 mb-4">
        <div className="text-green-400">
          📱 Fully Loaded: {storage.isFullyLoaded ? '✅' : '❌'}
        </div>
        <div>
          🔗 App State: <span className="text-blue-400">{storage.appState.appState}</span>
        </div>
        <div>
          👤 User Answers: {storage.userAnswers.userAnswers ? '✅' : '❌'}
          {storage.userAnswers.userAnswers && (
            <span className="text-green-400 ml-1">
              ({storage.userAnswers.userAnswers.name})
            </span>
          )}
        </div>
        <div>
          📊 Portfolio: {storage.portfolio.portfolioData ? '✅' : '❌'}
        </div>
        <div>
          💳 Wallet: {storage.wallet.walletData ? '✅' : '❌'}
          {storage.wallet.walletData && (
            <span className="text-green-400 ml-1">
              ({storage.wallet.walletData.address.slice(0, 6)}...)
            </span>
          )}
        </div>
        <div>
          📝 Questionnaire Step: <span className="text-yellow-400">{storage.questionnaire.currentStep}</span>
        </div>
        <div>
          🎨 Token Drafts: <span className="text-purple-400">{storage.tokenDrafts.tokenDrafts.length}</span>
        </div>
        <div>
          ⛓️ Chain Preference: <span className="text-blue-400">{storage.chainPreference.chainId || 'None'}</span>
        </div>
        <div>
          💾 Auto-save: {storage.autoSave.isEnabled ? '✅' : '❌'}
        </div>
      </div>

      {/* Storage Stats */}
      {storageStats && (
        <div className="mb-4 p-2 bg-gray-800 rounded">
          <div className="text-gray-300 mb-1">Storage Usage:</div>
          <div>Used: {storageStats.usedMB}MB</div>
          <div>Remaining: {storageStats.remainingMB}MB</div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleGetStats}
          className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
        >
          📊 Stats
        </button>
        <button
          onClick={handleClearAll}
          className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
        >
          🗑️ Clear All
        </button>
        <button
          onClick={() => storage.session.updateSession({ lastActivity: Date.now() })}
          className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs"
        >
          💾 Save
        </button>
      </div>

      {/* Session Data Preview */}
      <details className="mt-3">
        <summary className="cursor-pointer text-gray-400 hover:text-white">
          📋 Session Data
        </summary>
        <pre className="mt-2 text-xs bg-gray-900 p-2 rounded overflow-auto max-h-32">
          {JSON.stringify(storage.session.sessionData, null, 2)}
        </pre>
      </details>
    </div>
  );
}