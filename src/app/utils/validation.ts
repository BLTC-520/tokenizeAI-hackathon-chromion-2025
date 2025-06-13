'use client';

import { handleError } from './errorHandling';

// Validation result type
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Input validation schemas
export interface TokenCreationValidation {
  serviceName: string;
  pricePerHour: number;
  totalHours: number;
  validityDays: number;
}

export interface UserAnswersValidation {
  name: string;
  experience: string;
  skills: string[];
  timeAvailable: string;
  goals: string;
  preferredProjects: string[];
  hourlyRate: string;
}

export interface WalletValidation {
  address: string;
  chainId: number;
}

export class ValidationService {
  private static instance: ValidationService;

  private constructor() {}

  static getInstance(): ValidationService {
    if (!ValidationService.instance) {
      ValidationService.instance = new ValidationService();
    }
    return ValidationService.instance;
  }

  // Validate token creation parameters
  validateTokenCreation(params: TokenCreationValidation): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Service name validation
      if (!params.serviceName || params.serviceName.trim().length === 0) {
        errors.push('Service name is required');
      } else if (params.serviceName.length < 3) {
        errors.push('Service name must be at least 3 characters long');
      } else if (params.serviceName.length > 100) {
        errors.push('Service name must be less than 100 characters');
      }

      // Price validation
      if (!params.pricePerHour || params.pricePerHour <= 0) {
        errors.push('Price per hour must be greater than 0');
      } else if (params.pricePerHour < 1) {
        warnings.push('Price is very low - consider market rates');
      } else if (params.pricePerHour > 1000) {
        warnings.push('Price is very high - this may limit buyers');
      }

      // Hours validation
      if (!params.totalHours || params.totalHours <= 0) {
        errors.push('Total hours must be greater than 0');
      } else if (params.totalHours < 1) {
        errors.push('Minimum 1 hour required');
      } else if (params.totalHours > 1000) {
        warnings.push('Very high hour count - consider splitting into multiple tokens');
      }

      // Validity period validation
      if (!params.validityDays || params.validityDays <= 0) {
        errors.push('Validity period must be greater than 0');
      } else if (params.validityDays < 7) {
        warnings.push('Short validity period may pressure buyers');
      } else if (params.validityDays > 365) {
        warnings.push('Long validity period reduces urgency');
      }

      // Cross-field validation
      const dailyUtilization = params.totalHours / params.validityDays;
      if (dailyUtilization > 8) {
        warnings.push('Daily utilization exceeds 8 hours - may be unrealistic');
      }

