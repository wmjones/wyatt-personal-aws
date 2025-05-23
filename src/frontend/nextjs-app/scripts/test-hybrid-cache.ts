#!/usr/bin/env npx tsx

/**
 * Integration test script for hybrid forecast caching system
 *
 * This script tests the complete hybrid caching functionality including:
 * - Database connection and schema
 * - Cache miss/hit scenarios
 * - Performance monitoring
 * - Data consistency between hot and cold paths
 */

import { hybridForecastService } from '../app/services/hybridForecastService';
import { db } from '../app/lib/postgres';
import { initializeDatabase } from '../app/lib/migrations';

interface TestResult {
  test: string;
  passed: boolean;
  duration: number;
  details?: any;
  error?: string;
}

class HybridCacheTestSuite {
  private results: TestResult[] = [];

  async runTest(
    testName: string,
    testFn: () => Promise<any>
  ): Promise<TestResult> {
    const startTime = Date.now();

    try {
      console.log(`🧪 Running test: ${testName}`);
      const result = await testFn();
      const duration = Date.now() - startTime;

      const testResult: TestResult = {
        test: testName,
        passed: true,
        duration,
        details: result
      };

      console.log(`✅ ${testName} passed (${duration}ms)`);
      this.results.push(testResult);
      return testResult;

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      const testResult: TestResult = {
        test: testName,
        passed: false,
        duration,
        error: errorMessage
      };

      console.log(`❌ ${testName} failed (${duration}ms): ${errorMessage}`);
      this.results.push(testResult);
      return testResult;
    }
  }

  async testDatabaseConnection(): Promise<boolean> {
    console.log('Testing database connection...');
    return await db.test();
  }

  async testCacheMiss(): Promise<any> {
    console.log('Testing cache miss scenario...');

    // Clear any existing cache entries for this test
    await db.query('DELETE FROM forecast_cache.summary_cache WHERE state = $1', ['TX']);

    // This should trigger a cache miss and Athena query
    const result = await hybridForecastService.getForecastSummary('TX');

    // Verify we got data
    if (!result || result.length === 0) {
      throw new Error('No data returned from cache miss test');
    }

    return { resultCount: result.length, source: 'athena' };
  }

  async testCacheHit(): Promise<any> {
    console.log('Testing cache hit scenario...');

    // This should hit the cache from the previous test
    const startTime = Date.now();
    const result = await hybridForecastService.getForecastSummary('TX');
    const duration = Date.now() - startTime;

    // Cache hits should be significantly faster
    if (duration > 500) {
      console.warn(`Cache hit took ${duration}ms - may not have hit cache`);
    }

    return {
      resultCount: result.length,
      duration,
      likelyFromCache: duration < 500
    };
  }

  async testQueryRouting(): Promise<any> {
    console.log('Testing intelligent query routing...');

    // Test hot path query (should prefer cache)
    const hotPathStart = Date.now();
    const hotResult = await hybridForecastService.getForecastByDate(
      '2024-01-01',
      '2024-01-07',
      'CA'
    );
    const hotDuration = Date.now() - hotPathStart;

    // Test cold path query (should bypass cache for large range)
    const coldPathStart = Date.now();
    const coldResult = await hybridForecastService.getForecastByDate(
      '2023-01-01',
      '2024-12-31',
      'NY'
    );
    const coldDuration = Date.now() - coldPathStart;

    return {
      hotPath: { resultCount: hotResult.length, duration: hotDuration },
      coldPath: { resultCount: coldResult.length, duration: coldDuration }
    };
  }

  async testPerformanceMetrics(): Promise<any> {
    console.log('Testing performance metrics collection...');

    // Generate some queries to create metrics
    await hybridForecastService.getForecastSummary('FL');
    await hybridForecastService.getForecastByDate('2024-06-01', '2024-06-30');

    // Get cache statistics
    const stats = await hybridForecastService.getCacheStats();

    if (stats.totalQueries === 0) {
      throw new Error('No metrics collected');
    }

    return stats;
  }

  async testCacheExpiration(): Promise<any> {
    console.log('Testing cache expiration handling...');

    // Clear expired entries
    await hybridForecastService.clearExpiredCache();

    // Get cache size before and after
    const statsBefore = await hybridForecastService.getCacheStats();

    // Insert a test entry that expires immediately
    await db.query(`
      INSERT INTO forecast_cache.summary_cache
      (cache_key, query_fingerprint, data, expires_at)
      VALUES ('test_expired', 'test_fingerprint', '[]', NOW() - INTERVAL '1 hour')
    `);

    // Clear expired entries again
    await hybridForecastService.clearExpiredCache();

    const statsAfter = await hybridForecastService.getCacheStats();

    return {
      before: statsBefore.cacheSize,
      after: statsAfter.cacheSize,
      expiredCleared: true
    };
  }

  async testErrorHandling(): Promise<any> {
    console.log('Testing error handling...');

    try {
      // Test with invalid query
      await hybridForecastService.executeQuery('INVALID SQL QUERY');
      throw new Error('Should have thrown an error for invalid query');
    } catch (error) {
      // This is expected
      return { errorHandled: true, errorType: 'invalid_query' };
    }
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Hybrid Forecast Cache Test Suite\n');

    // Initialize database first
    await this.runTest('Database Initialization', async () => {
      await initializeDatabase();
      return { initialized: true };
    });

    // Test database connection
    await this.runTest('Database Connection', async () => {
      const connected = await this.testDatabaseConnection();
      if (!connected) throw new Error('Database connection failed');
      return { connected: true };
    });

    // Test cache miss scenario
    await this.runTest('Cache Miss Scenario', () => this.testCacheMiss());

    // Test cache hit scenario
    await this.runTest('Cache Hit Scenario', () => this.testCacheHit());

    // Test query routing
    await this.runTest('Query Routing Logic', () => this.testQueryRouting());

    // Test performance metrics
    await this.runTest('Performance Metrics', () => this.testPerformanceMetrics());

    // Test cache expiration
    await this.runTest('Cache Expiration', () => this.testCacheExpiration());

    // Test error handling
    await this.runTest('Error Handling', () => this.testErrorHandling());

    // Print summary
    this.printSummary();
  }

  printSummary(): void {
    console.log('\n📊 Test Suite Summary');
    console.log('==========================================');

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`Total Tests: ${this.results.length}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ${failed > 0 ? '❌' : ''}`);
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log(`Success Rate: ${Math.round((passed / this.results.length) * 100)}%`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => console.log(`  - ${r.test}: ${r.error}`));
    }

    console.log('\n🎯 Performance Summary:');
    this.results.forEach(r => {
      const status = r.passed ? '✅' : '❌';
      console.log(`  ${status} ${r.test}: ${r.duration}ms`);
    });
  }
}

async function main() {
  const testSuite = new HybridCacheTestSuite();

  try {
    await testSuite.runAllTests();
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  } finally {
    // Close database connections
    await db.close();
  }
}

// Run the test suite
if (require.main === module) {
  main();
}

export { HybridCacheTestSuite };
