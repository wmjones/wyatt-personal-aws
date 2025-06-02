#!/usr/bin/env node

// Skip build unless triggered by GitHub Actions or from dev branch
const branch = process.env.VERCEL_GIT_COMMIT_REF;
const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';
const isDevBranch = branch === 'dev';

if (isGitHubActions) {
  console.log('Building from GitHub Actions - proceeding...');
  process.exit(1); // Continue build
} else if (isDevBranch) {
  console.log('Building from dev branch - proceeding...');
  process.exit(1); // Continue build
} else {
  console.log(`Skipping build - branch: ${branch}, not from GitHub Actions or dev branch`);
  process.exit(0); // Skip build
}
