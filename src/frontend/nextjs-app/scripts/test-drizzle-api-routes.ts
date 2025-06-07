/**
 * Test script to verify all Drizzle-migrated API routes
 *
 * Usage: npx tsx scripts/test-drizzle-api-routes.ts [--base-url=http://localhost:3000]
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });

// Parse command line arguments
const args = process.argv.slice(2);
const baseUrlArg = args.find(arg => arg.startsWith('--base-url='));
const BASE_URL = baseUrlArg ? baseUrlArg.split('=')[1] : 'http://localhost:3000';

console.log(`\n🧪 Testing Drizzle API Routes`);
console.log(`📍 Base URL: ${BASE_URL}`);
console.log(`⏰ Starting at: ${new Date().toISOString()}\n`);

interface TestResult {
  endpoint: string;
  method: string;
  status: 'pass' | 'fail';
  statusCode?: number;
  error?: string;
  duration?: number;
}

const results: TestResult[] = [];

async function testEndpoint(
  endpoint: string,
  method: string,
  body?: any,
  expectedStatus = 200
): Promise<TestResult> {
  const url = `${BASE_URL}${endpoint}`;
  const startTime = Date.now();

  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const duration = Date.now() - startTime;

    if (response.status !== expectedStatus) {
      const text = await response.text();
      return {
        endpoint,
        method,
        status: 'fail',
        statusCode: response.status,
        error: `Expected ${expectedStatus}, got ${response.status}: ${text}`,
        duration,
      };
    }

    // Try to parse JSON response
    try {
      const data = await response.json();
      console.log(`✅ ${method} ${endpoint} - ${duration}ms`);
      return {
        endpoint,
        method,
        status: 'pass',
        statusCode: response.status,
        duration,
      };
    } catch (e) {
      return {
        endpoint,
        method,
        status: 'fail',
        statusCode: response.status,
        error: 'Invalid JSON response',
        duration,
      };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ ${method} ${endpoint} - ${error}`);
    return {
      endpoint,
      method,
      status: 'fail',
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
    };
  }
}

async function runTests() {
  console.log('📋 Testing Debug Endpoints\n');

  // Test debug endpoints
  results.push(await testEndpoint('/api/debug/env', 'GET'));
  results.push(await testEndpoint('/api/debug/schema', 'GET'));
  results.push(await testEndpoint('/api/debug/db-connection', 'GET'));

  console.log('\n📋 Testing User Preferences Endpoints\n');

  // Test user preferences endpoints
  results.push(await testEndpoint('/api/user/preferences/init', 'POST', {}));
  results.push(await testEndpoint('/api/user/preferences', 'GET'));
  results.push(await testEndpoint('/api/user/preferences', 'PUT', {
    settings: { theme: 'dark', notifications: true }
  }));

  console.log('\n📋 Testing Adjustments Endpoints\n');

  // Test adjustments endpoints
  results.push(await testEndpoint('/api/adjustments', 'GET'));
  results.push(await testEndpoint('/api/adjustments', 'POST', {
    adjustment_value: 10,
    inventory_item_id: 1,
    inventory_item_name: 'Test Item',
    filter_context: { states: ['CA'] },
    adjustment_start_date: '2024-01-01',
    adjustment_end_date: '2024-12-31',
  }));

  console.log('\n📋 Testing Forecast Cache Endpoints\n');

  // Test forecast cache endpoints
  results.push(await testEndpoint('/api/forecast/cache?action=get_stats', 'GET'));
  results.push(await testEndpoint('/api/forecast/cache?action=get_summary&fingerprint=test123', 'GET'));
  results.push(await testEndpoint('/api/forecast/cache', 'POST', {
    action: 'record_metrics',
    data: {
      metrics: {
        query_fingerprint: 'test123',
        query_type: 'forecast',
        execution_time_ms: 100,
        data_source: 'athena',
        cache_hit: false,
        error_occurred: false,
        user_id: 'test-user',
        filters: {},
      }
    }
  }));

  console.log('\n📋 Testing Forecast Data Endpoints\n');

  // Test forecast data endpoints
  results.push(await testEndpoint('/api/data/postgres-forecast', 'POST', {
    action: 'get_distinct_states'
  }));

  results.push(await testEndpoint('/api/data/postgres-forecast', 'POST', {
    action: 'get_forecast_summary',
    filters: { state: 'CA' }
  }));

  // Print summary
  console.log('\n📊 Test Summary\n');
  console.log('=====================================');

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);

  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️  Total Duration: ${totalDuration}ms`);
  console.log(`📊 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:\n');
    results
      .filter(r => r.status === 'fail')
      .forEach(r => {
        console.log(`${r.method} ${r.endpoint}`);
        console.log(`  Status: ${r.statusCode || 'N/A'}`);
        console.log(`  Error: ${r.error}`);
        console.log('');
      });
  }

  // Test database connection details
  console.log('\n🔍 Database Connection Details\n');
  try {
    const dbResponse = await fetch(`${BASE_URL}/api/debug/db-connection`);
    if (dbResponse.ok) {
      const dbInfo = await dbResponse.json();
      console.log(`Environment: ${dbInfo.configuration?.environment || 'unknown'}`);
      console.log(`Branch: ${dbInfo.configuration?.branchName || 'unknown'}`);
      console.log(`Database: ${dbInfo.branchInfo?.description || 'unknown'}`);
      console.log(`Connection Status: ${dbInfo.status || 'unknown'}`);

      if (dbInfo.databaseInfo) {
        console.log(`\nDatabase Info:`);
        console.log(`  Name: ${dbInfo.databaseInfo.database}`);
        console.log(`  Version: ${dbInfo.databaseInfo.version?.split('\n')[0]}`);
      }
    }
  } catch (e) {
    console.error('Failed to fetch database connection details');
  }

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
