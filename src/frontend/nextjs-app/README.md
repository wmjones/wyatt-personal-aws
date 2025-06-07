This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Testing

This project uses Jest and React Testing Library for unit testing.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage report
npm test -- --coverage

# Run tests for a specific file
npm test -- --testPathPattern=chart-utils

# Run tests that match a pattern
npm test -- --testNamePattern="should calculate"
```

### Test Coverage

The project maintains the following coverage thresholds:
- Branches: 50%
- Functions: 50%
- Lines: 60%
- Statements: 60%

Utility functions in `app/demand-planning/lib/` maintain at least 80% coverage.

### Pre-commit Hooks

Tests are automatically run before commits through pre-commit hooks. The hooks will:
1. Run ESLint to check for code quality issues
2. Run TypeScript type checking
3. Run Jest tests for changed files

If any tests fail, the commit will be blocked until issues are resolved.

### Writing Tests

Test files should be placed in `__tests__` directories next to the code they test, with the naming convention `[filename].test.ts(x)`.

Example structure:
```
app/services/
  forecastService.ts
  __tests__/
    forecastService.test.ts
```

For more detailed testing guidelines, see [docs/testing-guide.md](docs/testing-guide.md).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# Trigger deployment
