import 'dotenv/config';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function testAggregationAPI() {
  console.log('=== Testing Server-Side Aggregation API ===\n');

  // Test 1: Small date range (should use daily aggregation)
  console.log('Test 1: 7-day range (should use daily aggregation)');
  const test1Start = Date.now();
  const response1 = await fetch(`${baseUrl}/api/data/postgres-forecast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'get_forecast_data',
      filters: {
        inventoryItemId: 9907,
        startDate: '2025-01-01',
        endDate: '2025-01-07'
      }
    })
  });
  const result1 = await response1.json();
  const test1Time = Date.now() - test1Start;
  console.log(`Returned ${result1.data?.length || 0} rows in ${test1Time}ms`);
  if (result1.data?.length > 0) {
    console.log(`Aggregation level: ${result1.data[0].aggregation_level || 'none'}`);
    console.log(`Data transfer size: ~${JSON.stringify(result1).length / 1024}KB`);
  }
  console.log();

  // Test 2: Medium date range (should use weekly aggregation)
  console.log('Test 2: 60-day range (should use weekly aggregation)');
  const test2Start = Date.now();
  const response2 = await fetch(`${baseUrl}/api/data/postgres-forecast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'get_forecast_data',
      filters: {
        inventoryItemId: 9907,
        startDate: '2025-01-01',
        endDate: '2025-03-01'
      }
    })
  });
  const result2 = await response2.json();
  const test2Time = Date.now() - test2Start;
  console.log(`Returned ${result2.data?.length || 0} rows in ${test2Time}ms`);
  if (result2.data?.length > 0) {
    console.log(`Aggregation level: ${result2.data[0].aggregation_level || 'none'}`);
    console.log(`Data transfer size: ~${JSON.stringify(result2).length / 1024}KB`);
  }
  console.log();

  // Test 3: Full quarter (should use monthly aggregation)
  console.log('Test 3: Full quarter - 90 days (should use monthly aggregation)');
  const test3Start = Date.now();
  const response3 = await fetch(`${baseUrl}/api/data/postgres-forecast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'get_forecast_data',
      filters: {
        inventoryItemId: 9907,
        startDate: '2025-01-01',
        endDate: '2025-03-31'
      }
    })
  });
  const result3 = await response3.json();
  const test3Time = Date.now() - test3Start;
  console.log(`Returned ${result3.data?.length || 0} rows in ${test3Time}ms`);
  if (result3.data?.length > 0) {
    console.log(`Aggregation level: ${result3.data[0].aggregation_level || 'none'}`);
    console.log(`Data transfer size: ~${JSON.stringify(result3).length / 1024}KB`);
  }
  console.log();

  // Test 4: Force no aggregation for comparison
  console.log('Test 4: Force no aggregation for comparison (7 days)');
  const test4Start = Date.now();
  const response4 = await fetch(`${baseUrl}/api/data/postgres-forecast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'get_forecast_data',
      filters: {
        inventoryItemId: 9907,
        startDate: '2025-01-01',
        endDate: '2025-01-07',
        aggregationLevel: 'none'
      }
    })
  });
  const result4 = await response4.json();
  const test4Time = Date.now() - test4Start;
  console.log(`Returned ${result4.data?.length || 0} rows in ${test4Time}ms`);
  console.log(`Data transfer size: ~${JSON.stringify(result4).length / 1024}KB`);
  console.log();

  // Calculate reduction
  if (result1.data?.length > 0 && result4.data?.length > 0) {
    const reduction = ((result4.data.length - result1.data.length) / result4.data.length) * 100;
    const sizeReduction = ((JSON.stringify(result4).length - JSON.stringify(result1).length) / JSON.stringify(result4).length) * 100;
    console.log('=== Performance Metrics ===');
    console.log(`Row count reduction: ${reduction.toFixed(1)}%`);
    console.log(`Data size reduction: ${sizeReduction.toFixed(1)}%`);
    console.log(`Speed improvement: ${((test4Time - test1Time) / test4Time * 100).toFixed(1)}%`);
  }

  // Show sample aggregated data
  if (result3.data?.length > 0) {
    console.log('\n=== Sample Aggregated Data (Monthly) ===');
    const sample = result3.data[0];
    console.log('First row:', {
      date: sample.business_date,
      aggregation: sample.aggregation_level,
      records_aggregated: sample.record_count,
      y_50: sample.y_50
    });
  }
}

testAggregationAPI().catch(console.error);
