/**
 * MMS MongoDB Schema Validator
 * Professional validation toolkit for healthcare member management schemas
 */
import Joi from 'joi';
import { MongoClient } from 'mongodb';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';

export class MMSSchemaValidator {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      issues: []
    };
  }

  /**
   * Comprehensive member document schema validation
   */
  createMemberSchema() {
    return Joi.object({
      _id: Joi.string().required().description('Stable enterprise member ID'),
      
      // Basic member info with proper types
      mbr_change_status: Joi.string().valid('active', 'inactive', 'pending').required(),
      program_year: Joi.number().integer().min(2020).max(2030).required(),
      sex: Joi.string().valid('M', 'F', 'U').required(),
      member_dob: Joi.date().iso().required().description('Date object, not string'),
      is_deceased: Joi.boolean().required(),
      
      // Identifiers
      member_identifiers: Joi.object({
        mbrid: Joi.string().required(),
        mcid: Joi.string().optional(),
        hic: Joi.string().optional(),
        client_subscriber_id: Joi.string().optional()
      }).required(),
      
      // Structured name
      name: Joi.object({
        member_first_name: Joi.string().required(),
        member_last_name: Joi.string().required(),
        member_mi: Joi.string().max(1).optional()
      }).required(),
      
      // Address with validation
      address: Joi.object({
        phone: Joi.string().pattern(/^[\d\-\(\)\s\+]+$/).optional(),
        member_address_line_1: Joi.string().required(),
        member_address_line_2: Joi.string().optional(),
        city: Joi.string().required(),
        state: Joi.string().length(2).required(),
        zip: Joi.string().pattern(/^\\d{5}(-\\d{4})?$/).required()
      }).required(),
      
      // Client info
      client: Joi.object({
        client_id: Joi.string().required(),
        client_name: Joi.string().required(),
        sub_cli_sk: Joi.number().integer().optional()
      }).required(),
      
      // Provider references with snapshots
      assigned_provider: Joi.object({
        provider_id: Joi.string().required(),
        provider_state: Joi.string().length(2).required(),
        snapshot: Joi.object({
          providerName: Joi.string().required(),
          npi: Joi.string().length(10).required(),
          providerCity: Joi.string().required(),
          providerState: Joi.string().length(2).required()
        }).optional(),
        as_of: Joi.date().iso().required()
      }).optional(),
      
      rendered_provider: Joi.object({
        provider_id: Joi.string().required(),
        provider_state: Joi.string().length(2).required()
      }).optional(),
      
      preferred_provider: Joi.object({
        provider_id: Joi.string().required(),
        provider_state: Joi.string().length(2).required()
      }).optional(),
      
      // Payment info with proper decimals
      payment: Joi.object({
        max_eligible_pmt: Joi.number().precision(2).min(0).optional(),
        return_perct: Joi.number().precision(4).min(0).max(1).optional(),
        // Note: In real MongoDB, these should be NumberDecimal
      }).optional(),
      
      // Engagement tier with dates
      engagement_tier: Joi.object({
        eng_tier: Joi.string().valid('Gold', 'Silver', 'Bronze').required(),
        eng_tier_start: Joi.date().iso().required(),
        eng_tier_end: Joi.date().iso().required()
      }).optional(),
      
      // Bounded arrays only - large lists moved to separate collections
      measures: Joi.array().items(
        Joi.object({
          program: Joi.string().required(),
          codes: Joi.array().items(Joi.string()).max(20).required()
        })
      ).max(5).optional(),
      
      // Audit fields as proper dates
      created_at: Joi.date().iso().required(),
      updated_at: Joi.date().iso().required()
    });
  }

  /**
   * Provider details schema validation
   */
  createProviderSchema() {
    return Joi.object({
      _id: Joi.string().required().description('Provider ID or NPI if unique'),
      
      identifiers: Joi.object({
        npi: Joi.string().length(10).required(),
        taxId: Joi.string().optional(),
        mpin: Joi.string().optional()
      }).required(),
      
      name: Joi.object({
        first: Joi.string().optional(),
        middle: Joi.string().optional(),
        last: Joi.string().optional(),
        full: Joi.string().required()
      }).required(),
      
      type: Joi.string().valid('PCP', 'Specialist', 'Facility').required(),
      
      contact: Joi.object({
        phone: Joi.string().optional(),
        address: Joi.object({
          line1: Joi.string().required(),
          line2: Joi.string().optional(),
          city: Joi.string().required(),
          state: Joi.string().length(2).required(),
          zip: Joi.string().pattern(/^\\d{5}(-\\d{4})?$/).required()
        }).required()
      }).required(),
      
      specialties: Joi.array().items(
        Joi.object({
          code: Joi.string().required(),
          desc: Joi.string().required()
        })
      ).optional(),
      
      status: Joi.object({
        active: Joi.boolean().required(),
        cms_preclusion: Joi.boolean().required()
      }).required(),
      
      created_at: Joi.date().iso().required(),
      updated_at: Joi.date().iso().required()
    });
  }

  /**
   * Validate a member document
   */
  async validateMember(memberDoc) {
    const schema = this.createMemberSchema();
    const { error, value, warning } = schema.validate(memberDoc, { 
      abortEarly: false,
      allowUnknown: true 
    });
    
    const result = {
      isValid: !error,
      document: memberDoc._id || 'unknown',
      type: 'member',
      errors: error ? error.details : [],
      warnings: []
    };
    
    // Custom business logic validations
    this.validateBusinessRules(memberDoc, result);
    
    return result;
  }

  /**
   * Validate a provider document
   */
  async validateProvider(providerDoc) {
    const schema = this.createProviderSchema();
    const { error } = schema.validate(providerDoc, { abortEarly: false });
    
    return {
      isValid: !error,
      document: providerDoc._id || 'unknown',
      type: 'provider',
      errors: error ? error.details : [],
      warnings: []
    };
  }

  /**
   * Custom business rule validations
   */
  validateBusinessRules(doc, result) {
    // Check for string dates (should be Date objects)
    this.checkDateTypes(doc, result);
    
    // Check for string money amounts (should be NumberDecimal)
    this.checkMoneyTypes(doc, result);
    
    // Check for unbounded arrays
    this.checkUnboundedArrays(doc, result);
    
    // Check for missing provider snapshots
    this.checkProviderSnapshots(doc, result);
  }

  checkDateTypes(doc, result) {
    const dateFields = ['member_dob', 'mcare_elig_date', 'created_at', 'updated_at'];
    
    dateFields.forEach(field => {
      const value = this.getNestedValue(doc, field);
      if (value && typeof value === 'string') {
        result.warnings.push({
          field,
          message: `Date field '${field}' is stored as string. Should be Date object for better queries and sorting.`,
          severity: 'high'
        });
      }
    });
  }

  checkMoneyTypes(doc, result) {
    if (doc.payment) {
      ['max_eligible_pmt', 'return_perct'].forEach(field => {
        const value = doc.payment[field];
        if (value && typeof value === 'string') {
          result.warnings.push({
            field: `payment.${field}`,
            message: `Money field '${field}' is stored as string. Should be NumberDecimal for exact calculations.`,
            severity: 'high'
          });
        }
      });
    }
  }

  checkUnboundedArrays(doc, result) {
    const arrayFields = ['incentivePrograms', 'deployments', 'member_submissions', 'specialistDetails'];
    
    arrayFields.forEach(field => {
      const value = doc[field];
      if (Array.isArray(value) && value.length > 10) {
        result.warnings.push({
          field,
          message: `Array field '${field}' has ${value.length} items. Consider moving to separate collection to avoid unbounded growth.`,
          severity: 'medium'
        });
      }
    });
  }

  checkProviderSnapshots(doc, result) {
    ['assigned_provider', 'rendered_provider', 'preferred_provider'].forEach(providerField => {
      const provider = doc[providerField];
      if (provider && provider.provider_id && !provider.snapshot) {
        result.warnings.push({
          field: providerField,
          message: `Provider reference missing snapshot. Add denormalized provider data for faster reads.`,
          severity: 'medium'
        });
      }
    });
  }

  /**
   * Get nested object value safely
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Validate documents from file or database
   */
  async validateFromFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const docs = JSON.parse(content);
      const documents = Array.isArray(docs) ? docs : [docs];
      
      const results = [];
      for (const doc of documents) {
        const result = await this.validateMember(doc);
        results.push(result);
        
        if (result.isValid) {
          this.results.passed++;
        } else {
          this.results.failed++;
        }
        
        this.results.warnings += result.warnings.length;
      }
      
      return results;
    } catch (error) {
      throw new Error(`Error reading file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Generate validation report
   */
  generateReport(results) {
    console.log(chalk.blue.bold('\\n🏥 MMS Schema Validation Report'));
    console.log(chalk.blue('=====================================\\n'));
    
    // Summary
    console.log(chalk.green(`✅ Passed: ${this.results.passed}`));
    console.log(chalk.red(`❌ Failed: ${this.results.failed}`));
    console.log(chalk.yellow(`⚠️  Warnings: ${this.results.warnings}`));
    console.log();
    
    // Detailed results
    results.forEach((result, index) => {
      const status = result.isValid ? chalk.green('✅ VALID') : chalk.red('❌ INVALID');
      console.log(`${status} Document ${index + 1}: ${result.document} (${result.type})`);
      
      if (result.errors.length > 0) {
        console.log(chalk.red('  Errors:'));
        result.errors.forEach(error => {
          console.log(chalk.red(`    • ${error.path || error.context?.key}: ${error.message}`));
        });
      }
      
      if (result.warnings.length > 0) {
        console.log(chalk.yellow('  Warnings:'));
        result.warnings.forEach(warning => {
          const severity = warning.severity === 'high' ? '🔥' : '⚠️';
          console.log(chalk.yellow(`    ${severity} ${warning.field}: ${warning.message}`));
        });
      }
      
      console.log();
    });
    
    // Recommendations
    if (this.results.warnings > 0) {
      console.log(chalk.cyan.bold('📋 Recommendations:'));
      console.log(chalk.cyan('• Convert string dates to Date objects'));
      console.log(chalk.cyan('• Use NumberDecimal for money amounts'));
      console.log(chalk.cyan('• Move large arrays to separate collections'));
      console.log(chalk.cyan('• Add provider snapshots for faster reads'));
      console.log();
    }
  }
}

// CLI Usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new MMSSchemaValidator();
  
  const filePath = process.argv[2] || 'current.json';
  
  console.log(chalk.blue(`🔍 Validating schema from: ${filePath}`));
  
  try {
    const results = await validator.validateFromFile(filePath);
    validator.generateReport(results);
    
    process.exit(validator.results.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error(chalk.red(`❌ Validation failed: ${error.message}`));
    process.exit(1);
  }
}