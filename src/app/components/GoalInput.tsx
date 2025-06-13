'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserAnswers } from '../utils/localStorage';

interface GoalInputProps {
  userAnswers: UserAnswers;
  onSubmit: (goal: string) => void;
  onBack: () => void;
}

const exampleGoals = [
  "I want to earn $200 next week!",
  "I need $500 this month for rent",
  "I want to make $1000 in 2 weeks",
  "I need $300 by Friday",
  "I want to earn $100 every week",
  "I need $2000 for vacation in 3 months"
];

export default function GoalInput({ userAnswers, onSubmit, onBack }: GoalInputProps) {
  const [goal, setGoal] = useState('');
  const [isValid, setIsValid] = useState(false);

  const validateGoal = (input: string) => {
    // Check if goal contains amount and timeframe indicators
    const hasAmount = /\$?\d+/.test(input);
    const hasTimeframe = /(next|this|in|within|by|every)\s+(week|month|day|year|friday|monday|tuesday|wednesday|thursday|saturday|sunday)/i.test(input);
    const hasEarnIntent = /(earn|make|need|want|get|generate)/i.test(input);
    
    return hasAmount && (hasTimeframe || hasEarnIntent) && input.length > 10;
  };

  const handleInputChange = (value: string) => {
    setGoal(value);
    setIsValid(validateGoal(value));
  };

  const handleSubmit = () => {
    if (isValid && goal.trim()) {
      onSubmit(goal.trim());
    }
  };

  const handleExampleClick = (example: string) => {
    setGoal(example);
    setIsValid(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
            🎯 Agentic Mode
          </h1>
          <p className="text-gray-600 text-xl mb-2">
            Tell me your goal, and I'll create the perfect token strategy
          </p>
          <p className="text-gray-500 text-sm">
            Hi {userAnswers.name}! As a {userAnswers.experience} professional, 
            I'll help you achieve realistic income goals through smart tokenization.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-gray-50 border border-gray-200 rounded-lg p-8 mb-6"
        >
          <label className="block text-black font-semibold text-lg mb-4">
            What do you want to achieve?
          </label>
          
          <textarea
            value={goal}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g., I want to earn $200 next week..."
            className="w-full px-6 py-4 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-500 text-lg focus:outline-none focus:ring-2 focus:ring-black transition-all resize-none"
            rows={3}
            autoFocus
          />
          
          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center space-x-2">
              {isValid ? (
                <div className="flex items-center text-green-600 text-sm">
                  <span className="mr-1">✓</span>
                  Goal looks good!
                </div>
              ) : goal.length > 0 ? (
                <div className="text-red-600 text-sm">
                  Please include an amount and timeframe (e.g., "$200 next week")
                </div>
              ) : (
                <div className="text-gray-500 text-sm">
                  Include amount and timeframe for best results
                </div>
              )}
            </div>
            <div className="text-gray-400 text-sm">
              {goal.length}/200
            </div>
          </div>
        </motion.div>

        {/* Example Goals */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8"
        >
          <h3 className="text-black font-semibold mb-4">💡 Example Goals:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {exampleGoals.map((example, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleExampleClick(example)}
                className="text-left p-3 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg text-gray-700 text-sm transition-all"
              >
                "{example}"
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex gap-4 justify-center"
        >
          <button
            onClick={onBack}
            className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-black rounded-lg font-medium transition-all border border-gray-300"
          >
            Back to Manual Mode
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className={`px-8 py-3 rounded-lg font-medium transition-all ${
              isValid
                ? 'bg-black hover:bg-gray-800 text-white'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-300'
            }`}
          >
            Analyze My Goal 🚀
          </button>
        </motion.div>

        {/* Help Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg"
        >
          <h4 className="text-black font-semibold mb-2">How Agentic Mode Works:</h4>
          <ol className="text-gray-600 text-sm space-y-1 list-decimal list-inside">
            <li>Tell me your income goal with a specific amount and timeframe</li>
            <li>I'll analyze your portfolio and create 3 custom token strategies</li>
            <li>Choose your preferred strategy (Conservative, Balanced, or Aggressive)</li>
            <li>Review the token details and confirm creation</li>
            <li>I'll execute all transactions automatically - you just approve in your wallet</li>
            <li>Your tokens will be deployed to the marketplace ready for buyers</li>
          </ol>
        </motion.div>
      </div>
    </div>
  );
}