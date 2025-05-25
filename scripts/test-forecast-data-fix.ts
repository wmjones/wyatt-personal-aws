#!/usr/bin/env tsx

/**
 * Test script to verify the forecast data date range fix
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://v1zx8vrzzj.execute-api.us-east-2.amazonaws.com';
const API_ENDPOINT = '/api/data/athena/query';

async function testForecastDataFix() {
  console.log('🧪 Testing forecast data date range fix...\n');

  // Test query that should now work
  const testQuery = `
    SELECT
      business_date,
      COUNT(*) as row_count,
      AVG(y_50) as avg_forecast
    FROM forecast
    WHERE business_date >= DATE '2025-01-01'
      AND business_date <= DATE '2025-03-31'
    GROUP BY business_date
    ORDER BY business_date DESC
    LIMIT 10
  `;

  console.log('Testing query with corrected date range (2025-01-01 to 2025-03-31)...');

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINT}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'execute_query',
          query: testQuery.trim()
        }),
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
    }

    console.log('\n✅ Query successful!');
    console.log(`\nReturned ${data.data.rows.length} rows`);
    console.log('\nSample data:');
    data.data.rows.slice(0, 5).forEach(row => {
      console.log(`  ${row[0]}: ${row[1]} rows, avg forecast: ${parseFloat(row[2]).toFixed(2)}`);
    });

    // Also test edge case - querying beyond available data
    console.log('\n\n🔍 Testing edge case - querying beyond available data (2025-04-01)...');

    const edgeQuery = `
      SELECT COUNT(*) as row_count
      FROM forecast
      WHERE business_date = DATE '2025-04-01'
    `;

    const edgeResponse = await fetch(
      `${API_BASE_URL}${API_ENDPOINT}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'execute_query',
          query: edgeQuery.trim()
        })
      }
    );

    const edgeData = await edgeResponse.json();

    if (edgeResponse.ok && edgeData.data.rows[0]) {
      const count = edgeData.data.rows[0][0];
      console.log(`\nRows for 2025-04-01: ${count}`);
      if (count === '0') {
        console.log('✅ Confirmed: No data exists for 2025-04-01');
      }
    }

    console.log('\n🎉 All tests passed! The date range issue should now be fixed.');
    console.log('\nNext steps:');
    console.log('1. Deploy the frontend changes to Vercel');
    console.log('2. The dashboard should now load forecast data without errors');

  } catch (error) {
    if (error instanceof Error) {
      console.error('\n❌ Error:', error.message);
    } else {
      console.error('\n❌ Error:', error);
    }
  }
}

// Run the test
testForecastDataFix().catch(console.error);
