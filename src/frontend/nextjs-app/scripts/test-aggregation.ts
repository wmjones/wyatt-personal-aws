import 'dotenv/config';
import { postgresForecastService } from '../app/services/postgresForecastService';

async function testAggregation() {
  console.log('=== Testing Server-Side Aggregation ===\n');

  // Test 1: Small date range (should use daily aggregation)
  console.log('Test 1: 7-day range (should use daily aggregation)');
  const test1Start = Date.now();
  const result1 = await postgresForecastService.getForecastData({
    inventoryItemId: 9907,
    startDate: '2025-01-01',
    endDate: '2025-01-07'
  });
  const test1Time = Date.now() - test1Start;
  console.log(`Returned ${result1.length} rows in ${test1Time}ms`);
  console.log(`Aggregation level: ${(result1[0] as any)?.aggregation_level || 'none'}`);
  console.log(`Data transfer size: ~${JSON.stringify(result1).length / 1024}KB\n`);

  // Test 2: Medium date range (should use weekly aggregation)
  console.log('Test 2: 60-day range (should use weekly aggregation)');
  const test2Start = Date.now();
  const result2 = await postgresForecastService.getForecastData({
    inventoryItemId: 9907,
    startDate: '2025-01-01',
    endDate: '2025-03-01'
  });
  const test2Time = Date.now() - test2Start;
  console.log(`Returned ${result2.length} rows in ${test2Time}ms`);
  console.log(`Aggregation level: ${(result2[0] as any)?.aggregation_level || 'none'}`);
  console.log(`Data transfer size: ~${JSON.stringify(result2).length / 1024}KB\n`);

  // Test 3: Full quarter (should use monthly aggregation but currently fails due to row limit)
  console.log('Test 3: Full quarter - 90 days (should use monthly aggregation)');
  const test3Start = Date.now();
  const result3 = await postgresForecastService.getForecastData({
    inventoryItemId: 9907,
    startDate: '2025-01-01',
    endDate: '2025-03-31'
  });
  const test3Time = Date.now() - test3Start;
  console.log(`Returned ${result3.length} rows in ${test3Time}ms`);
  console.log(`Aggregation level: ${(result3[0] as any)?.aggregation_level || 'none'}`);
  console.log(`Data transfer size: ~${JSON.stringify(result3).length / 1024}KB\n`);

  // Compare aggregated vs non-aggregated
  console.log('Test 4: Force no aggregation for comparison');
  const test4Start = Date.now();
  const result4 = await postgresForecastService.getForecastData({
    inventoryItemId: 9907,
    startDate: '2025-01-01',
    endDate: '2025-01-07',
    aggregationLevel: 'none'
  });
  const test4Time = Date.now() - test4Start;
  console.log(`Returned ${result4.length} rows in ${test4Time}ms`);
  console.log(`Data transfer size: ~${JSON.stringify(result4).length / 1024}KB\n`);

  // Calculate reduction
  if (result1.length > 0 && result4.length > 0) {
    const reduction = ((result4.length - result1.length) / result4.length) * 100;
    console.log(`\nData reduction with aggregation: ${reduction.toFixed(1)}%`);
    console.log(`Performance improvement: ${((test4Time - test1Time) / test4Time * 100).toFixed(1)}%`);
  }

  // Test with multiple filters
  console.log('\nTest 5: Aggregation with location filters');
  const test5Start = Date.now();
  const result5 = await postgresForecastService.getForecastData({
    inventoryItemId: 9907,
    startDate: '2025-01-01',
    endDate: '2025-03-31',
    state: ['CA', 'TX', 'NY']
  });
  const test5Time = Date.now() - test5Start;
  console.log(`Returned ${result5.length} rows in ${test5Time}ms`);
  console.log(`Aggregation level: ${(result5[0] as any)?.aggregation_level || 'none'}`);

  // Show sample aggregated row
  if (result5.length > 0) {
    const sample = result5[0] as any;
    console.log('\nSample aggregated row:');
    console.log(`  Date: ${sample.business_date}`);
    console.log(`  Aggregation: ${sample.aggregation_level}`);
    console.log(`  Records aggregated: ${sample.record_count}`);
    console.log(`  Y50 value: ${sample.y_50}`);
  }
}

testAggregation().catch(console.error);
