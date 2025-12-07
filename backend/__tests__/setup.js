/**
 * Jest Setup File
 * Runs before all tests
 */

// Suppress console logs during tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   warn: jest.fn()
// };

// Set test timeout
jest.setTimeout(10000);

// Mock environment variables if needed
process.env.NODE_ENV = 'test';
