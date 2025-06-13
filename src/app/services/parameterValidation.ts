'use client';

import { TokenSuggestion } from './tokenizeAgent';

// Interface for createTimeToken parameters
export interface CreateTokenParams {
  creator?: string; // Will be set by wallet
  serviceName: string;
  pricePerHour: number; // uint256 in wei
  totalHours: number; // uint256
  validityDays: number; // uint256
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingParams: string[];
  suggestions: CreateTokenParams | null;
}

export interface ParameterGap {
  field: string;
  required: boolean;
  currentValue: any;
  suggestedValue?: any;
  prompt: string;
  validation: (value: any) => boolean;
}

export class ParameterValidationService {
  
  // Validate if all required parameters for createTimeToken are present and valid
  static validateTokenCreation(params: Partial<CreateTokenParams>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingParams: string[] = [];
    
    // Required parameter validation
    if (!params.serviceName || params.serviceName.trim() === '') {
      missingParams.push('serviceName');
      errors.push('Service name is required');
    } else if (params.serviceName.length > 100) {
      warnings.push('Service name is quite long, consider shortening for better display');
    }

    if (params.pricePerHour === undefined || params.pricePerHour === null) {
      missingParams.push('pricePerHour');
      errors.push('Price per hour is required');
    } else if (params.pricePerHour <= 0) {
      errors.push('Price per hour must be greater than 0');
    } else if (params.pricePerHour > 10000) {
      warnings.push('Price per hour is very high ($10,000+), consider if this aligns with market rates');
    }

    if (params.totalHours === undefined || params.totalHours === null) {
      missingParams.push('totalHours');
      errors.push('Total hours is required');
    } else if (params.totalHours <= 0) {
      errors.push('Total hours must be greater than 0');
    } else if (params.totalHours > 1000) {
      warnings.push('Total hours is very high (1000+), consider breaking into smaller tokens');
    }

    if (params.validityDays === undefined || params.validityDays === null) {
      missingParams.push('validityDays');
      errors.push('Validity period is required');
    } else if (params.validityDays <= 0) {
      errors.push('Validity period must be greater than 0 days');
    } else if (params.validityDays > 365) {
      warnings.push('Validity period is longer than 1 year, consider shorter periods for urgency');
    } else if (params.validityDays < 7) {
      warnings.push('Very short validity period may reduce buyer interest');
    }

    // Business logic validation
    if (params.pricePerHour && params.totalHours && params.validityDays) {
      const totalValue = params.pricePerHour * params.totalHours;
      const dailyWorkRequired = params.totalHours / params.validityDays;
      
      if (dailyWorkRequired > 16) {
        warnings.push(`This token requires ${dailyWorkRequired.toFixed(1)} hours/day of work, which may be unrealistic`);
      }
      
      if (totalValue > 100000) {
        warnings.push(`Total token value is $${totalValue.toLocaleString()}, consider if this aligns with your target market`);
      }
    }

    return {
      isValid: errors.length === 0 && missingParams.length === 0,
      errors,
      warnings,
      missingParams,
      suggestions: this.generateSuggestions(params)
    };
  }

  // Convert TokenSuggestion to CreateTokenParams
  static tokenSuggestionToParams(suggestion: TokenSuggestion): CreateTokenParams {
    return {
      serviceName: suggestion.serviceName,
      pricePerHour: suggestion.suggestedPricePerHour,
      totalHours: Math.round(suggestion.suggestedTotalHours),
      validityDays: Math.round(suggestion.suggestedValidityDays)
    };
  }

  // Identify specific parameter gaps and create prompts for missing data
  static identifyParameterGaps(params: Partial<CreateTokenParams>): ParameterGap[] {
    const gaps: ParameterGap[] = [];

    if (!params.serviceName || params.serviceName.trim() === '') {
      gaps.push({
        field: 'serviceName',
        required: true,
        currentValue: params.serviceName,
        prompt: 'What service will you provide? (e.g., "Frontend Development", "Business Consulting")',
        validation: (value: string) => value && value.trim().length > 0 && value.length <= 100
      });
    }

    if (params.pricePerHour === undefined || params.pricePerHour === null || params.pricePerHour <= 0) {
      gaps.push({
        field: 'pricePerHour',
        required: true,
        currentValue: params.pricePerHour,
        suggestedValue: 75, // Default suggestion
        prompt: 'What is your hourly rate in USD? (e.g., 75)',
        validation: (value: number) => value > 0 && value <= 10000
      });
    }

    if (params.totalHours === undefined || params.totalHours === null || params.totalHours <= 0) {
      gaps.push({
        field: 'totalHours',
        required: true,
        currentValue: params.totalHours,
        suggestedValue: 20, // Default suggestion
        prompt: 'How many total hours will this token represent? (e.g., 20)',
        validation: (value: number) => value > 0 && value <= 1000
      });
    }

    if (params.validityDays === undefined || params.validityDays === null || params.validityDays <= 0) {
      gaps.push({
        field: 'validityDays',
        required: true,
        currentValue: params.validityDays,
        suggestedValue: 60, // Default suggestion
        prompt: 'How many days should this token be valid? (e.g., 60)',
        validation: (value: number) => value > 0 && value <= 365
      });
    }

    return gaps;
  }

