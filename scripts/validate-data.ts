#!/usr/bin/env ts-node
/**
 * Data Validation Script
 * 
 * Run this script to validate the mobile phone dataset quality.
 * Usage: npx ts-node scripts/validate-data.ts
 */

import { printValidationReport } from '../src/lib/utils/data-validator';

console.log('🔍 Running PhonePixie Data Validation...\n');

try {
  printValidationReport();
  console.log('✅ Validation complete!');
  process.exit(0);
} catch (error) {
  console.error('❌ Validation failed:', error);
  process.exit(1);
}

