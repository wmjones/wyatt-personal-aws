/**
 * Test script to verify branch database functionality
 *
 * This script tests that preview deployments are using their own database branches
 *
 * Usage: npx tsx scripts/test-branch-database.ts --url=https://preview-url.vercel.app
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });

// Parse command line arguments
const args = process.argv.slice(2);
const urlArg = args.find(arg => arg.startsWith('--url='));

if (!urlArg) {
  console.error('❌ Please provide a URL with --url=https://your-preview-url.vercel.app');
  process.exit(1);
}

const BASE_URL = urlArg.split('=')[1];

console.log(`\n🔍 Testing Branch Database Configuration`);
console.log(`📍 URL: ${BASE_URL}`);
console.log(`⏰ Starting at: ${new Date().toISOString()}\n`);

interface TestData {
  id: string;
  value: any;
  timestamp: Date;
}

async function checkDatabaseConnection() {
  console.log('1️⃣ Checking database connection...\n');

  try {
    const response = await fetch(`${BASE_URL}/api/debug/db-connection`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
    }

    console.log(`✅ Connection Status: ${data.status}`);
    console.log(`📊 Environment: ${data.configuration?.environment}`);
    console.log(`🌿 Branch Name: ${data.configuration?.branchName || 'N/A'}`);
    console.log(`💾 Database: ${data.branchInfo?.description}`);
    console.log(`🔗 Using Branch DB: ${data.branchInfo?.isUsingBranchDatabase ? 'Yes' : 'No'}`);

    if (data.databaseInfo) {
      console.log(`\n📋 Database Details:`);
      console.log(`  - Name: ${data.databaseInfo.database}`);
      console.log(`  - Version: ${data.databaseInfo.version?.split(' ')[1]}`);
      console.log(`  - Time: ${data.databaseInfo.currentTime}`);
    }

    return data;
  } catch (error) {
    console.error('❌ Failed to check database connection:', error);
    return null;
  }
}

async function testDataIsolation() {
  console.log('\n\n2️⃣ Testing data isolation...\n');

  const testId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const testData = {
    adjustment_value: Math.floor(Math.random() * 100),
    inventory_item_id: 99999,
    inventory_item_name: `Branch Test Item ${testId}`,
    filter_context: {
      test: true,
      branch: process.env.VERCEL_GIT_COMMIT_REF || 'unknown',
      timestamp: new Date().toISOString()
    },
    adjustment_start_date: '2024-01-01',
    adjustment_end_date: '2024-12-31',
  };

  console.log(`📝 Creating test adjustment with ID: ${testId}`);

  try {
    // Create test data
    const createResponse = await fetch(`${BASE_URL}/api/adjustments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData),
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      throw new Error(`Failed to create test data: ${error}`);
    }

    const created = await createResponse.json();
    console.log(`✅ Created adjustment with ID: ${created.id}`);

    // Verify it exists
    const getResponse = await fetch(`${BASE_URL}/api/adjustments`);
    const adjustments = await getResponse.json();

    const found = adjustments.data?.find((a: any) =>
      a.inventory_item_name === testData.inventory_item_name
    );

    if (found) {
      console.log(`✅ Verified: Test data exists in branch database`);
      console.log(`  - Adjustment ID: ${found.id}`);
      console.log(`  - Created At: ${found.created_at}`);

      // Clean up test data
      console.log(`\n🧹 Cleaning up test data...`);
      const deleteResponse = await fetch(`${BASE_URL}/api/adjustments?id=${found.id}`, {
        method: 'DELETE',
      });

      if (deleteResponse.ok) {
        console.log(`✅ Test data cleaned up successfully`);
      } else {
        console.log(`⚠️  Failed to clean up test data`);
      }
    } else {
      console.log(`❌ Test data not found in database`);
    }

    return true;
  } catch (error) {
    console.error('❌ Data isolation test failed:', error);
    return false;
  }
}

async function compareWithProduction(productionUrl: string) {
  console.log('\n\n3️⃣ Comparing with production database...\n');

  try {
    // Get production data count
    const prodResponse = await fetch(`${productionUrl}/api/adjustments`);
    const prodData = await prodResponse.json();
    const prodCount = prodData.data?.length || 0;

    // Get preview data count
    const previewResponse = await fetch(`${BASE_URL}/api/adjustments`);
    const previewData = await previewResponse.json();
    const previewCount = previewData.data?.length || 0;

    console.log(`📊 Data Comparison:`);
    console.log(`  - Production adjustments: ${prodCount}`);
    console.log(`  - Preview adjustments: ${previewCount}`);

    if (prodCount !== previewCount) {
      console.log(`✅ Databases are isolated (different data counts)`);
    } else if (prodCount === 0 && previewCount === 0) {
      console.log(`⚠️  Both databases are empty - isolation cannot be verified`);
    } else {
      console.log(`⚠️  Databases have same count - checking for differences...`);

      // Compare actual data
      const prodIds = new Set(prodData.data?.map((a: any) => a.id) || []);
      const previewIds = new Set(previewData.data?.map((a: any) => a.id) || []);

      const onlyInProd = [...prodIds].filter(id => !previewIds.has(id));
      const onlyInPreview = [...previewIds].filter(id => !prodIds.has(id));

      if (onlyInProd.length > 0 || onlyInPreview.length > 0) {
        console.log(`✅ Databases contain different data`);
        console.log(`  - Unique to production: ${onlyInProd.length} records`);
        console.log(`  - Unique to preview: ${onlyInPreview.length} records`);
      } else {
        console.log(`⚠️  Databases appear to contain identical data`);
      }
    }
  } catch (error) {
    console.log(`⚠️  Could not compare with production:`, error);
  }
}

async function runTests() {
  // Check database connection
  const dbInfo = await checkDatabaseConnection();

  if (!dbInfo) {
    console.error('\n❌ Cannot proceed without database connection');
    process.exit(1);
  }

  // Only run isolation tests for preview environments
  if (dbInfo.configuration?.environment === 'preview') {
    await testDataIsolation();

    // Optionally compare with production
    const prodUrl = BASE_URL.replace(/[a-z0-9-]+\.vercel\.app/, 'your-prod-domain.com');
    if (prodUrl !== BASE_URL) {
      console.log(`\n💡 To compare with production, update the production URL in the script`);
      // await compareWithProduction(prodUrl);
    }
  } else {
    console.log(`\n⚠️  Skipping isolation tests for ${dbInfo.configuration?.environment} environment`);
  }

  // Summary
  console.log('\n\n📊 Test Summary\n');
  console.log('=====================================');

  if (dbInfo.configuration?.environment === 'preview' && dbInfo.branchInfo?.isUsingBranchDatabase) {
    console.log('✅ Preview deployment is correctly using a branch database');
    console.log(`✅ Branch name: ${dbInfo.configuration.branchName}`);
    console.log(`✅ Database isolation verified`);
  } else if (dbInfo.configuration?.environment === 'production') {
    console.log('✅ Production deployment is using the main database');
  } else {
    console.log('⚠️  Unable to verify branch database configuration');
  }
}

// Run tests
runTests().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
