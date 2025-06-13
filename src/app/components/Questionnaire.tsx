'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuestionnaireProgress, useUserAnswers } from '../hooks/useLocalStorage';
import { UserAnswers } from '../utils/localStorage';

interface QuestionnaireProps {
  onComplete: (answers: UserAnswers) => void;
}

const questions = [
  {
    id: 'name',
    title: 'What should we call you?',
    subtitle: 'Your professional name or how you\'d like to be addressed',
    type: 'text',
    placeholder: 'Enter your name...',
  },
  {
    id: 'experience',
    title: 'What\'s your experience level?',
    subtitle: 'This helps us match you with the right opportunities',
    type: 'select',
    options: [
      { value: 'beginner', label: '🌱 Beginner (0-2 years)', description: 'Just starting out' },
      { value: 'intermediate', label: '🚀 Intermediate (2-5 years)', description: 'Growing expertise' },
      { value: 'advanced', label: '⭐ Advanced (5-10 years)', description: 'Solid experience' },
      { value: 'expert', label: '🏆 Expert (10+ years)', description: 'Industry veteran' },
    ],
  },
  {
    id: 'skills',
    title: 'What are your superpowers?',
    subtitle: 'Select all the skills you\'re confident in',
    type: 'multiselect',
    options: [
      { value: 'frontend', label: '🎨 Frontend Development', category: 'Development' },
      { value: 'backend', label: '⚙️ Backend Development', category: 'Development' },
      { value: 'fullstack', label: '🔧 Full Stack Development', category: 'Development' },
      { value: 'mobile', label: '📱 Mobile Development', category: 'Development' },
      { value: 'ai', label: '🤖 AI/Machine Learning', category: 'Development' },
      { value: 'blockchain', label: '⛓️ Blockchain/Web3', category: 'Development' },
      { value: 'design', label: '🎭 UI/UX Design', category: 'Design' },
      { value: 'graphics', label: '🖌️ Graphic Design', category: 'Design' },
      { value: 'marketing', label: '📈 Digital Marketing', category: 'Marketing' },
      { value: 'content', label: '✍️ Content Creation', category: 'Marketing' },
      { value: 'consulting', label: '💡 Business Consulting', category: 'Business' },
      { value: 'project', label: '📋 Project Management', category: 'Business' },
    ],
  },
  {
    id: 'timeAvailable',
    title: 'How much time can you tokenize?',
    subtitle: 'Be realistic about your availability',
    type: 'select',
    options: [
      { value: '5-10', label: '⏰ 5-10 hours/week', description: 'Side hustle mode' },
      { value: '10-20', label: '⏱️ 10-20 hours/week', description: 'Part-time commitment' },
      { value: '20-30', label: '⏲️ 20-30 hours/week', description: 'Serious engagement' },
      { value: '30+', label: '⏳ 30+ hours/week', description: 'Full-time dedication' },
    ],
  },
  {
    id: 'goals',
    title: 'What\'s your ultimate goal?',
    subtitle: 'This helps us understand your motivation',
    type: 'textarea',
    placeholder: 'I want to build my skills, earn extra income, work on exciting projects...',
  },
  {
    id: 'preferredProjects',
    title: 'What type of projects excite you?',
    subtitle: 'Choose the ones that make you curious',
    type: 'multiselect',
    options: [
      { value: 'startup', label: '🚀 Startup Projects', category: 'Business' },
      { value: 'enterprise', label: '🏢 Enterprise Solutions', category: 'Business' },
      { value: 'nonprofit', label: '❤️ Non-profit/Social Impact', category: 'Impact' },
      { value: 'creative', label: '🎨 Creative/Art Projects', category: 'Creative' },
      { value: 'education', label: '📚 Educational Platforms', category: 'Impact' },
      { value: 'fintech', label: '💰 Financial Technology', category: 'Tech' },
      { value: 'healthcare', label: '🏥 Healthcare Innovation', category: 'Tech' },
      { value: 'gaming', label: '🎮 Gaming/Entertainment', category: 'Creative' },
      { value: 'ecommerce', label: '🛒 E-commerce Solutions', category: 'Business' },
      { value: 'blockchain', label: '⛓️ Blockchain/Crypto', category: 'Tech' },
    ],
  },
  {
    id: 'hourlyRate',
    title: 'What\'s your time worth?',
    subtitle: 'Set your hourly rate in USD (you can always adjust this later)',
    type: 'select',
    options: [
      { value: '10-25', label: '💵 $10-25/hour', description: 'Getting started' },
      { value: '25-50', label: '💰 $25-50/hour', description: 'Building reputation' },
      { value: '50-100', label: '💎 $50-100/hour', description: 'Experienced professional' },
      { value: '100+', label: '🏆 $100+/hour', description: 'Premium expertise' },
    ],
  },
];

