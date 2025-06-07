import { postgresForecastService } from '../app/services/postgresForecastService';

async function testApiResponse() {
  console.log('=== Testing API Response for Date Range ===\n');

  try {
    // Test the exact API call that would be made from the UI
    const filters = {
      startDate: '2024-12-31',
      endDate: '2025-01-17',
      inventoryItemId: 152 // Using a specific item we know exists
    };

    console.log('1. Calling API with filters:', filters);
    const data = await postgresForecastService.getForecastData(filters);

    console.log(`\n2. Response summary:`);
    console.log(`   Total records: ${data.length}`);

    if (data.length > 0) {
      // Group by date to see distribution
      const dateGroups = data.reduce((acc, item) => {
        const date = item.business_date;
        if (!acc[date]) {
          acc[date] = 0;
        }
        acc[date]++;
        return acc;
      }, {} as Record<string, number>);

      console.log(`\n3. Records by date:`);
      Object.entries(dateGroups)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([date, count]) => {
          console.log(`   ${date}: ${count} records`);
        });

      // Show sample records
      console.log(`\n4. Sample records (first 3):`);
      data.slice(0, 3).forEach((record, i) => {
        console.log(`   Record ${i + 1}:`, {
          date: record.business_date,
          inventoryItem: record.inventory_item_id,
          state: record.state,
          y_50: record.y_50
        });
      });

      // Check unique inventory items in response
      const uniqueItems = new Set(data.map(d => d.inventory_item_id));
      console.log(`\n5. Unique inventory items in response: ${Array.from(uniqueItems).join(', ')}`);

      // Check unique states in response
      const uniqueStates = new Set(data.map(d => d.state));
      console.log(`   Unique states in response: ${Array.from(uniqueStates).join(', ')}`);
    }

  } catch (error) {
    console.error('Error testing API:', error);
  }
}

// Run the test
testApiResponse();
