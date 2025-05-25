#!/usr/bin/env tsx

/**
 * Script to check the actual date range in Athena forecast table
 */

// Test configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://v1zx8vrzzj.execute-api.us-east-2.amazonaws.com';
const API_ENDPOINT = '/api/data/athena/query';

async function checkDateRange() {
  console.log('🔍 Checking date range in Athena forecast table...\n');

  const query = `
    SELECT
      MIN(business_date) as min_date,
      MAX(business_date) as max_date,
      COUNT(DISTINCT business_date) as unique_dates,
      COUNT(*) as total_rows
    FROM forecast
  `;

  console.log('Query:', query);

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
          query: query.trim()
        }),
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
    }

    console.log('✅ Query successful!\n');
    console.log('Results:');
    console.log('Columns:', data.data.columns);
    console.log('Data:', data.data.rows[0]);

    if (data.data.rows && data.data.rows.length > 0) {
      const [minDate, maxDate, uniqueDates, totalRows] = data.data.rows[0];
      console.log('\n📊 Summary:');
      console.log(`- Earliest date: ${minDate}`);
      console.log(`- Latest date: ${maxDate}`);
      console.log(`- Unique dates: ${uniqueDates}`);
      console.log(`- Total rows: ${totalRows}`);

      // Check if it matches expected range
      const expectedStart = '2025-01-01';
      const expectedEnd = '2025-04-01';

      console.log('\n🎯 Expected vs Actual:');
      console.log(`Expected: ${expectedStart} to ${expectedEnd}`);
      console.log(`Actual: ${minDate} to ${maxDate}`);

      if (minDate > expectedStart || maxDate < expectedEnd) {
        console.log('\n⚠️  WARNING: Date range mismatch!');
        console.log('The frontend expects data from 2025-01-01 to 2025-04-01');
      } else {
        console.log('\n✅ Date range covers expected period');
      }
    }

  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Error:', error.message);
      if (error.name === 'AbortError') {
        console.error('Request timed out after 30 seconds');
      }
    } else {
      console.error('❌ Error:', error);
    }
  }
}

// Run the check
checkDateRange().catch(console.error);
