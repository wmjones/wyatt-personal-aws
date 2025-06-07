#!/usr/bin/env tsx

/**
 * Monitoring script for branch resources
 *
 * This script checks the status of Vercel environment variables and Neon database branches
 * to ensure everything is properly configured and identify any orphaned resources.
 */

import { execSync } from 'child_process';

interface BranchResource {
  name: string;
  vercelEnvVars: string[];
  neonBranch: boolean;
  lastActivity?: Date;
}

interface VercelEnvVar {
  key: string;
  target: string[];
  gitBranch?: string;
}

// Configuration
const PROTECTED_BRANCHES = ['main', 'dev'];
const EXPECTED_ENV_VARS = ['DATABASE_URL', 'DATABASE_URL_UNPOOLED', 'DEPLOYMENT_BRANCH'];

// Helper to run shell commands
function runCommand(command: string): string {
  try {
    return execSync(command, { encoding: 'utf-8' }).trim();
  } catch (error) {
    console.error(`Command failed: ${command}`);
    return '';
  }
}

// Get all Vercel environment variables
async function getVercelEnvVars(): Promise<VercelEnvVar[]> {
  console.log('📋 Fetching Vercel environment variables...');

  const output = runCommand('vercel env ls --json');
  if (!output) return [];

  try {
    const envVars = JSON.parse(output);
    return envVars;
  } catch (error) {
    console.error('Failed to parse Vercel env vars:', error);
    return [];
  }
}

// Get all Neon branches
async function getNeonBranches(): Promise<string[]> {
  console.log('🗄️ Fetching Neon database branches...');

  const projectId = process.env.NEON_PROJECT_ID;
  const apiKey = process.env.NEON_API_KEY;

  if (!projectId || !apiKey) {
    console.error('Missing NEON_PROJECT_ID or NEON_API_KEY');
    return [];
  }

  const response = await fetch(
    `https://console.neon.tech/api/v2/projects/${projectId}/branches`,
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    }
  );

  if (!response.ok) {
    console.error('Failed to fetch Neon branches:', response.statusText);
    return [];
  }

  const data = await response.json();
  return data.branches.map((branch: any) => branch.name);
}

// Get active Git branches
function getGitBranches(): string[] {
  console.log('🌿 Fetching Git branches...');

  const remoteBranches = runCommand('git branch -r')
    .split('\n')
    .map(branch => branch.trim())
    .filter(branch => branch && !branch.includes('HEAD'))
    .map(branch => branch.replace('origin/', ''));

  return remoteBranches;
}

