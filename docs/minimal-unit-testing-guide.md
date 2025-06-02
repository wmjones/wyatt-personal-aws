# Minimal Unit Testing Guide for Next.js Demand Planning App

This guide provides a practical, minimal approach to unit testing your Next.js application, focusing on the most critical components and services.

## Setup & Configuration

### 1. Install Testing Dependencies

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom
```

### 2. Create Jest Configuration

Create `jest.config.mjs` in your Next.js app root:

```javascript
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // Provide the path to your Next.js app
  dir: './',
})

/** @type {import('jest').Config} */
const config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/app/$1',
  },
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
}

export default createJestConfig(config)
```

### 3. Create Jest Setup File

Create `jest.setup.js`:

```javascript
import '@testing-library/jest-dom'

// Mock environment variables
process.env = {
  ...process.env,
  NEXT_PUBLIC_API_URL: 'http://localhost:3000',
  NEXT_PUBLIC_COGNITO_USER_POOL_ID: 'test-pool-id',
  NEXT_PUBLIC_COGNITO_CLIENT_ID: 'test-client-id',
  DATABASE_URL: 'postgresql://test@localhost:5432/test',
}
```

### 4. Update package.json

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## Priority Testing Areas

Based on your app's architecture, focus unit tests on these critical areas:

### 1. Services Layer (Highest Priority)

Your services handle business logic and data fetching. Test these first:

#### Forecast Service Test
`app/services/__tests__/forecastService.test.ts`

```typescript
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { forecastService } from '../forecastService';

// Mock the fetch function
global.fetch = jest.fn();

describe('ForecastService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getForecastData', () => {
    it('should fetch forecast data with correct parameters', async () => {
      const mockData = {
        data: [{ state: 'TX', y_50: 100 }],
        totalRecords: 1
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await forecastService.getForecastData({
        states: ['TX'],
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/data/postgres-forecast'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toEqual(mockData);
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(
        forecastService.getForecastData({ states: ['TX'] })
      ).rejects.toThrow('Failed to fetch forecast data');
    });
  });
});
```

#### Cache Service Test
`app/services/__tests__/cacheService.test.ts`

```typescript
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { CacheService } from '../cacheService';

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = new CacheService();
    localStorage.clear();
  });

  it('should store and retrieve data from cache', () => {
    const testData = { forecast: [1, 2, 3] };
    const key = 'test-key';

    cacheService.set(key, testData, 60); // 60 seconds TTL
    const retrieved = cacheService.get(key);

    expect(retrieved).toEqual(testData);
  });

  it('should return null for expired cache', () => {
    const testData = { forecast: [1, 2, 3] };
    const key = 'test-key';

    // Set with -1 second TTL (already expired)
    cacheService.set(key, testData, -1);
    const retrieved = cacheService.get(key);

    expect(retrieved).toBeNull();
  });

  it('should invalidate cache by pattern', () => {
    cacheService.set('forecast:TX:2024', { data: 1 }, 60);
    cacheService.set('forecast:CA:2024', { data: 2 }, 60);
    cacheService.set('other:data', { data: 3 }, 60);

    cacheService.invalidatePattern('forecast:');

    expect(cacheService.get('forecast:TX:2024')).toBeNull();
    expect(cacheService.get('forecast:CA:2024')).toBeNull();
    expect(cacheService.get('other:data')).toEqual({ data: 3 });
  });
});
```

### 2. Custom Hooks (Medium Priority)

Test hooks that contain business logic:

#### useForecast Hook Test
`app/demand-planning/hooks/__tests__/useForecast.test.tsx`

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useForecast } from '../useForecast';
import * as forecastService from '@/services/forecastService';

jest.mock('@/services/forecastService');

describe('useForecast', () => {
  it('should fetch forecast data on mount', async () => {
    const mockData = { data: [], totalRecords: 0 };
    jest.spyOn(forecastService, 'getForecastData').mockResolvedValue(mockData);

    const { result } = renderHook(() =>
      useForecast({ states: ['TX'], startDate: '2024-01-01' })
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(forecastService.getForecastData).toHaveBeenCalledWith({
      states: ['TX'],
      startDate: '2024-01-01',
    });
  });

  it('should handle errors gracefully', async () => {
    const error = new Error('API Error');
    jest.spyOn(forecastService, 'getForecastData').mockRejectedValue(error);

    const { result } = renderHook(() => useForecast({}));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(error.message);
    expect(result.current.data).toBeNull();
  });
});
```

### 3. Utility Functions (High Priority)

Test pure functions that handle data transformations:

#### Chart Utils Test
`app/demand-planning/lib/__tests__/chart-utils.test.ts`

```typescript
import { describe, it, expect } from '@jest/globals';
import {
  formatChartData,
  aggregateByState,
  calculateTrends
} from '../chart-utils';

describe('Chart Utils', () => {
  describe('formatChartData', () => {
    it('should format forecast data for D3 charts', () => {
      const input = [
        { business_date: '2024-01-01', y_50: 100, state: 'TX' },
        { business_date: '2024-01-02', y_50: 150, state: 'TX' },
      ];

      const result = formatChartData(input);

      expect(result).toEqual([
        { date: new Date('2024-01-01'), value: 100, state: 'TX' },
        { date: new Date('2024-01-02'), value: 150, state: 'TX' },
      ]);
    });

    it('should handle missing data gracefully', () => {
      const result = formatChartData(null);
      expect(result).toEqual([]);
    });
  });

  describe('aggregateByState', () => {
    it('should aggregate forecast data by state', () => {
      const input = [
        { state: 'TX', y_50: 100 },
        { state: 'TX', y_50: 150 },
        { state: 'CA', y_50: 200 },
      ];

      const result = aggregateByState(input);

      expect(result).toEqual({
        TX: { total: 250, average: 125, count: 2 },
        CA: { total: 200, average: 200, count: 1 },
      });
    });
  });
});
```

