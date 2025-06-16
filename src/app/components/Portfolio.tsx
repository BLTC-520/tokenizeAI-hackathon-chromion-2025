'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { PortfolioData } from '../services/elizaAgent';
import { marketAnalyzeAgent, MarketAnalysisResult } from '../services/marketAnalyzeAgent';
import { GETSKILLPRICE_CONTRACT_ADDRESS } from '../../../constants';

interface UserAnswers {
  name: string;
  experience: string;
  skills: string[];
  timeAvailable: string;
  goals: string;
  preferredProjects: string[];
  hourlyRate: string;
}

interface PortfolioProps {
  userAnswers: UserAnswers;
  portfolioData: PortfolioData;
  onProceedToTokenization?: () => void;
}

const skillIcons: { [key: string]: string } = {
  frontend: '🎨',
  backend: '⚙️',
  fullstack: '🔧',
  mobile: '📱',
  ai: '🤖',
  blockchain: '⛓️',
  design: '🎭',
  graphics: '🖌️',
  marketing: '📈',
  content: '✍️',
  consulting: '💡',
  project: '📋',
};

const projectIcons: { [key: string]: string } = {
  startup: '🚀',
  enterprise: '🏢',
  nonprofit: '❤️',
  creative: '🎨',
  education: '📚',
  fintech: '💰',
  healthcare: '🏥',
  gaming: '🎮',
  ecommerce: '🛒',
  blockchain: '⛓️',
};

