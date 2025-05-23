#!/usr/bin/env node

// Skip build unless triggered by GitHub Actions
if (process.env.GITHUB_ACTIONS === 'true') {
  console.log('Building from GitHub Actions - proceeding...');
  process.exit(1); // Continue build
} else {
  console.log('Skipping build - not from GitHub Actions');
  process.exit(0); // Skip build
}