  // Generate intelligent suggestions for missing parameters
  private static generateSuggestions(params: Partial<CreateTokenParams>): CreateTokenParams | null {
    // If we have some params, try to suggest reasonable defaults for missing ones
    const suggestions: CreateTokenParams = {
      serviceName: params.serviceName || 'Professional Service',
      pricePerHour: params.pricePerHour || 75,
      totalHours: params.totalHours || 20,
      validityDays: params.validityDays || 60
    };

    // Adjust suggestions based on existing values
    if (params.pricePerHour && !params.totalHours) {
      // Suggest hours based on common package sizes
      if (params.pricePerHour < 50) {
        suggestions.totalHours = 40; // More hours for lower rates
      } else if (params.pricePerHour > 150) {
        suggestions.totalHours = 10; // Fewer hours for premium rates
      }
    }

    if (params.totalHours && !params.validityDays) {
      // Suggest validity based on hours
      if (params.totalHours > 40) {
        suggestions.validityDays = 90; // Longer validity for more hours
      } else if (params.totalHours < 10) {
        suggestions.validityDays = 30; // Shorter validity for fewer hours
      }
    }

    return suggestions;
  }

  // Validate individual parameter types and ranges
  static validateParameter(field: string, value: any): { isValid: boolean; error?: string; suggestion?: any } {
    switch (field) {
      case 'serviceName':
        if (typeof value !== 'string') {
          return { isValid: false, error: 'Service name must be text' };
        }
        if (value.trim().length === 0) {
          return { isValid: false, error: 'Service name cannot be empty' };
        }
        if (value.length > 100) {
          return { isValid: false, error: 'Service name must be 100 characters or less' };
        }
        return { isValid: true };

      case 'pricePerHour':
        const price = Number(value);
        if (isNaN(price)) {
          return { isValid: false, error: 'Price must be a valid number' };
        }
        if (price <= 0) {
          return { isValid: false, error: 'Price must be greater than 0' };
        }
        if (price > 10000) {
          return { isValid: false, error: 'Price seems unrealistically high', suggestion: 500 };
        }
        return { isValid: true };

      case 'totalHours':
        const hours = Number(value);
        if (isNaN(hours)) {
          return { isValid: false, error: 'Hours must be a valid number' };
        }
        if (hours <= 0) {
          return { isValid: false, error: 'Hours must be greater than 0' };
        }
        if (hours > 1000) {
          return { isValid: false, error: 'Hours seems unrealistically high', suggestion: 40 };
        }
        if (hours !== Math.floor(hours)) {
          return { isValid: false, error: 'Hours must be a whole number' };
        }
        return { isValid: true };

      case 'validityDays':
        const days = Number(value);
        if (isNaN(days)) {
          return { isValid: false, error: 'Validity must be a valid number' };
        }
        if (days <= 0) {
          return { isValid: false, error: 'Validity must be greater than 0 days' };
        }
        if (days > 365) {
          return { isValid: false, error: 'Validity should not exceed 1 year', suggestion: 180 };
        }
        if (days !== Math.floor(days)) {
          return { isValid: false, error: 'Validity must be a whole number of days' };
        }
        return { isValid: true };

      default:
        return { isValid: false, error: 'Unknown parameter' };
    }
  }

  // Calculate token economics and provide insights
  static calculateTokenInsights(params: CreateTokenParams) {
    const totalValue = params.pricePerHour * params.totalHours;
    const dailyValue = totalValue / params.validityDays;
    const hoursPerDay = params.totalHours / params.validityDays;
    
    return {
      totalValue,
      dailyValue,
      hoursPerDay,
      insights: [
        `Total token value: $${totalValue.toLocaleString()}`,
        `Daily value if used consistently: $${dailyValue.toFixed(2)}`,
        `Average hours per day: ${hoursPerDay.toFixed(1)}`,
        hoursPerDay > 8 ? 'High daily commitment required' : 'Manageable daily workload',
        totalValue > 5000 ? 'High-value token - ensure strong portfolio' : 'Moderate-value token'
      ]
    };
  }
}

export default ParameterValidationService;