export default function Portfolio({ userAnswers, portfolioData, onProceedToTokenization }: PortfolioProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [marketAnalysis, setMarketAnalysis] = useState<MarketAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const calculateWeeklyEarnings = () => {
    const timeMap: { [key: string]: number } = {
      '5-10': 7.5,
      '10-20': 15,
      '20-30': 25,
      '30+': 35,
    };
    
    const rateMap: { [key: string]: number } = {
      '10-25': 17.5,
      '25-50': 37.5,
      '50-100': 75,
      '100+': 125,
    };
    
    const hours = timeMap[userAnswers.timeAvailable] || 15;
    const rate = rateMap[userAnswers.hourlyRate] || 37.5;
    
    return Math.round(hours * rate);
  };

  const calculateMonthlyEarnings = () => {
    return calculateWeeklyEarnings() * 4.33;
  };

  const calculateCompatibilityScore = () => {
    let score = 70; // base score
    
    // Add points for diverse skills
    score += Math.min(userAnswers.skills.length * 3, 20);
    
    // Add points for experience
    if (userAnswers.experience === 'expert') score += 10;
    else if (userAnswers.experience === 'advanced') score += 7;
    else if (userAnswers.experience === 'intermediate') score += 5;
    
    // Add points for clear goals
    if (userAnswers.goals.length > 50) score += 5;
    
    return Math.min(score, 98);
  };

  const generateRecommendedProjects = () => {
    const projects = [
      { name: 'DeFi Trading Platform', match: '94%', budget: '$15,000', duration: '6 weeks' },
      { name: 'AI-Powered Content Creator', match: '89%', budget: '$8,500', duration: '4 weeks' },
      { name: 'Mobile Fitness App', match: '87%', budget: '$12,000', duration: '8 weeks' },
      { name: 'NFT Marketplace', match: '85%', budget: '$20,000', duration: '10 weeks' },
    ];
    
    return projects.slice(0, 3);
  };

  const generateSkillAssessment = () => {
    return userAnswers.skills.map(skill => ({
      skill,
      level: Math.floor(Math.random() * 30) + 70, // 70-100%
      demand: Math.floor(Math.random() * 20) + 80, // 80-100%
    }));
  };

  const generateTimeOptimization = () => {
    const tips = [
      'Focus on blockchain projects - they offer 40% higher rates',
      'Consider full-stack roles to maximize your skill utilization',
      'AI/ML projects in your area show strong growth potential',
      'Weekend projects can boost earnings by 25%',
    ];
    
    return tips.slice(0, 2);
  };

  // Use ElizaOS-generated data or fallback to calculated values
  const insights = {
    weeklyEarnings: portfolioData.earningsProjection?.weekly || calculateWeeklyEarnings(),
    monthlyEarnings: portfolioData.earningsProjection?.monthly || calculateMonthlyEarnings(),
    compatibilityScore: calculateCompatibilityScore(),
    recommendedProjects: portfolioData.projectRecommendations || generateRecommendedProjects(),
    skillAssessment: portfolioData.skillAssessment || generateSkillAssessment(),
    timeOptimization: portfolioData.earningsProjection?.optimizationTips || generateTimeOptimization(),
  };

  // Market Analysis function
  const handleMarketAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      console.log('🔍 Starting market analysis...');
      
      // Fetch Chainlink data from GetSkillPrice.sol contract
      const chainlinkData = await marketAnalyzeAgent.fetchChainlinkData(
        GETSKILLPRICE_CONTRACT_ADDRESS, 
        userAnswers.skills
      );
      
      // Perform market analysis
      const analysis = await marketAnalyzeAgent.analyzeMarket(userAnswers.skills, chainlinkData);
      setMarketAnalysis(analysis);
      setActiveTab('market');
      
      console.log('✅ Market analysis completed');
    } catch (error) {
      console.error('❌ Market analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const tabs = [
    { id: 'overview', label: '📊 Overview', icon: '📊' },
    { id: 'projects', label: '🚀 Projects', icon: '🚀' },
    { id: 'skills', label: '⭐ Skills', icon: '⭐' },
    { id: 'market', label: '📈 Market Analysis', icon: '📈' },
    { id: 'earnings', label: '💰 Earnings', icon: '💰' },
  ];

  return (
    <div className="min-h-screen p-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="mb-8">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              {userAnswers.name}'s Time Portfolio
            </h1>
            <p className="text-white/80 text-xl">
              Generated by ElizaOS Portfolio Maker Agent 🤖
            </p>
          </div>
          
          {/* Compatibility Score */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="inline-block bg-gradient-to-r from-green-400 to-blue-500 rounded-full px-8 py-4"
          >
            <span className="text-white font-bold text-2xl">
              {insights.compatibilityScore}% Portfolio Match Score
            </span>
          </motion.div>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-2 border border-white/20">
            <div className="flex space-x-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-purple-600'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Profile Summary */}
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 col-span-full lg:col-span-2">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  👤 Profile Summary
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-white/80 font-semibold">Experience Level</h3>
                    <p className="text-white text-lg capitalize">{userAnswers.experience}</p>
                  </div>
                  <div>
                    <h3 className="text-white/80 font-semibold">Time Available</h3>
                    <p className="text-white text-lg">{userAnswers.timeAvailable} hours/week</p>
                  </div>
                  <div>
                    <h3 className="text-white/80 font-semibold">Hourly Rate</h3>
                    <p className="text-white text-lg">${userAnswers.hourlyRate}/hour</p>
                  </div>
                  <div>
                    <h3 className="text-white/80 font-semibold">Skills Count</h3>
                    <p className="text-white text-lg">{userAnswers.skills.length} core skills</p>
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-white/80 font-semibold mb-2">
                    {portfolioData.profileSummary ? 'AI-Generated Profile Summary' : 'Goals'}
                  </h3>
                  <p className="text-white">
                    {portfolioData.profileSummary || userAnswers.goals}
                  </p>
                  {portfolioData.profileSummary && (
                    <div className="mt-3 text-xs text-green-400 flex items-center">
                      🤖 Generated by ElizaOS Portfolio Maker Agent
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-green-500/20 to-green-700/20 backdrop-blur-lg rounded-3xl p-6 border border-green-500/30">
                  <h3 className="text-green-400 font-bold text-lg mb-2">Weekly Earnings</h3>
                  <p className="text-white text-3xl font-bold">${insights.weeklyEarnings.toLocaleString()}</p>
                </div>
                
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-700/20 backdrop-blur-lg rounded-3xl p-6 border border-blue-500/30">
                  <h3 className="text-blue-400 font-bold text-lg mb-2">Monthly Earnings</h3>
                  <p className="text-white text-3xl font-bold">${insights.monthlyEarnings.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-4">
                  🚀 Recommended Projects
                </h2>
                {portfolioData.projectRecommendations && (
                  <div className="text-green-400 text-sm flex items-center justify-center">
                    🤖 AI-curated projects based on your profile analysis
                  </div>
                )}
              </div>
              
              {insights.recommendedProjects.map((project, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">{project.name}</h3>
                      <div className="flex items-center space-x-4 text-white/80">
                        <span>💰 Budget: {project.budget}</span>
                        <span>⏱️ Duration: {project.duration}</span>
                      </div>
                    </div>
                    <div className="bg-green-500 text-white px-4 py-2 rounded-full font-bold">
                      {project.match} Match
                    </div>
                  </div>
                  
                  <button className="bg-white text-purple-600 px-6 py-3 rounded-2xl font-semibold hover:bg-white/90 transition-all">
                    Apply Now
                  </button>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'skills' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-4">
                  ⭐ Skill Assessment
                </h2>
                {portfolioData.skillAssessment && (
                  <div className="text-green-400 text-sm flex items-center justify-center">
                    🤖 AI-powered skill analysis with market insights
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {insights.skillAssessment.map((skillData, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20"
                  >
                    <div className="flex items-center mb-4">
                      <span className="text-3xl mr-3">{skillIcons[skillData.skill] || '🔧'}</span>
                      <h3 className="text-xl font-bold text-white capitalize">
                        {skillData.skill.replace(/([A-Z])/g, ' $1').trim()}
                      </h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-white/80 mb-1">
                          <span>Proficiency</span>
                          <span>{skillData.level}%</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${skillData.level}%` }}
                            transition={{ delay: 0.5 + index * 0.1, duration: 1 }}
                            className="bg-gradient-to-r from-purple-400 to-blue-500 h-2 rounded-full"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-white/80 mb-1">
                          <span>Market Demand</span>
                          <span>{skillData.demand}%</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${skillData.demand}%` }}
                            transition={{ delay: 0.7 + index * 0.1, duration: 1 }}
                            className="bg-gradient-to-r from-green-400 to-yellow-500 h-2 rounded-full"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'market' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-4">
                  📈 Market Analysis
                </h2>
                <p className="text-white/80 mb-6">
                  AI-powered market analysis with real-time skill pricing data
                </p>
                
                {!marketAnalysis ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleMarketAnalysis}
                    disabled={isAnalyzing}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl transition-all disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                        Analyzing Market...
                      </div>
                    ) : (
                      '🔍 Start Market Analysis'
                    )}
                  </motion.button>
                ) : (
                  <div className="space-y-6">
                    {/* Market Summary */}
                    <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
                      <h3 className="text-2xl font-bold text-white mb-4">📊 Market Summary</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-green-500/20 rounded-xl p-4">
                          <h4 className="text-green-400 font-semibold mb-2">Top Paying Skills</h4>
                          <div className="space-y-1">
                            {marketAnalysis.marketSummary.topPayingSkills.map((skill, idx) => (
                              <div key={idx} className="text-white text-sm">{skill}</div>
                            ))}
                          </div>
                        </div>
                        <div className="bg-blue-500/20 rounded-xl p-4">
                          <h4 className="text-blue-400 font-semibold mb-2">Emerging Skills</h4>
                          <div className="space-y-1">
                            {marketAnalysis.marketSummary.emergingSkills.map((skill, idx) => (
                              <div key={idx} className="text-white text-sm">{skill}</div>
                            ))}
                          </div>
                        </div>
                        <div className="bg-yellow-500/20 rounded-xl p-4">
                          <h4 className="text-yellow-400 font-semibold mb-2">Market Hotspots</h4>
                          <div className="space-y-1">
                            {marketAnalysis.marketSummary.marketHotspots.map((region, idx) => (
                              <div key={idx} className="text-white text-sm">{region}</div>
                            ))}
                          </div>
                        </div>
                        <div className="bg-red-500/20 rounded-xl p-4">
                          <h4 className="text-red-400 font-semibold mb-2">Oversaturated</h4>
                          <div className="space-y-1">
                            {marketAnalysis.marketSummary.oversaturatedSkills.length > 0 ? (
                              marketAnalysis.marketSummary.oversaturatedSkills.map((skill, idx) => (
                                <div key={idx} className="text-white text-sm">{skill}</div>
                              ))
                            ) : (
                              <div className="text-white text-sm">None identified</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Skill Analysis */}
                    <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
                      <h3 className="text-2xl font-bold text-white mb-6">💰 Skill Pricing Analysis</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {marketAnalysis.skillAnalysis.map((skill, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white/5 rounded-xl p-4 border border-white/10"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <h4 className="text-lg font-semibold text-white capitalize">{skill.skill}</h4>
                              <span className="text-2xl">{skillIcons[skill.skill] || '💼'}</span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-white/70">Avg. Rate:</span>
                                <span className="text-green-400 font-bold">${skill.averageHourlyRate}/hr</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-white/70">Demand:</span>
                                <span className={`font-semibold ${
                                  skill.demandLevel === 'very_high' ? 'text-red-400' :
                                  skill.demandLevel === 'high' ? 'text-orange-400' :
                                  skill.demandLevel === 'medium' ? 'text-yellow-400' : 'text-gray-400'
                                }`}>
                                  {skill.demandLevel.replace('_', ' ').toUpperCase()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-white/70">Trend:</span>
                                <span className={`font-semibold ${
                                  skill.marketTrend === 'surging' ? 'text-green-400' :
                                  skill.marketTrend === 'growing' ? 'text-blue-400' :
                                  skill.marketTrend === 'stable' ? 'text-yellow-400' : 'text-red-400'
                                }`}>
                                  {skill.marketTrend.toUpperCase()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-white/70">Competition:</span>
                                <span className="text-white">{skill.competitionLevel}/10</span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
                      <h3 className="text-2xl font-bold text-white mb-6">🎯 Strategic Recommendations</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-lg font-semibold text-green-400 mb-3">Short Term (1-3 months)</h4>
                          <ul className="space-y-2">
                            {marketAnalysis.recommendations.shortTerm.map((rec, idx) => (
                              <li key={idx} className="text-white flex items-start">
                                <span className="text-green-400 mr-2">•</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-blue-400 mb-3">Medium Term (3-6 months)</h4>
                          <ul className="space-y-2">
                            {marketAnalysis.recommendations.mediumTerm.map((rec, idx) => (
                              <li key={idx} className="text-white flex items-start">
                                <span className="text-blue-400 mr-2">•</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-purple-400 mb-3">Long Term (6-12 months)</h4>
                          <ul className="space-y-2">
                            {marketAnalysis.recommendations.longTerm.map((rec, idx) => (
                              <li key={idx} className="text-white flex items-start">
                                <span className="text-purple-400 mr-2">•</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-yellow-400 mb-3">Rate Optimization</h4>
                          <ul className="space-y-2">
                            {marketAnalysis.recommendations.rateOptimization.map((rec, idx) => (
                              <li key={idx} className="text-white flex items-start">
                                <span className="text-yellow-400 mr-2">•</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Market Insights */}
                    <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
                      <h3 className="text-2xl font-bold text-white mb-6">💡 Market Insights</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-green-500/10 rounded-xl p-4">
                          <h4 className="text-green-400 font-semibold mb-3">🚀 Opportunities</h4>
                          <ul className="space-y-2">
                            {marketAnalysis.insights.marketOpportunities.map((opp, idx) => (
                              <li key={idx} className="text-white text-sm">• {opp}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-red-500/10 rounded-xl p-4">
                          <h4 className="text-red-400 font-semibold mb-3">⚠️ Threats</h4>
                          <ul className="space-y-2">
                            {marketAnalysis.insights.threatAnalysis.map((threat, idx) => (
                              <li key={idx} className="text-white text-sm">• {threat}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-blue-500/10 rounded-xl p-4">
                          <h4 className="text-blue-400 font-semibold mb-3">💪 Advantages</h4>
                          <ul className="space-y-2">
                            {marketAnalysis.insights.competitiveAdvantages.map((adv, idx) => (
                              <li key={idx} className="text-white text-sm">• {adv}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {marketAnalysis.chainlinkData && (
                      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
                        <h3 className="text-2xl font-bold text-white mb-4">⛓️ Chainlink Data</h3>
                        <div className="text-green-400 text-sm mb-4">
                          🤖 Real-time data from GetSkillPrice.sol contract
                        </div>
                        <pre className="bg-black/20 rounded-xl p-4 text-white text-sm overflow-x-auto">
                          {JSON.stringify(marketAnalysis.chainlinkData, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'earnings' && (
            <div className="space-y-8">
              <h2 className="text-3xl font-bold text-white mb-8 text-center">
                💰 Earnings Optimization
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-green-500/20 to-green-700/20 backdrop-blur-lg rounded-3xl p-8 border border-green-500/30">
                  <h3 className="text-green-400 font-bold text-2xl mb-4">Weekly</h3>
                  <p className="text-white text-4xl font-bold mb-2">${insights.weeklyEarnings.toLocaleString()}</p>
                  <p className="text-green-300">Based on current rate & availability</p>
                </div>
                
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-700/20 backdrop-blur-lg rounded-3xl p-8 border border-blue-500/30">
                  <h3 className="text-blue-400 font-bold text-2xl mb-4">Monthly</h3>
                  <p className="text-white text-4xl font-bold mb-2">${insights.monthlyEarnings.toLocaleString()}</p>
                  <p className="text-blue-300">Consistent project engagement</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-700/20 backdrop-blur-lg rounded-3xl p-8 border border-purple-500/30">
                  <h3 className="text-purple-400 font-bold text-2xl mb-4">Yearly</h3>
                  <p className="text-white text-4xl font-bold mb-2">${(insights.monthlyEarnings * 12).toLocaleString()}</p>
                  <p className="text-purple-300">Full tokenization potential</p>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
                <h3 className="text-2xl font-bold text-white mb-6">💡 AI Optimization Tips</h3>
                <div className="space-y-4">
                  {insights.timeOptimization.map((tip, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.3 }}
                      className="flex items-center p-4 bg-white/5 rounded-2xl border border-white/10"
                    >
                      <span className="text-2xl mr-4">💡</span>
                      <p className="text-white text-lg">{tip}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              {/* Tokenization CTA */}
              {onProceedToTokenization && (
                <div className="mt-8 text-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onProceedToTokenization}
                    className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl transition-all"
                  >
                    🚀 Start Tokenizing Your Time
                  </motion.button>
                  <p className="text-white/70 text-sm mt-2">
                    Transform your portfolio into tradeable time tokens
                  </p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}