      const totalValue = params.pricePerHour * params.totalHours;
      if (totalValue > 50000) {
        warnings.push('Very high token value - consider breaking into smaller tokens');
      }

    } catch (error) {
      handleError(error, { component: 'ValidationService', action: 'validateTokenCreation' });
      errors.push('Validation failed due to system error');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Validate user answers from questionnaire
  validateUserAnswers(answers: UserAnswersValidation): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Name validation
      if (!answers.name || answers.name.trim().length === 0) {
        errors.push('Name is required');
      } else if (answers.name.length < 2) {
        errors.push('Name must be at least 2 characters');
      } else if (answers.name.length > 50) {
        errors.push('Name must be less than 50 characters');
      }

      // Experience validation
      const validExperience = ['beginner', 'intermediate', 'advanced', 'expert'];
      if (!answers.experience || !validExperience.includes(answers.experience)) {
        errors.push('Please select a valid experience level');
      }

      // Skills validation
      if (!answers.skills || answers.skills.length === 0) {
        errors.push('At least one skill is required');
      } else if (answers.skills.length > 10) {
        warnings.push('Many skills selected - consider focusing on top strengths');
      }

      // Time availability validation
      const validTimeRanges = ['5-10', '10-20', '20-30', '30+'];
      if (!answers.timeAvailable || !validTimeRanges.includes(answers.timeAvailable)) {
        errors.push('Please select a valid time availability range');
      }

      // Goals validation
      if (!answers.goals || answers.goals.trim().length === 0) {
        errors.push('Goals description is required');
      } else if (answers.goals.length < 10) {
        warnings.push('Goals description is quite short - more detail helps AI generate better portfolios');
      } else if (answers.goals.length > 500) {
        errors.push('Goals description must be less than 500 characters');
      }

      // Preferred projects validation
      if (!answers.preferredProjects || answers.preferredProjects.length === 0) {
        warnings.push('No preferred project types selected - this may limit matching');
      }

      // Hourly rate validation
      const validRateRanges = ['10-25', '25-50', '50-100', '100+'];
      if (!answers.hourlyRate || !validRateRanges.includes(answers.hourlyRate)) {
        errors.push('Please select a valid hourly rate range');
      }

    } catch (error) {
      handleError(error, { component: 'ValidationService', action: 'validateUserAnswers' });
      errors.push('Validation failed due to system error');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Validate wallet connection
  validateWallet(wallet: WalletValidation): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Address validation
      if (!wallet.address) {
        errors.push('Wallet address is required');
      } else if (!this.isValidEthereumAddress(wallet.address)) {
        errors.push('Invalid Ethereum address format');
      }

      // Chain validation
      if (!wallet.chainId) {
        errors.push('Chain ID is required');
      } else {
        const supportedChains = [43113, 11155111, 84532]; // Avalanche Fuji, Ethereum Sepolia, Base Sepolia
        if (!supportedChains.includes(wallet.chainId)) {
          errors.push('Unsupported blockchain network');
        }
      }

    } catch (error) {
      handleError(error, { component: 'ValidationService', action: 'validateWallet' });
      errors.push('Wallet validation failed');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Validate email address
  validateEmail(email: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!email || email.trim().length === 0) {
      errors.push('Email address is required');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push('Invalid email address format');
      } else if (email.length > 254) {
        errors.push('Email address is too long');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Validate transaction hash
  validateTransactionHash(hash: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!hash) {
      errors.push('Transaction hash is required');
    } else if (!hash.startsWith('0x')) {
      errors.push('Transaction hash must start with 0x');
    } else if (hash.length !== 66) {
      errors.push('Transaction hash must be 66 characters long');
    } else if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) {
      errors.push('Transaction hash contains invalid characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Validate positive number
  validatePositiveNumber(value: any, fieldName: string, options: {
    min?: number;
    max?: number;
    allowDecimals?: boolean;
  } = {}): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const { min = 0, max, allowDecimals = true } = options;

    if (value === undefined || value === null || value === '') {
      errors.push(`${fieldName} is required`);
    } else {
      const numValue = Number(value);
      
      if (isNaN(numValue)) {
        errors.push(`${fieldName} must be a valid number`);
      } else {
        if (!allowDecimals && !Number.isInteger(numValue)) {
          errors.push(`${fieldName} must be a whole number`);
        }
        
        if (numValue <= min) {
          errors.push(`${fieldName} must be greater than ${min}`);
        }
        
        if (max !== undefined && numValue > max) {
          errors.push(`${fieldName} must not exceed ${max}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Validate string input
  validateString(value: string, fieldName: string, options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    patternMessage?: string;
  } = {}): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const { required = true, minLength, maxLength, pattern, patternMessage } = options;

    if (!value || value.trim().length === 0) {
      if (required) {
        errors.push(`${fieldName} is required`);
      }
    } else {
      const trimmedValue = value.trim();
      
      if (minLength !== undefined && trimmedValue.length < minLength) {
        errors.push(`${fieldName} must be at least ${minLength} characters long`);
      }
      
      if (maxLength !== undefined && trimmedValue.length > maxLength) {
        errors.push(`${fieldName} must be no more than ${maxLength} characters long`);
      }
      
      if (pattern && !pattern.test(trimmedValue)) {
        errors.push(patternMessage || `${fieldName} format is invalid`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Helper: Check if string is valid Ethereum address
  private isValidEthereumAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  // Sanitize input strings
  sanitizeString(input: string, options: {
    removeHtml?: boolean;
    maxLength?: number;
    allowedChars?: string;
  } = {}): string {
    const { removeHtml = true, maxLength, allowedChars } = options;
    
    let sanitized = input.trim();
    
    // Remove HTML tags
    if (removeHtml) {
      sanitized = sanitized.replace(/<[^>]*>/g, '');
    }
    
    // Limit length
    if (maxLength && sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }
    
    // Filter allowed characters
    if (allowedChars) {
      const allowedRegex = new RegExp(`[^${allowedChars}]`, 'g');
      sanitized = sanitized.replace(allowedRegex, '');
    }
    
    return sanitized;
  }

  // Batch validation for multiple fields
  validateBatch(validations: (() => ValidationResult)[]): ValidationResult {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];
    
    for (const validation of validations) {
      try {
        const result = validation();
        allErrors.push(...result.errors);
        allWarnings.push(...result.warnings);
      } catch (error) {
        handleError(error, { component: 'ValidationService', action: 'validateBatch' });
        allErrors.push('Validation failed for one or more fields');
      }
    }
    
    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    };
  }
}

// Global validation service instance
export const validationService = ValidationService.getInstance();

// Convenience functions
export const validateTokenCreation = (params: TokenCreationValidation): ValidationResult => {
  return validationService.validateTokenCreation(params);
};

export const validateUserAnswers = (answers: UserAnswersValidation): ValidationResult => {
  return validationService.validateUserAnswers(answers);
};

export const validateWallet = (wallet: WalletValidation): ValidationResult => {
  return validationService.validateWallet(wallet);
};

export const validateEmail = (email: string): ValidationResult => {
  return validationService.validateEmail(email);
};

export const sanitizeInput = (input: string, options?: any): string => {
  return validationService.sanitizeString(input, options);
};

export default ValidationService;