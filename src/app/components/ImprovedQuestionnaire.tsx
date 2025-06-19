'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuestionnaireProgress, useUserAnswers } from '../hooks/useLocalStorage';
import { UserAnswers } from '../utils/localStorage';

interface QuestionnaireProps {
  onComplete: (answers: UserAnswers) => void;
}

// Improved questions with better organization and help text
const questions = [
  {
    id: 'name',
    title: 'What should we call you?',
    subtitle: 'Your professional name or how you\'d like to be addressed',
    helpText: 'This will be shown on your time tokens and profile',
    type: 'text',
    placeholder: 'Enter your name...',
    estimatedTime: 30,
  },
  {
    id: 'experience',
    title: 'What\'s your experience level?',
    subtitle: 'This helps us match you with the right opportunities',
    helpText: 'Choose the level that best represents your overall professional experience',
    type: 'select',
    estimatedTime: 30,
    options: [
      { value: 'beginner', label: '🌱 Beginner (0-2 years)', description: 'Just starting out, learning the basics' },
      { value: 'intermediate', label: '🚀 Intermediate (2-5 years)', description: 'Growing expertise, can work independently' },
      { value: 'advanced', label: '⭐ Advanced (5-10 years)', description: 'Solid experience, can lead projects' },
      { value: 'expert', label: '🏆 Expert (10+ years)', description: 'Industry veteran, strategic thinking' },
    ],
  },
  {
    id: 'skills',
    title: 'What are your superpowers?',
    subtitle: 'Select all the skills you\'re confident in',
    helpText: 'Choose skills where you can deliver professional-quality work. You can always add more later.',
    type: 'multiselect',
    estimatedTime: 90,
    searchable: true,
    groupedOptions: {
      'Development': [
        { value: 'frontend', label: '🎨 Frontend Development', description: 'React, Vue, Angular, HTML/CSS' },
        { value: 'backend', label: '⚙️ Backend Development', description: 'Node.js, Python, Java, databases' },
        { value: 'fullstack', label: '🔧 Full Stack Development', description: 'End-to-end web development' },
        { value: 'mobile', label: '📱 Mobile Development', description: 'iOS, Android, React Native, Flutter' },
        { value: 'ai', label: '🤖 AI/Machine Learning', description: 'ML models, data science, AI integration' },
        { value: 'blockchain', label: '⛓️ Blockchain/Web3', description: 'Smart contracts, DeFi, crypto' },
        { value: 'devops', label: '🔧 DevOps/Infrastructure', description: 'AWS, Docker, CI/CD, cloud platforms' },
      ],
      'Design': [
        { value: 'design', label: '🎭 UI/UX Design', description: 'User interface and experience design' },
        { value: 'graphics', label: '🖌️ Graphic Design', description: 'Visual design, branding, illustrations' },
        { value: 'product', label: '📐 Product Design', description: 'User research, prototyping, design strategy' },
      ],
      'Marketing': [
        { value: 'marketing', label: '📈 Digital Marketing', description: 'SEO, SEM, social media, analytics' },
        { value: 'content', label: '✍️ Content Creation', description: 'Writing, video, social media content' },
        { value: 'copywriting', label: '📝 Copywriting', description: 'Sales copy, email marketing, ads' },
      ],
      'Business': [
        { value: 'consulting', label: '💡 Business Consulting', description: 'Strategy, operations, growth advice' },
        { value: 'project', label: '📋 Project Management', description: 'Agile, Scrum, team coordination' },
        { value: 'sales', label: '💼 Sales & Business Development', description: 'Lead generation, closing deals' },
      ],
    },
  },
  {
    id: 'timeAvailable',
    title: 'How much time can you tokenize?',
    subtitle: 'Be realistic about your availability',
    helpText: 'This helps us suggest optimal token configurations. You can adjust this anytime.',
    type: 'select',
    estimatedTime: 30,
    options: [
      { value: '5-10', label: '⏰ 5-10 hours/week', description: 'Side hustle mode - perfect for extra income' },
      { value: '10-20', label: '⏱️ 10-20 hours/week', description: 'Part-time commitment - serious side work' },
      { value: '20-30', label: '⏲️ 20-30 hours/week', description: 'Serious engagement - significant income potential' },
      { value: '30+', label: '⏳ 30+ hours/week', description: 'Full-time dedication - primary income source' },
    ],
  },
  {
    id: 'goals',
    title: 'What\'s your ultimate goal?',
    subtitle: 'This helps us understand your motivation',
    helpText: 'Share what success looks like for you. This helps our AI create better strategies.',
    type: 'textarea',
    placeholder: 'I want to build my skills, earn extra income, work on exciting projects, gain financial freedom...',
    estimatedTime: 60,
    examples: [
      'Build a steady side income while keeping my day job',
      'Transition to freelancing full-time within 6 months',
      'Work on cutting-edge AI projects and expand my network',
      'Achieve financial independence through my expertise',
    ],
  },
  {
    id: 'preferredProjects',
    title: 'What type of projects excite you?',
    subtitle: 'Choose the ones that make you curious',
    helpText: 'This helps us match you with projects you\'ll actually enjoy working on.',
    type: 'multiselect',
    estimatedTime: 60,
    groupedOptions: {
      'Technology': [
        { value: 'startup', label: '🚀 Startup Projects', description: 'Early-stage companies, fast-paced environment' },
        { value: 'ai', label: '🤖 AI/ML Projects', description: 'Cutting-edge AI applications and research' },
        { value: 'blockchain', label: '⛓️ Blockchain/Crypto', description: 'DeFi, NFTs, Web3 applications' },
        { value: 'fintech', label: '💰 Financial Technology', description: 'Banking, payments, investment platforms' },
      ],
      'Business': [
        { value: 'enterprise', label: '🏢 Enterprise Solutions', description: 'Large company projects, established processes' },
        { value: 'ecommerce', label: '🛒 E-commerce Solutions', description: 'Online stores, marketplaces, retail tech' },
        { value: 'saas', label: '☁️ SaaS Platforms', description: 'Software as a service, subscription models' },
      ],
      'Impact': [
        { value: 'nonprofit', label: '❤️ Non-profit/Social Impact', description: 'Make a positive difference in the world' },
        { value: 'education', label: '📚 Educational Platforms', description: 'EdTech, online learning, skill development' },
        { value: 'healthcare', label: '🏥 Healthcare Innovation', description: 'HealthTech, telemedicine, wellness apps' },
      ],
      'Creative': [
        { value: 'creative', label: '🎨 Creative/Art Projects', description: 'Design, media, entertainment projects' },
        { value: 'gaming', label: '🎮 Gaming/Entertainment', description: 'Game development, streaming, digital media' },
        { value: 'media', label: '📺 Media & Content', description: 'Publishing, journalism, video production' },
      ],
    },
  },
  {
    id: 'hourlyRate',
    title: 'What\'s your time worth?',
    subtitle: 'Set your hourly rate in USD (you can always adjust this later)',
    helpText: 'Based on your experience and skills, we\'ll suggest an optimal range. Start conservatively and increase as you build reputation.',
    type: 'select',
    estimatedTime: 45,
    options: [
      { value: '10-25', label: '💵 $10-25/hour', description: 'Getting started - building your reputation' },
      { value: '25-50', label: '💰 $25-50/hour', description: 'Intermediate level - proven skills' },
      { value: '50-100', label: '💎 $50-100/hour', description: 'Experienced professional - specialized expertise' },
      { value: '100+', label: '🏆 $100+/hour', description: 'Premium expertise - high-value specialist' },
    ],
  },
];

