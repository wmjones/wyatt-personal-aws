#!/usr/bin/env tsx

/**
 * Comprehensive test script for postgres-forecast API
 * Tests all filter combinations and edge cases for task 43
 */

async function testAPIEndpoint() {
  const baseUrl = 'http://localhost:3000/api/data/postgres-forecast';

  console.log('=== Comprehensive postgres-forecast API Test ===\n');

  // First, get available distinct values
  console.log('1. Getting available distinct values...');

  const getDistinctValues = async (action: string) => {
    try {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error(`Failed to get ${action}:`, error);
      return [];
    }
  };

  const inventoryItems = await getDistinctValues('get_distinct_inventory_items');
  const states = await getDistinctValues('get_distinct_states');
  const dmaIds = await getDistinctValues('get_distinct_dma_ids');
  const dcIds = await getDistinctValues('get_distinct_dc_ids');

  console.log('Available data:');
  console.log(`- Inventory Items: ${inventoryItems.slice(0, 3).join(', ')} (${inventoryItems.length} total)`);
  console.log(`- States: ${states.slice(0, 3).join(', ')} (${states.length} total)`);
  console.log(`- DMA IDs: ${dmaIds.slice(0, 3).join(', ')} (${dmaIds.length} total)`);
  console.log(`- DC IDs: ${dcIds.slice(0, 3).join(', ')} (${dcIds.length} total)`);

  if (inventoryItems.length === 0) {
    console.error('❌ No inventory items found in database - cannot proceed with tests');
    return;
  }

  // Test scenarios
  const testCases = [
    {
      name: 'Initial load - first inventory item, full date range',
      params: {
        itemIds: inventoryItems[0],
        startDate: '2025-01-01',
        endDate: '2025-03-31',
        type: 'summary'
      },
      expectation: 'Should load data for first inventory item automatically'
    },
    {
      name: 'Filter by single state',
      params: {
        itemIds: inventoryItems[0],
        startDate: '2025-01-01',
        endDate: '2025-03-31',
        states: states[0] || 'CA',
        type: 'summary'
      },
      expectation: 'Should filter to specific state before aggregation'
    },
    {
      name: 'Filter by multiple states',
      params: {
        itemIds: inventoryItems[0],
        startDate: '2025-01-01',
        endDate: '2025-03-31',
        states: states.slice(0, 2).join(',') || 'CA,TX',
        type: 'summary'
      },
      expectation: 'Should filter to multiple states before aggregation'
    },
    {
      name: 'Filter by single DMA',
      params: {
        itemIds: inventoryItems[0],
        startDate: '2025-01-01',
        endDate: '2025-03-31',
        dmaIds: dmaIds[0] || 'DMA-1',
        type: 'summary'
      },
      expectation: 'Should filter to specific DMA before aggregation'
    },
    {
      name: 'Filter by single DC',
      params: {
        itemIds: inventoryItems[0],
        startDate: '2025-01-01',
        endDate: '2025-03-31',
        dcIds: dcIds[0] || '101',
        type: 'summary'
      },
      expectation: 'Should filter to specific DC before aggregation'
    },
    {
      name: 'Combined filters - state + DMA + DC',
      params: {
        itemIds: inventoryItems[0],
        startDate: '2025-01-01',
        endDate: '2025-03-31',
        states: states[0] || 'CA',
        dmaIds: dmaIds[0] || 'DMA-1',
        dcIds: dcIds[0] || '101',
        type: 'summary'
      },
      expectation: 'Should apply all filters before aggregation'
    },
    {
      name: 'Timeseries with filters',
      params: {
        itemIds: inventoryItems[0],
        startDate: '2025-01-01',
        endDate: '2025-01-07',
        states: states[0] || 'CA',
        type: 'timeseries'
      },
      expectation: 'Should return raw filtered data for time series'
    }
  ];

  console.log('\n2. Testing API endpoints...\n');

  for (const testCase of testCases) {
    console.log(`--- ${testCase.name} ---`);
    console.log(`Expectation: ${testCase.expectation}`);

    // Build URL with query parameters
    const url = new URL(baseUrl);
    Object.entries(testCase.params).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value.toString());
    });

    try {
      const response = await fetch(url.toString());
      const data = await response.json();

      if (!response.ok) {
        console.error(`❌ Error: ${response.status} - ${JSON.stringify(data)}`);
        continue;
      }

      const records = Array.isArray(data) ? data : data.data || [];
      console.log(`✅ Success - Returned ${records.length} records`);

      if (records.length > 0) {
        const firstRecord = records[0];
        console.log('Sample record:', {
          date: firstRecord.business_date,
          item_id: firstRecord.inventory_item_id,
          state: firstRecord.state,
          dma_id: firstRecord.dma_id,
          dc_id: firstRecord.dc_id,
          y_50: firstRecord.y_50 || firstRecord.totalForecast
        });

        // Validate filtering worked correctly
        if (testCase.params.states && firstRecord.state !== 'ALL') {
          const expectedStates = testCase.params.states.split(',');
          if (!expectedStates.includes(firstRecord.state)) {
            console.warn(`⚠️  Warning: Expected state to be one of [${expectedStates.join(',')}], got ${firstRecord.state}`);
          }
        }
      }
    } catch (error) {
      console.error(`❌ Failed to fetch: ${error}`);
    }

    console.log('');
  }

  // Test edge cases
  console.log('3. Testing edge cases...\n');

  const edgeCases = [
    {
      name: 'Empty filters (should return data for first item)',
      params: { itemIds: inventoryItems[0] },
      expectation: 'Should use default date range'
    },
    {
      name: 'Non-existent inventory item',
      params: {
        itemIds: '99999',
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        type: 'summary'
      },
      expectation: 'Should return empty result'
    },
    {
      name: 'Invalid date range',
      params: {
        itemIds: inventoryItems[0],
        startDate: '2025-12-31',
        endDate: '2025-01-01',
        type: 'summary'
      },
      expectation: 'Should handle invalid date range gracefully'
    }
  ];

  for (const testCase of edgeCases) {
    console.log(`--- ${testCase.name} ---`);
    console.log(`Expectation: ${testCase.expectation}`);

    const url = new URL(baseUrl);
    Object.entries(testCase.params).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value.toString());
    });

    try {
      const response = await fetch(url.toString());
      const data = await response.json();

      const records = Array.isArray(data) ? data : data.data || [];
      console.log(`Result: ${response.ok ? '✅' : '❌'} ${response.status} - ${records.length} records`);

      if (response.ok && records.length > 0) {
        console.log('Sample:', {
          date: records[0].business_date,
          y_50: records[0].y_50 || records[0].totalForecast
        });
      }
    } catch (error) {
      console.error(`❌ Failed: ${error}`);
    }

    console.log('');
  }

  console.log('=== Test Complete ===');
}

// Run the tests
testAPIEndpoint().catch(console.error);
