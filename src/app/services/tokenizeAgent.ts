'use client';

import { PortfolioData } from './elizaAgent';
import { UserAnswers } from '../utils/localStorage';

export interface TokenSuggestion {
  id: string;
  serviceName: string;
  description: string;
  suggestedPricePerHour: number;
  suggestedTotalHours: number;
  suggestedValidityDays: number;
  reasoning: string;
  marketDemand: 'high' | 'medium' | 'low';
  competitiveness: number; // 1-10 scale
  estimatedRevenue: number;
  priority: 'high' | 'medium' | 'low';
  category: string;
  tags: string[];
}

export interface TokenizationPlan {
  totalServices: number;
  estimatedTotalRevenue: number;
  recommendedStartOrder: TokenSuggestion[];
  marketAnalysis: {
    totalPotentialMarket: number;
    averageHourlyRate: number;
    competitorCount: number;
    marketTrends: string[];
  };
  aiInsights: string[];
  riskFactors: string[];
  optimizationTips: string[];
}

export class TokenizeAgent {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async analyzePortfolioForTokenization(
    portfolioData: PortfolioData,
    userAnswers: UserAnswers
  ): Promise<TokenizationPlan> {
    try {
      console.log('🤖 TokenizeAgent: Analyzing portfolio for optimal tokenization...');

      const analysisPrompt = this.buildTokenizationPrompt(portfolioData, userAnswers);
      const response = await this.callGeminiAPI(analysisPrompt);
      
      const plan = this.parseTokenizationResponse(response);
      
      console.log('✅ TokenizeAgent: Analysis complete -', plan.totalServices, 'services identified');
      return plan;
    } catch (error) {
      console.error('❌ TokenizeAgent analysis failed:', error);
      return this.getFallbackTokenizationPlan(portfolioData, userAnswers);
    }
  }

  private buildTokenizationPrompt(portfolioData: PortfolioData, userAnswers: UserAnswers): string {
    // Safely handle potentially undefined data
    const services = portfolioData?.services || [];
    const userName = userAnswers?.name || 'User';
    const userExperience = userAnswers?.experience || 'intermediate';
    const userGoals = userAnswers?.goals || 'Professional growth';
    
    return `
You are TokenizeAgent, an AI specialized in analyzing professional portfolios and creating optimal time token strategies for blockchain-based service marketplaces.

PORTFOLIO ANALYSIS:
User: ${userName}
Experience: ${userExperience}
Goals: ${userGoals}

AI-Generated Portfolio:
${services.map(service => `
- ${service?.name || 'Service'}: ${service?.description || 'Professional service'}
  Skills: ${(service?.skills || []).join(', ')}
  Hourly Rate: $${service?.hourlyRate || 50}
  Market Demand: ${service?.marketDemand || 'medium'}
`).join('\n')}

TOKENIZATION MISSION:
1. Analyze each service for tokenization potential
2. Suggest optimal pricing, hours, and validity periods
3. Provide market-aware recommendations
4. Create a strategic launch order
5. Include revenue projections and risk assessment

RESPONSE FORMAT (JSON):
{
  "tokenSuggestions": [
    {
      "id": "unique-id",
      "serviceName": "Service Name",
      "description": "Clear service description",
      "suggestedPricePerHour": 150,
      "suggestedTotalHours": 40,
      "suggestedValidityDays": 90,
      "reasoning": "Why these parameters are optimal",
      "marketDemand": "high|medium|low",
      "competitiveness": 8,
      "estimatedRevenue": 6000,
      "priority": "high|medium|low",
      "category": "Service category",
      "tags": ["tag1", "tag2"]
    }
  ],
  "marketAnalysis": {
    "totalPotentialMarket": 50000,
    "averageHourlyRate": 125,
    "competitorCount": 15,
    "marketTrends": ["AI automation demand rising", "Remote work normalization"]
  },
  "aiInsights": [
    "Package consulting hours in 20-40 hour blocks for best conversion",
    "Price premium services 15-20% above market for exclusivity"
  ],
  "riskFactors": [
    "Market saturation in basic services",
    "Economic downturn affecting consulting budgets"
  ],
  "optimizationTips": [
    "Bundle complementary services for higher value",
    "Offer early-bird pricing for first 50 tokens"
  ]
}

Focus on creating 3-5 high-quality token suggestions that maximize revenue while maintaining market competitiveness. Consider seasonality, market trends, and the user's experience level.
    `;
  }

