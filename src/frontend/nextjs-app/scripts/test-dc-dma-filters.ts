#!/usr/bin/env tsx

/**
 * Test script to verify DC/DMA filters work correctly with inventory item aggregation
 */

async function testFilters() {
  const baseUrl = 'http://localhost:3000/api/data/postgres-forecast';

  // Test scenarios
  const testCases = [
    {
      name: 'No filters (baseline)',
      params: {
        itemIds: '1',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        type: 'summary'
      }
    },
    {
      name: 'With DC filter only',
      params: {
        itemIds: '1',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        dcIds: '101,102',
        type: 'summary'
      }
    },
    {
      name: 'With DMA filter only',
      params: {
        itemIds: '1',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        dmaIds: 'DMA-1,DMA-2',
        type: 'summary'
      }
    },
    {
      name: 'With both DC and DMA filters',
      params: {
        itemIds: '1',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        dcIds: '101',
        dmaIds: 'DMA-1',
        type: 'summary'
      }
    },
    {
      name: 'With state filter added',
      params: {
        itemIds: '1',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        states: 'CA',
        dcIds: '101',
        dmaIds: 'DMA-1',
        type: 'summary'
      }
    }
  ];

  console.log('Testing DC/DMA filter functionality...\n');

  for (const testCase of testCases) {
    console.log(`\n=== ${testCase.name} ===`);

    // Build URL with query parameters
    const url = new URL(baseUrl);
    Object.entries(testCase.params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    try {
      const response = await fetch(url.toString());
      const data = await response.json();

      if (!response.ok) {
        console.error(`❌ Error: ${response.status} - ${JSON.stringify(data)}`);
        continue;
      }

      console.log(`✅ Success - Returned ${Array.isArray(data) ? data.length : 0} records`);

      if (Array.isArray(data) && data.length > 0) {
        // Show first record details
        const firstRecord = data[0];
        console.log('Sample record:', {
          date: firstRecord.business_date,
          state: firstRecord.state,
          dma_id: firstRecord.dma_id,
          dc_id: firstRecord.dc_id,
          y_50: firstRecord.y_50
        });
      }
    } catch (error) {
      console.error(`❌ Failed to fetch: ${error}`);
    }
  }

  // Test POST endpoint with same filters
  console.log('\n\n=== Testing POST endpoint ===');

  const postTestCase = {
    action: 'get_forecast_data',
    filters: {
      inventoryItemId: 1,
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      dcId: [101, 102],
      dmaId: ['DMA-1', 'DMA-2']
    }
  };

  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postTestCase)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`❌ POST Error: ${response.status} - ${JSON.stringify(result)}`);
    } else {
      const data = result.data || [];
      console.log(`✅ POST Success - Returned ${data.length} records`);

      if (data.length > 0) {
        console.log('Sample aggregated record:', {
          date: data[0].business_date,
          state: data[0].state,
          dma_id: data[0].dma_id,
          dc_id: data[0].dc_id,
          y_50: data[0].y_50
        });
      }
    }
  } catch (error) {
    console.error(`❌ POST Failed: ${error}`);
  }
}

// Run the tests
testFilters().catch(console.error);
