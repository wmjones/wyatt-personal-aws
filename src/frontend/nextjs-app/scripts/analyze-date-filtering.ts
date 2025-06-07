// This script analyzes how dates are filtered in the frontend

const testData = {
  timeSeries: [
    { business_date: '2025-01-01', inventory_item_id: '152', state: 'CA', dma_id: 'DMA1', dc_id: '15', y_05: 10, y_50: 20, y_95: 30 },
    { business_date: '2025-01-02', inventory_item_id: '152', state: 'CA', dma_id: 'DMA1', dc_id: '15', y_05: 11, y_50: 21, y_95: 31 },
    { business_date: '2025-01-14', inventory_item_id: '152', state: 'CA', dma_id: 'DMA1', dc_id: '15', y_05: 12, y_50: 22, y_95: 32 },
    { business_date: '2025-01-15', inventory_item_id: '152', state: 'CA', dma_id: 'DMA1', dc_id: '15', y_05: 13, y_50: 23, y_95: 33 },
    { business_date: '2025-01-16', inventory_item_id: '152', state: 'CA', dma_id: 'DMA1', dc_id: '15', y_05: 14, y_50: 24, y_95: 34 },
    { business_date: '2025-01-17', inventory_item_id: '152', state: 'CA', dma_id: 'DMA1', dc_id: '15', y_05: 15, y_50: 25, y_95: 35 },
  ]
};

// Simulate the transformation that happens in useForecast.ts
function transformToForecastSeries(data: typeof testData) {
  const datesSet = new Set<string>();
  const forecastData: any[] = [];

  data.timeSeries.forEach((row) => {
    if (!row.business_date) {
      console.warn('Row missing business_date:', row);
      return;
    }
    const date = row.business_date.split('T')[0];
    datesSet.add(date);

    forecastData.push({
      periodId: `day-${date}`,
      value: row.y_50 || 0,
      inventoryItemId: row.inventory_item_id,
      state: row.state,
      dmaId: row.dma_id,
      dcId: row.dc_id,
      y_05: row.y_05 || 0,
      y_50: row.y_50 || 0,
      y_95: row.y_95 || 0,
    });
  });

  const timePeriods = Array.from(datesSet)
    .sort()
    .map(dateStr => {
      const date = new Date(dateStr);
      return {
        id: `day-${dateStr}`,
        name: date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        }),
        startDate: dateStr,
        endDate: dateStr,
        type: 'day' as const
      };
    });

  return {
    id: `forecast-${Date.now()}`,
    timePeriods,
    baseline: forecastData,
    inventoryItems: [{ id: '152', name: 'Item 152' }],
    lastUpdated: new Date().toISOString()
  };
}

// Simulate createChartDataset
function createChartDataset(dataPoints: any[], timePeriods: any[]) {
  const periodMap = new Map();
  timePeriods.forEach(period => {
    periodMap.set(period.id, period);
  });

  const aggregatedData = dataPoints.reduce((acc, point) => {
    if (!acc[point.periodId]) {
      acc[point.periodId] = {
        periodId: point.periodId,
        totalValue: 0,
        count: 0,
        totalY50: 0,
      };
    }
    acc[point.periodId].totalValue += point.value;
    acc[point.periodId].count += 1;
    if (point.y_50 !== undefined) acc[point.periodId].totalY50 += point.y_50;
    return acc;
  }, {});

  const chartData = Object.values(aggregatedData).map((data: any) => {
    const period = periodMap.get(data.periodId);
    const date = new Date(period.startDate);

    return {
      date,
      value: data.totalValue,
      periodId: data.periodId,
      y_50: data.count > 0 && data.totalY50 > 0 ? data.totalY50 : undefined,
    };
  }).sort((a, b) => a.date.getTime() - b.date.getTime());

  return chartData;
}

// Run the analysis
console.log('=== Analyzing Date Filtering Logic ===\n');

console.log('1. Input data dates:');
testData.timeSeries.forEach(row => {
  console.log(`   ${row.business_date}`);
});

console.log('\n2. After transformToForecastSeries:');
const transformed = transformToForecastSeries(testData);
console.log(`   Time periods: ${transformed.timePeriods.length}`);
console.log(`   Baseline data points: ${transformed.baseline.length}`);
transformed.timePeriods.forEach(period => {
  console.log(`   ${period.id} -> ${period.name}`);
});

console.log('\n3. After createChartDataset:');
const chartData = createChartDataset(transformed.baseline, transformed.timePeriods);
console.log(`   Chart data points: ${chartData.length}`);
chartData.forEach(point => {
  console.log(`   ${point.date.toISOString().split('T')[0]} -> value: ${point.value}, y_50: ${point.y_50}`);
});

console.log('\n4. Analysis:');
console.log(`   Missing dates between Jan 1-17:`);
for (let d = new Date('2025-01-01'); d <= new Date('2025-01-17'); d.setDate(d.getDate() + 1)) {
  const dateStr = d.toISOString().split('T')[0];
  const found = chartData.find(p => p.date.toISOString().split('T')[0] === dateStr);
  if (!found) {
    console.log(`   - ${dateStr} is missing`);
  }
}