  private async callGeminiAPI(prompt: string): Promise<string> {
    console.log('🔑 TokenizeAgent calling Gemini API with key length:', this.apiKey?.length);
    
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + this.apiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    });

    console.log('📡 Gemini API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API error details:', errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Gemini API response received');
    return data.candidates[0].content.parts[0].text;
  }

  private parseTokenizationResponse(response: string): TokenizationPlan {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Transform to our TokenizationPlan structure
      const plan: TokenizationPlan = {
        totalServices: parsed.tokenSuggestions?.length || 0,
        estimatedTotalRevenue: parsed.tokenSuggestions?.reduce((sum: number, token: any) => sum + (token.estimatedRevenue || 0), 0) || 0,
        recommendedStartOrder: parsed.tokenSuggestions?.sort((a: any, b: any) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
        }) || [],
        marketAnalysis: parsed.marketAnalysis || {
          totalPotentialMarket: 25000,
          averageHourlyRate: 100,
          competitorCount: 10,
          marketTrends: ['Remote work growth', 'AI integration demand']
        },
        aiInsights: parsed.aiInsights || ['Focus on high-value services first'],
        riskFactors: parsed.riskFactors || ['Market competition'],
        optimizationTips: parsed.optimizationTips || ['Test pricing with small batches']
      };

      return plan;
    } catch (error) {
      console.error('❌ Failed to parse tokenization response:', error);
      throw error;
    }
  }

  private getFallbackTokenizationPlan(portfolioData: PortfolioData, userAnswers: UserAnswers): TokenizationPlan {
    console.log('🔄 Using fallback tokenization plan...');
    
    // Safely handle potentially undefined services
    const services = portfolioData?.services || [];
    const fallbackSuggestions: TokenSuggestion[] = services.slice(0, 3).map((service, index) => ({
      id: `fallback-${index}`,
      serviceName: service?.name || `Service ${index + 1}`,
      description: service?.description || 'Professional service offering',
      suggestedPricePerHour: Math.round((service?.hourlyRate || 50) * 0.9), // 10% discount for tokens
      suggestedTotalHours: 20,
      suggestedValidityDays: 60,
      reasoning: `Based on ${service?.marketDemand || 'medium'} market demand and competitive hourly rate of $${service?.hourlyRate || 50}`,
      marketDemand: (service?.marketDemand as 'high' | 'medium' | 'low') || 'medium',
      competitiveness: 7,
      estimatedRevenue: Math.round((service?.hourlyRate || 50) * 0.9 * 20),
      priority: index === 0 ? 'high' : index === 1 ? 'medium' : 'low',
      category: (service?.skills && service.skills[0]) || 'Professional Services',
      tags: (service?.skills || ['Professional']).slice(0, 3)
    }));

    // If no services exist, create default ones
    if (fallbackSuggestions.length === 0) {
      fallbackSuggestions.push({
        id: 'default-1',
        serviceName: 'Consultation Service',
        description: 'Professional consultation and advisory services',
        suggestedPricePerHour: 75,
        suggestedTotalHours: 20,
        suggestedValidityDays: 60,
        reasoning: 'Standard consultation service based on market rates',
        marketDemand: 'medium',
        competitiveness: 7,
        estimatedRevenue: 1500,
        priority: 'high',
        category: 'Consulting',
        tags: ['Consulting', 'Advisory', 'Strategy']
      });
    }

    return {
      totalServices: fallbackSuggestions.length,
      estimatedTotalRevenue: fallbackSuggestions.reduce((sum, token) => sum + token.estimatedRevenue, 0),
      recommendedStartOrder: fallbackSuggestions,
      marketAnalysis: {
        totalPotentialMarket: 30000,
        averageHourlyRate: 85,
        competitorCount: 12,
        marketTrends: ['Digital transformation', 'Remote collaboration tools']
      },
      aiInsights: [
        'Start with your highest-demand service for best initial traction',
        'Price tokens 10-15% below hourly rate to encourage bulk purchases'
      ],
      riskFactors: [
        'Limited market data available',
        'Economic uncertainty affecting service demand'
      ],
      optimizationTips: [
        'Monitor token performance and adjust pricing',
        'Gather user feedback to refine service offerings'
      ]
    };
  }

  // Utility method to calculate token economics
  static calculateTokenEconomics(suggestion: TokenSuggestion) {
    const totalValue = suggestion.suggestedPricePerHour * suggestion.suggestedTotalHours;
    const discountFromHourly = ((100 - suggestion.suggestedPricePerHour) / 100) * suggestion.suggestedTotalHours;
    const breakEvenHours = Math.ceil(totalValue / suggestion.suggestedPricePerHour);
    
    return {
      totalTokenValue: totalValue,
      discountOffered: discountFromHourly,
      breakEvenPoint: breakEvenHours,
      profitMargin: (suggestion.estimatedRevenue / totalValue) * 100,
      dailyUtilization: suggestion.suggestedTotalHours / suggestion.suggestedValidityDays
    };
  }

  // Method to suggest optimal token pricing based on market conditions
  static suggestPricingStrategy(marketDemand: 'high' | 'medium' | 'low', hourlyRate: number) {
    const strategies = {
      high: {
        discountPercent: 5, // Minimal discount for high demand
        bulkMultiplier: 1.1,
        validityDays: 45 // Shorter validity for urgency
      },
      medium: {
        discountPercent: 10, // Moderate discount
        bulkMultiplier: 1.0,
        validityDays: 60
      },
      low: {
        discountPercent: 15, // Higher discount to attract buyers
        bulkMultiplier: 0.9,
        validityDays: 90 // Longer validity for flexibility
      }
    };

    const strategy = strategies[marketDemand];
    const tokenPrice = Math.round(hourlyRate * (100 - strategy.discountPercent) / 100);
    
    return {
      suggestedTokenPrice: tokenPrice,
      discountFromHourly: strategy.discountPercent,
      recommendedValidity: strategy.validityDays,
      bulkPricingMultiplier: strategy.bulkMultiplier
    };
  }
}

export default TokenizeAgent;