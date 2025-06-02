# Testing Guide for Next.js Demand Planning App

This guide documents the testing patterns and conventions used in the project.

## Overview

We use Jest and React Testing Library for unit and integration testing. Tests are run automatically via pre-commit hooks to ensure code quality.

## Test File Organization

```
app/
├── components/
│   └── forecast/
│       ├── ForecastSummary.tsx
│       └── __tests__/
│           └── ForecastSummary.test.tsx
├── services/
│   ├── forecastService.ts
│   └── __tests__/
│       └── forecastService.test.ts
└── lib/
    ├── chart-utils.ts
    └── __tests__/
        └── chart-utils.test.ts
```

## Naming Conventions

- Test files should be colocated with the code they test in `__tests__` directories
- Test files should have the same name as the file being tested with `.test.ts(x)` extension
- Test suites should use `describe` blocks matching the module/component name
- Test cases should have descriptive names using `it` or `test`

## Testing Patterns

### 1. Service Testing

Services handle business logic and external API calls. Mock external dependencies:

```typescript
// Mock external modules
jest.mock('../postgresForecastService', () => ({
  postgresForecastService: {
    getForecastData: jest.fn(),
  }
}));

describe('ForecastService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should transform data to expected format', async () => {
    // Arrange
    const mockData = [{ /* mock data */ }];
    (postgresForecastService.getForecastData as jest.Mock)
      .mockResolvedValueOnce(mockData);

    // Act
    const result = await forecastService.getForecastData(filters);

    // Assert
    expect(result).toMatchObject(expectedFormat);
  });
});
```

### 2. Component Testing

Focus on user interactions and rendered output:

```typescript
describe('ForecastSummary', () => {
  it('should display forecast metrics', () => {
    render(<ForecastSummary data={mockData} />);

    expect(screen.getByText('1,000')).toBeInTheDocument();
    expect(screen.getByText('Loading')).not.toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    render(<Component />);

    const button = screen.getByRole('button', { name: /submit/i });
    await userEvent.click(button);

    expect(screen.getByText('Success')).toBeInTheDocument();
  });
});
```

### 3. Hook Testing

Use `@testing-library/react` renderHook:

```typescript
describe('useForecast', () => {
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('should fetch data on mount', async () => {
    const { result } = renderHook(() => useForecast(params), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
  });
});
```

### 4. Utility Function Testing

Test pure functions thoroughly with edge cases:

```typescript
describe('formatNumber', () => {
  it.each([
    [1000, '1k'],
    [1500000, '1.5M'],
    [0, '0'],
    [999, '999'],
  ])('should format %i as %s', (input, expected) => {
    expect(formatNumber(input)).toBe(expected);
  });
});
```

## Mocking Strategies

### 1. Module Mocking

```typescript
jest.mock('@/services/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  }
}));
```

### 2. Environment Variables

Set in `jest.setup.js`:

```javascript
process.env = {
  ...process.env,
  NEXT_PUBLIC_API_URL: 'http://localhost:3000',
};
```

### 3. External Libraries

Mock complex libraries like D3:

```javascript
// jest.config.mjs
moduleNameMapper: {
  '^d3$': '<rootDir>/node_modules/d3/dist/d3.min.js',
}
```

## Best Practices

### Do:
- ✅ Test behavior, not implementation
- ✅ Use descriptive test names
- ✅ Test edge cases and error states
- ✅ Keep tests focused and isolated
- ✅ Use data-testid sparingly
- ✅ Mock external dependencies
- ✅ Test accessibility (use role queries)

### Don't:
- ❌ Test framework code
- ❌ Test third-party libraries
- ❌ Create brittle tests tied to implementation
- ❌ Leave console.log in tests
- ❌ Use arbitrary waits (use waitFor instead)
- ❌ Test styles or CSS classes

## Running Tests

```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npm test ForecastSummary.test.tsx
```

## Pre-commit Integration

Tests run automatically on commit:
- **On commit**: Related test files run with `--findRelatedTests`
- **On push**: Full test suite runs with coverage check

Coverage thresholds:
- Branches: 50%
- Functions: 50%
- Lines: 60%
- Statements: 60%

## Common Testing Scenarios

### Testing Loading States

```typescript
it('should show loading state', () => {
  render(<Component loading={true} />);
  expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
});
```

### Testing Error States

```typescript
it('should display error message', () => {
  render(<Component error="Failed to load" />);
  expect(screen.getByText('Failed to load')).toBeInTheDocument();
});
```

### Testing Async Operations

```typescript
it('should handle async data fetching', async () => {
  render(<Component />);

  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});
```

### Testing Form Submissions

```typescript
it('should submit form with valid data', async () => {
  const onSubmit = jest.fn();
  render(<Form onSubmit={onSubmit} />);

  await userEvent.type(screen.getByLabelText('Name'), 'John Doe');
  await userEvent.click(screen.getByRole('button', { name: /submit/i }));

  expect(onSubmit).toHaveBeenCalledWith({ name: 'John Doe' });
});
```

## Debugging Tests

1. Use `screen.debug()` to see the current DOM
2. Use `screen.logTestingPlaygroundURL()` for interactive debugging
3. Add `console.log` temporarily (remove before commit)
4. Run single test with `.only`: `it.only('should...')`
5. Skip tests with `.skip`: `it.skip('should...')`

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [Common Testing Patterns](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