export default function Questionnaire({ onComplete }: QuestionnaireProps) {
  const progressHook = useQuestionnaireProgress();
  const userAnswersHook = useUserAnswers();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<UserAnswers>>({});
  const [isAnimating, setIsAnimating] = useState(false);
  const [isRestored, setIsRestored] = useState(false);

  // Restore progress and answers from localStorage
  useEffect(() => {
    if (progressHook.isLoaded && userAnswersHook.isLoaded) {
      const savedProgress = progressHook.currentStep;
      const savedAnswers = userAnswersHook.userAnswers;
      
      if (savedAnswers) {
        console.log('📝 Restoring questionnaire answers for:', savedAnswers.name);
        setAnswers(savedAnswers);
        setCurrentStep(Math.min(savedProgress, questions.length - 1));
      } else if (savedProgress > 0) {
        console.log('📝 Restoring questionnaire progress to step:', savedProgress);
        setCurrentStep(Math.min(savedProgress, questions.length - 1));
      }
      
      setIsRestored(true);
    }
  }, [progressHook.isLoaded, userAnswersHook.isLoaded]);

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  const handleAnswer = (questionId: string, value: string | string[]) => {
    const updatedAnswers = { ...answers, [questionId]: value };
    setAnswers(updatedAnswers);
    
    // Auto-save answers to localStorage
    if (Object.keys(updatedAnswers).length > 0) {
      // Only save if we have at least some answers
      userAnswersHook.saveAnswers(updatedAnswers as UserAnswers);
    }
  };

  const handleNext = () => {
    const nextStep = currentStep + 1;
    
    // Save progress
    progressHook.updateProgress(nextStep);
    
    if (currentStep < questions.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(nextStep);
        setIsAnimating(false);
      }, 300);
    } else {
      // Complete questionnaire
      console.log('📝 Questionnaire completed, clearing progress');
      progressHook.resetProgress();
      onComplete(answers as UserAnswers);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      progressHook.updateProgress(prevStep);
      
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prevStep);
        setIsAnimating(false);
      }, 300);
    }
  };

  const isAnswered = () => {
    const answer = answers[currentQuestion.id as keyof UserAnswers];
    if (Array.isArray(answer)) {
      return answer.length > 0;
    }
    return answer && answer.trim() !== '';
  };

  // Show loading until restored
  if (!isRestored) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mb-4"></div>
          <p className="text-white text-lg">Restoring your progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/80 text-sm">
              Question {currentStep + 1} of {questions.length}
              {userAnswersHook.userAnswers && (
                <span className="ml-2 text-green-400 text-xs">
                  ✅ Progress restored
                </span>
              )}
            </span>
            <span className="text-white/80 text-sm">{Math.round(progress)}% complete</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <motion.div
              className="bg-white h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
          </div>
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
            className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl"
          >
            <div className="mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {currentQuestion.title}
              </h2>
              <p className="text-white/80 text-lg">
                {currentQuestion.subtitle}
              </p>
            </div>

            <div className="mb-8">
              {currentQuestion.type === 'text' && (
                <input
                  type="text"
                  placeholder={currentQuestion.placeholder}
                  value={answers[currentQuestion.id as keyof UserAnswers] as string || ''}
                  onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                  className="w-full px-6 py-4 bg-white/10 border border-white/30 rounded-2xl text-white placeholder-white/60 text-lg focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                />
              )}

              {currentQuestion.type === 'textarea' && (
                <textarea
                  placeholder={currentQuestion.placeholder}
                  value={answers[currentQuestion.id as keyof UserAnswers] as string || ''}
                  onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                  rows={4}
                  className="w-full px-6 py-4 bg-white/10 border border-white/30 rounded-2xl text-white placeholder-white/60 text-lg focus:outline-none focus:ring-2 focus:ring-white/50 transition-all resize-none"
                />
              )}

              {currentQuestion.type === 'select' && (
                <div className="space-y-3">
                  {currentQuestion.options?.map((option) => (
                    <motion.button
                      key={option.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAnswer(currentQuestion.id, option.value)}
                      className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                        answers[currentQuestion.id as keyof UserAnswers] === option.value
                          ? 'bg-white/20 border-white/60 text-white'
                          : 'bg-white/5 border-white/20 text-white/80 hover:bg-white/10 hover:border-white/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-lg">{option.label}</div>
                          {option.description && (
                            <div className="text-sm opacity-70">{option.description}</div>
                          )}
                        </div>
                        {answers[currentQuestion.id as keyof UserAnswers] === option.value && (
                          <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                          </div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'multiselect' && (
                <div className="space-y-3">
                  {currentQuestion.options?.map((option) => {
                    const selectedSkills = answers[currentQuestion.id as keyof UserAnswers] as string[] || [];
                    const isSelected = selectedSkills.includes(option.value);
                    
                    return (
                      <motion.button
                        key={option.value}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          const currentAnswers = selectedSkills;
                          const newAnswers = isSelected
                            ? currentAnswers.filter(skill => skill !== option.value)
                            : [...currentAnswers, option.value];
                          handleAnswer(currentQuestion.id, newAnswers);
                        }}
                        className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                          isSelected
                            ? 'bg-white/20 border-white/60 text-white'
                            : 'bg-white/5 border-white/20 text-white/80 hover:bg-white/10 hover:border-white/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-lg">{option.label}</div>
                            {option.category && (
                              <div className="text-sm opacity-70">{option.category}</div>
                            )}
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'bg-white border-white' : 'border-white/40'
                          }`}>
                            {isSelected && (
                              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-4">
              {currentStep > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBack}
                  className="px-8 py-4 bg-white/10 border border-white/30 text-white rounded-2xl font-semibold hover:bg-white/20 transition-all"
                >
                  Back
                </motion.button>
              )}
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                disabled={!isAnswered()}
                className={`flex-1 px-8 py-4 rounded-2xl font-semibold transition-all ${
                  isAnswered()
                    ? 'bg-white text-purple-600 hover:bg-white/90'
                    : 'bg-white/20 text-white/60 cursor-not-allowed'
                }`}
              >
                {currentStep === questions.length - 1 ? 'Create My Portfolio 🚀' : 'Next'}
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}