// Skill search component
const SkillSearch = ({ 
  onFilter, 
  placeholder = "Search skills..." 
}: { 
  onFilter: (query: string) => void;
  placeholder?: string;
}) => {
  const [query, setQuery] = useState('');

  const handleSearch = (value: string) => {
    setQuery(value);
    onFilter(value);
  };

  return (
    <div className="relative mb-4">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black transition-all"
        placeholder={placeholder}
      />
    </div>
  );
};

// Progress overview component
const ProgressOverview = ({ 
  currentStep, 
  totalSteps, 
  estimatedTimeRemaining 
}: { 
  currentStep: number; 
  totalSteps: number; 
  estimatedTimeRemaining: number;
}) => {
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.ceil(seconds / 60);
    return `${minutes}m`;
  };

  return (
    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <span className="text-blue-700 font-medium">
          Question {currentStep + 1} of {totalSteps}
        </span>
        <span className="text-blue-600 text-sm">
          ⏱️ ~{formatTime(estimatedTimeRemaining)} remaining
        </span>
      </div>
      <div className="w-full bg-blue-200 rounded-full h-2">
        <motion.div
          className="bg-blue-600 h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
      </div>
      <p className="text-blue-600 text-xs mt-2">
        Your answers help our AI create a personalized tokenization strategy
      </p>
    </div>
  );
};

