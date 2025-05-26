'use client';

import React from 'react';
import { LineChart } from '@/components/ui/charts/LineChart';
import { TimeSeriesDataPoint } from '@/components/ui/charts/types';

// Generate sample data
const generateSampleData = (): TimeSeriesDataPoint[] => {
  const days = 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return Array.from({ length: days }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const baseValue = 1000 + Math.sin(i * 0.3) * 200;
    const randomNoise = Math.random() * 100 - 50;
    const value = baseValue + randomNoise;

    return {
      x: date,
      y: value,
      y_lower: value - 100 - Math.random() * 50,
      y_upper: value + 100 + Math.random() * 50,
    };
  });
};

const generateMultiSeriesData = () => {
  const forecastData = generateSampleData().map(d => ({
    ...d,
    y: d.y * 1.1,
    y_lower: d.y * 1.05,
    y_upper: d.y * 1.15,
  }));

  const actualData = generateSampleData().slice(0, 20).map(d => ({
    ...d,
    y: d.y * 0.95,
    y_lower: undefined,
    y_upper: undefined,
  }));

  return [
    {
      key: 'forecast',
      data: forecastData,
      color: 'var(--dp-chart-forecasted)',
      label: 'Forecast',
    },
    {
      key: 'actual',
      data: actualData,
      color: 'var(--dp-chart-actual)',
      label: 'Actual',
    },
  ];
};

export default function ChartsDemo() {
  const singleSeriesData = generateSampleData();
  const multiSeriesData = generateMultiSeriesData();

  return (
    <div className="container mx-auto p-8 space-y-12">
      <div>
        <h1 className="text-3xl font-bold mb-8">Chart Components Demo</h1>

        {/* Single Series Line Chart */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Single Series Line Chart</h2>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <LineChart
              data={singleSeriesData}
              showConfidenceInterval
              xAxisLabel="Date"
              yAxisLabel="Units"
              className="h-96"
            />
          </div>
        </section>

        {/* Multi-Series Line Chart */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Multi-Series Line Chart with Legend</h2>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <LineChart
              series={multiSeriesData}
              showConfidenceInterval
              showLegend
              xAxisLabel="Date"
              yAxisLabel="Units"
              className="h-96"
            />
          </div>
        </section>

        {/* Minimal Line Chart */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Minimal Line Chart</h2>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <LineChart
              data={singleSeriesData}
              showGrid={false}
              showDots={false}
              className="h-64"
            />
          </div>
        </section>

        {/* Interactive Line Chart */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Interactive Line Chart</h2>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <LineChart
              series={multiSeriesData}
              showLegend
              onDataPointClick={(point, seriesKey) => {
                alert(`Clicked ${seriesKey} at ${point.x}: ${point.y}`);
              }}
              className="h-96"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