// Analyze branch resources
async function analyzeBranchResources() {
  const vercelEnvVars = await getVercelEnvVars();
  const neonBranches = await getNeonBranches();
  const gitBranches = getGitBranches();

  console.log('\n📊 Branch Resource Analysis\n');
  console.log('='.repeat(80));

  // Group env vars by branch
  const branchResources = new Map<string, BranchResource>();

  // Initialize with Git branches
  gitBranches.forEach(branch => {
    branchResources.set(branch, {
      name: branch,
      vercelEnvVars: [],
      neonBranch: false,
    });
  });

  // Add Vercel env vars
  vercelEnvVars.forEach(envVar => {
    if (envVar.gitBranch) {
      const resource = branchResources.get(envVar.gitBranch) || {
        name: envVar.gitBranch,
        vercelEnvVars: [],
        neonBranch: false,
      };
      resource.vercelEnvVars.push(envVar.key);
      branchResources.set(envVar.gitBranch, resource);
    }
  });

  // Add Neon branches
  neonBranches.forEach(branch => {
    const branchName = branch.replace('branch/', '');
    const resource = branchResources.get(branchName) || {
      name: branchName,
      vercelEnvVars: [],
      neonBranch: false,
    };
    resource.neonBranch = true;
    branchResources.set(branchName, resource);
  });

  // Display results
  const activeGitBranches: BranchResource[] = [];
  const orphanedResources: BranchResource[] = [];

  branchResources.forEach((resource, branchName) => {
    if (gitBranches.includes(branchName)) {
      activeGitBranches.push(resource);
    } else if (!PROTECTED_BRANCHES.includes(branchName)) {
      orphanedResources.push(resource);
    }
  });

  // Active branches
  console.log('✅ Active Git Branches with Resources:');
  console.log('-'.repeat(80));
  activeGitBranches.forEach(resource => {
    console.log(`\n🌿 ${resource.name}`);
    console.log(`   Vercel Env Vars: ${resource.vercelEnvVars.length > 0 ? resource.vercelEnvVars.join(', ') : '❌ None'}`);
    console.log(`   Neon Branch: ${resource.neonBranch ? '✅ Yes' : '❌ No'}`);

    // Check for missing resources
    const missingVars = EXPECTED_ENV_VARS.filter(v => !resource.vercelEnvVars.includes(v));
    if (missingVars.length > 0 && !PROTECTED_BRANCHES.includes(resource.name)) {
      console.log(`   ⚠️ Missing env vars: ${missingVars.join(', ')}`);
    }
  });

  // Orphaned resources
  if (orphanedResources.length > 0) {
    console.log('\n\n❌ Orphaned Resources (branch no longer exists):');
    console.log('-'.repeat(80));
    orphanedResources.forEach(resource => {
      console.log(`\n🗑️ ${resource.name}`);
      console.log(`   Vercel Env Vars: ${resource.vercelEnvVars.join(', ') || 'None'}`);
      console.log(`   Neon Branch: ${resource.neonBranch ? 'Yes' : 'No'}`);
      console.log(`   ⚠️ This branch should be cleaned up!`);
    });
  }

  // Summary
  console.log('\n\n📈 Summary:');
  console.log('-'.repeat(80));
  console.log(`Active Git Branches: ${gitBranches.length}`);
  console.log(`Branches with Vercel Env Vars: ${Array.from(branchResources.values()).filter(r => r.vercelEnvVars.length > 0).length}`);
  console.log(`Neon Database Branches: ${neonBranches.length}`);
  console.log(`Orphaned Resources: ${orphanedResources.length}`);

  if (orphanedResources.length > 0) {
    console.log('\n⚠️ Run the cleanup workflow or manually clean up orphaned resources.');
  }
}

// Cleanup helper
function generateCleanupCommands(branchName: string) {
  console.log(`\n🧹 Cleanup commands for branch: ${branchName}`);
  console.log('```bash');
  console.log(`# Remove Vercel env vars`);
  EXPECTED_ENV_VARS.forEach(envVar => {
    console.log(`vercel env rm ${envVar} production --git-branch="${branchName}" --yes`);
  });
  console.log(`\n# Delete Neon branch (need to get branch ID first)`);
  console.log(`# Run: scripts/cleanup-neon-branch.sh "${branchName}"`);
  console.log('```');
}

// Main execution
async function main() {
  console.log('🔍 Branch Resource Monitor');
  console.log('========================\n');

  // Check prerequisites
  if (!process.env.VERCEL_TOKEN) {
    console.error('❌ VERCEL_TOKEN environment variable is required');
    console.log('Export it with: export VERCEL_TOKEN=your_token');
    process.exit(1);
  }

  try {
    await analyzeBranchResources();

    // If cleanup flag is passed, show cleanup commands
    if (process.argv.includes('--cleanup')) {
      const branchToClean = process.argv[process.argv.indexOf('--cleanup') + 1];
      if (branchToClean) {
        generateCleanupCommands(branchToClean);
      }
    }
  } catch (error) {
    console.error('❌ Error during analysis:', error);
    process.exit(1);
  }
}

// Help text
if (process.argv.includes('--help')) {
  console.log(`
Branch Resource Monitor

Usage:
  tsx scripts/monitor-branch-resources.ts [options]

Options:
  --cleanup <branch>  Show cleanup commands for a specific branch
  --help             Show this help message

Environment Variables:
  VERCEL_TOKEN       Required for Vercel API access
  NEON_API_KEY       Required for Neon API access
  NEON_PROJECT_ID    Required for Neon API access

Example:
  export VERCEL_TOKEN=your_token
  export NEON_API_KEY=your_key
  export NEON_PROJECT_ID=your_project_id
  tsx scripts/monitor-branch-resources.ts
  `);
  process.exit(0);
}

main();
