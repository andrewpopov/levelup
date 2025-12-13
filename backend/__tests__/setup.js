/**
 * Jest Setup File
 * Runs before all tests
 */

import { jest as jestLib } from '@jest/globals';

// Make jest available globally for ES modules
global.jest = jestLib;

// Set test timeout
global.jest.setTimeout(10000);

// Mock environment variables if needed
process.env.NODE_ENV = 'test';

// Suppress console logs during tests (optional)
// global.console = {
//   ...console,
//   log: global.jest.fn(),
//   warn: global.jest.fn()
// };