### 4. React Components (Lower Priority)

Focus on components with logic, not pure UI components:

#### ForecastSummary Component Test
`app/components/forecast/__tests__/ForecastSummary.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import { ForecastSummary } from '../ForecastSummary';

describe('ForecastSummary', () => {
  const mockData = {
    totalForecast: 1000,
    averageForecast: 100,
    forecastGrowth: 15.5,
    confidence: 0.95,
  };

  it('should display forecast metrics', () => {
    render(<ForecastSummary data={mockData} />);

    expect(screen.getByText('1,000')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('+15.5%')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<ForecastSummary data={null} loading={true} />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should handle negative growth', () => {
    render(<ForecastSummary data={{ ...mockData, forecastGrowth: -5.2 }} />);

    const growthElement = screen.getByText('-5.2%');
    expect(growthElement).toHaveClass('text-red-600');
  });
});
```

### 5. API Routes (Medium Priority)

Test your Next.js API routes:

#### Postgres Forecast API Test
`app/api/data/postgres-forecast/__tests__/route.test.ts`

```typescript
import { POST } from '../route';
import { NextRequest } from 'next/server';
import * as postgresForecastService from '@/services/postgresForecastService';

jest.mock('@/services/postgresForecastService');

describe('POST /api/data/postgres-forecast', () => {
  it('should return forecast data for valid request', async () => {
    const mockData = { data: [], totalRecords: 0 };
    jest.spyOn(postgresForecastService, 'getForecastData')
      .mockResolvedValue(mockData);

    const request = new NextRequest('http://localhost:3000/api/data/postgres-forecast', {
      method: 'POST',
      body: JSON.stringify({ states: ['TX'], startDate: '2024-01-01' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockData);
  });

  it('should return 400 for invalid request body', async () => {
    const request = new NextRequest('http://localhost:3000/api/data/postgres-forecast', {
      method: 'POST',
      body: JSON.stringify({ invalid: 'data' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});
```

## Testing Best Practices

### 1. Test Structure
- Use descriptive test names that explain what is being tested
- Group related tests using `describe` blocks
- Follow the AAA pattern: Arrange, Act, Assert

### 2. Mocking Strategy
- Mock external dependencies (APIs, databases)
- Use `jest.mock()` for module mocking
- Clear mocks between tests with `beforeEach`

### 3. Focus Areas
- **Test business logic**, not implementation details
- **Test edge cases**: null values, empty arrays, errors
- **Test async behavior**: loading states, error states

### 4. What NOT to Test
- Third-party libraries (D3, AWS SDK)
- Simple getter/setter functions
- Pure UI components without logic
- Framework code (Next.js internals)

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode during development
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- ForecastSummary.test.tsx
```

## Coverage Goals

For a minimal approach, aim for:
- **Services**: 80%+ coverage
- **Utilities**: 90%+ coverage
- **Hooks**: 70%+ coverage
- **Components**: 50%+ coverage
- **Overall**: 60-70% coverage

## Integration with CI/CD

Add to your GitHub Actions workflow:

```yaml
- name: Run tests
  run: npm test -- --ci --coverage --maxWorkers=2

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

## Pre-commit Integration

To ensure tests run automatically before commits, update your `.pre-commit-config.yaml`:

### Add Jest Hook for Unit Tests

In the `local` hooks section, uncomment or add the Jest configuration:

```yaml
  # 6 — Local heavy gates (push-stage only)
  - repo: local
    hooks:
      # ... existing hooks ...

      - id: jest
        name: "Jest unit tests"
        entry: bash -c "cd src/frontend/nextjs-app && npm test -- --bail --findRelatedTests"
        language: system
        pass_filenames: true
        files: "src/frontend/nextjs-app/.*\\.(ts|tsx|js|jsx)$"
        require_serial: true
        stages: [commit]  # Run on every commit

      - id: jest-coverage
        name: "Jest coverage check"
        entry: bash -c "cd src/frontend/nextjs-app && npm test -- --coverage --coverageThreshold='{\"global\":{\"branches\":50,\"functions\":50,\"lines\":60,\"statements\":60}}'"
        language: system
        pass_filenames: false
        stages: [push]  # Run only on push to avoid slowing down commits
```

### Configuration Options

1. **Fast Mode (Recommended for commits)**:
   - Uses `--findRelatedTests` to only run tests for changed files
   - Runs on every commit for fast feedback
   - Uses `--bail` to stop on first test failure

2. **Full Coverage Mode (For pushes)**:
   - Runs all tests with coverage
   - Enforces minimum coverage thresholds
   - Only runs on push to avoid slowing down development

### Install and Update Pre-commit

After updating the configuration:

```bash
# Install/update pre-commit hooks
pre-commit install
pre-commit install --hook-type pre-push

# Test the Jest hook manually
pre-commit run jest --all-files

# Test only on specific files
pre-commit run jest --files src/frontend/nextjs-app/app/services/forecastService.ts
```

### Alternative: Lightweight Test Runner

For even faster commits, create a custom test runner that only tests changed files:

```yaml
      - id: jest-changed
        name: "Jest changed files only"
        entry: bash -c "cd src/frontend/nextjs-app && npx jest --bail --passWithNoTests --findRelatedTests"
        language: system
        pass_filenames: true
        files: "src/frontend/nextjs-app/.*\\.(test|spec)\\.(ts|tsx|js|jsx)$"
        require_serial: true
```

## Next Steps

1. Start with testing services and utilities (highest ROI)
2. Add tests for critical business logic in hooks
3. Test components that handle complex state
4. Gradually increase coverage as the app grows
5. Configure pre-commit hooks to enforce testing standards
