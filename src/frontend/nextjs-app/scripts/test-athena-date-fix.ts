#!/usr/bin/env tsx

/**
 * Test script to verify the Athena date casting fix
 *
 * This script tests the API endpoint with date queries to ensure
 * that the DATE casting is working properly for Athena queries.
 */

// Test configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://v1zx8vrzzj.execute-api.us-east-2.amazonaws.com';
const API_ENDPOINT = '/api/data/athena/query';

// Test queries
const testQueries = [
  {
    name: 'Direct date comparison query',
    body: {
      action: 'execute_query',
      query: "SELECT * FROM forecast WHERE business_date >= DATE '2025-01-01' AND business_date <= DATE '2025-03-31' ORDER BY business_date DESC LIMIT 10"
    }
  },
  {
    name: 'Get forecast by date action',
    body: {
      action: 'get_forecast_by_date',
      filters: {
        start_date: '2025-01-01',
        end_date: '2025-03-31'
      }
    }
  }
];

async function runTest() {
  console.log('🧪 Testing Athena date casting fix...\n');

  for (const test of testQueries) {
    console.log(`📋 Test: ${test.name}`);
    console.log(`Request body:`, JSON.stringify(test.body, null, 2));

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINT}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(test.body),
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
      }

      console.log(`✅ Success! Status: ${response.status}`);
      console.log(`Response data:`, JSON.stringify(data, null, 2).substring(0, 500) + '...\n');
    } catch (error) {
      if (error instanceof Error) {
        console.error(`❌ Error: ${error.message}`);
        if (error.name === 'AbortError') {
          console.error('Request timed out after 30 seconds');
        }
      } else {
        console.error(`❌ Error:`, error);
      }
      console.log('\n');
    }
  }
}

// Run the test
runTest().catch(console.error);
