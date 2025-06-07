import 'dotenv/config';

async function testForecastFilters() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Test 1: No filters (should return all data)
  console.log('\n=== Test 1: No filters ===');
  const test1 = await fetch(`${baseUrl}/api/data/postgres-forecast`, {
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
  const result1 = await test1.json();
  console.log(`Returned ${result1.data?.length || 0} rows`);

  // Test 2: With state filter
  console.log('\n=== Test 2: With state filter (CA) ===');
  const test2 = await fetch(`${baseUrl}/api/data/postgres-forecast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'get_forecast_data',
      filters: {
        inventoryItemId: 9907,
        startDate: '2025-01-01',
        endDate: '2025-03-31',
        state: ['CA']
      }
    })
  });
  const result2 = await test2.json();
  console.log(`Returned ${result2.data?.length || 0} rows`);
  if (result2.data?.length > 0) {
    console.log('Sample row:', result2.data[0]);
  }

  // Test 3: With multiple filters
  console.log('\n=== Test 3: With state and date range ===');
  const test3 = await fetch(`${baseUrl}/api/data/postgres-forecast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'get_forecast_data',
      filters: {
        inventoryItemId: 9907,
        startDate: '2025-01-15',
        endDate: '2025-01-31',
        state: ['CA', 'TX']
      }
    })
  });
  const result3 = await test3.json();
  console.log(`Returned ${result3.data?.length || 0} rows`);
}

testForecastFilters().catch(console.error);