// Grouped multiselect component
const GroupedMultiSelect = ({ 
  question, 
  selectedValues, 
  onSelectionChange 
}: {
  question: any;
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  // Filter options based on search
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return question.groupedOptions;

    const filtered: any = {};
    Object.entries(question.groupedOptions).forEach(([group, options]: [string, any]) => {
      const matchingOptions = options.filter((option: any) =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        option.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (matchingOptions.length > 0) {
        filtered[group] = matchingOptions;
      }
    });
    return filtered;
  }, [question.groupedOptions, searchQuery]);

  // Auto-expand groups with search results
  useEffect(() => {
    if (searchQuery) {
      setExpandedGroups(Object.keys(filteredGroups));
    } else {
      setExpandedGroups([]);
    }
  }, [searchQuery, filteredGroups]);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev =>
      prev.includes(group)
        ? prev.filter(g => g !== group)
        : [...prev, group]
    );
  };

  const toggleOption = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onSelectionChange(newValues);
  };

  return (
    <div className="space-y-4">
      {question.searchable && (
        <SkillSearch
          onFilter={setSearchQuery}
          placeholder="Search skills (e.g., React, Python, Design)..."
        />
      )}

      {selectedValues.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Selected skills ({selectedValues.length}):
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedValues.map(value => {
              // Find the option label
              let optionLabel = value;
              Object.values(question.groupedOptions).forEach((options: any) => {
                const option = options.find((opt: any) => opt.value === value);
                if (option) optionLabel = option.label;
              });
              
              return (
                <span
                  key={value}
                  className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                >
                  {optionLabel}
                  <button
                    onClick={() => toggleOption(value)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {Object.entries(filteredGroups).map(([group, options]: [string, any]) => (
          <div key={group} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleGroup(group)}
              className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex justify-between items-center text-left"
            >
              <span className="font-medium text-gray-800">{group}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {options.filter((opt: any) => selectedValues.includes(opt.value)).length}/{options.length}
                </span>
                <motion.div
                  animate={{ rotate: expandedGroups.includes(group) ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.div>
              </div>
            </button>
            
            <AnimatePresence>
              {expandedGroups.includes(group) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 space-y-2 bg-white">
                    {options.map((option: any) => {
                      const isSelected = selectedValues.includes(option.value);
                      return (
                        <motion.button
                          key={option.value}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => toggleOption(option.value)}
                          className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                            isSelected
                              ? 'bg-blue-50 border-blue-500 text-blue-900'
                              : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-base">{option.label}</div>
                              <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ml-3 ${
                              isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-400'
                            }`}>
                              {isSelected && (
                                <div className="w-3 h-3 rounded-full bg-white"></div>
                              )}
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function ImprovedQuestionnaire({ onComplete }: QuestionnaireProps) {
  const progressHook = useQuestionnaireProgress();
  const userAnswersHook = useUserAnswers();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<UserAnswers>>({});
  const [isAnimating, setIsAnimating] = useState(false);
  const [isRestored, setIsRestored] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Calculate total estimated time remaining
  const estimatedTimeRemaining = useMemo(() => {
    return questions.slice(currentStep).reduce((total, q) => total + (q.estimatedTime || 60), 0);
  }, [currentStep]);

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
      userAnswersHook.saveAnswers(updatedAnswers as UserAnswers);
    }
  };

  const handleNext = () => {
    if (!isAnswered()) return;
    
    const nextStep = currentStep + 1;
    progressHook.updateProgress(nextStep);
    
    if (currentStep < questions.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(nextStep);
        setIsAnimating(false);
        setShowHelp(false); // Reset help state for new question
      }, 300);
    } else {
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
        setShowHelp(false);
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

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isAnswered() && currentQuestion.type !== 'textarea') {
      e.preventDefault();
      handleNext();
    }
  };

  // Show loading until restored
  if (!isRestored) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-black mb-4"></div>
          <p className="text-black text-lg">Restoring your progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Progress Overview */}
        <ProgressOverview
          currentStep={currentStep}
          totalSteps={questions.length}
          estimatedTimeRemaining={estimatedTimeRemaining}
        />

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-50 border border-gray-200 rounded-xl p-8"
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            {/* Question Header */}
            <div className="mb-8">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-3xl md:text-4xl font-bold text-black pr-4">
                  {currentQuestion.title}
                </h2>
                <button
                  onClick={() => setShowHelp(!showHelp)}
                  className="flex-shrink-0 w-8 h-8 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full flex items-center justify-center transition-colors"
                  title="Show help"
                >
                  ?
                </button>
              </div>
              
              <p className="text-gray-600 text-lg mb-2">
                {currentQuestion.subtitle}
              </p>
              
              <AnimatePresence>
                {showHelp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3"
                  >
                    <p className="text-blue-800 text-sm">{currentQuestion.helpText}</p>
                    
                    {currentQuestion.examples && (
                      <div className="mt-3">
                        <p className="text-blue-700 text-xs font-medium mb-2">Examples:</p>
                        <ul className="space-y-1">
                          {currentQuestion.examples.map((example: string, i: number) => (
                            <li key={i} className="text-blue-600 text-xs">• {example}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              
              <p className="text-gray-400 text-sm mt-2">
                {currentQuestion.type === 'text' && "Press Enter to continue"}
                {currentQuestion.type === 'textarea' && "Press Ctrl/Cmd + Enter to continue"}
                {(currentQuestion.type === 'select' || currentQuestion.type === 'multiselect') && "Select your answer(s) then click Next"}
              </p>
            </div>

            {/* Question Input */}
            <div className="mb-8">
              {currentQuestion.type === 'text' && (
                <input
                  type="text"
                  placeholder={currentQuestion.placeholder}
                  value={answers[currentQuestion.id as keyof UserAnswers] as string || ''}
                  onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full px-6 py-4 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-500 text-lg focus:outline-none focus:ring-2 focus:ring-black transition-all"
                  autoFocus
                />
              )}

              {currentQuestion.type === 'textarea' && (
                <textarea
                  placeholder={currentQuestion.placeholder}
                  value={answers[currentQuestion.id as keyof UserAnswers] as string || ''}
                  onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && isAnswered()) {
                      e.preventDefault();
                      handleNext();
                    }
                  }}
                  rows={4}
                  className="w-full px-6 py-4 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-500 text-lg focus:outline-none focus:ring-2 focus:ring-black transition-all resize-none"
                  autoFocus
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
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        answers[currentQuestion.id as keyof UserAnswers] === option.value
                          ? 'bg-blue-50 border-blue-500 text-blue-900'
                          : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-lg">{option.label}</div>
                          {option.description && (
                            <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                          )}
                        </div>
                        {answers[currentQuestion.id as keyof UserAnswers] === option.value && (
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center ml-4">
                            <div className="w-3 h-3 rounded-full bg-white"></div>
                          </div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'multiselect' && currentQuestion.groupedOptions && (
                <GroupedMultiSelect
                  question={currentQuestion}
                  selectedValues={answers[currentQuestion.id as keyof UserAnswers] as string[] || []}
                  onSelectionChange={(values) => handleAnswer(currentQuestion.id, values)}
                />
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-4">
              {currentStep > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBack}
                  className="px-8 py-4 bg-gray-100 border border-gray-300 text-black rounded-lg font-semibold hover:bg-gray-200 transition-all"
                >
                  ← Back
                </motion.button>
              )}
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                disabled={!isAnswered()}
                className={`flex-1 px-8 py-4 rounded-lg font-semibold transition-all ${
                  isAnswered()
                    ? 'bg-black text-white hover:bg-gray-800'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-300'
                }`}
              >
                {currentStep === questions.length - 1 ? (
                  '🚀 Create My Portfolio'
                ) : (
                  `Next (${questions.length - currentStep - 1} more)`
                )}
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}