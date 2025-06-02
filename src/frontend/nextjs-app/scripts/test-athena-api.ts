#!/usr/bin/env node

// Note: This script requires environment variables to be set
// Run with: AWS_API_GATEWAY_URL=your-url npx tsx scripts/test-athena-api.ts

async function testAthenaAPI() {
  const apiUrl = process.env.AWS_API_GATEWAY_URL;

  if (!apiUrl) {
    console.error('❌ AWS_API_GATEWAY_URL is not set');
    console.log('💡 Usage: AWS_API_GATEWAY_URL=https://your-api-gateway-url npx tsx scripts/test-athena-api.ts');
    process.exit(1);
  }

  console.log('🔍 Testing Athena API...');
  console.log(`📍 API Gateway URL: ${apiUrl}`);

  const testBody = {
    action: 'get_forecast_summary',
    filters: {}
  };

  try {
    console.log('\n📤 Sending request to:', `${apiUrl}/api/data/athena/query`);
    console.log('📦 Request body:', JSON.stringify(testBody, null, 2));

    // Use native fetch (available in Node.js 18+)
    const response = await fetch(`${apiUrl}/api/data/athena/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testBody),
    });

    console.log('\n📥 Response status:', response.status, response.statusText);

    const responseData = await response.json();
    console.log('📄 Response data:', JSON.stringify(responseData, null, 2));

    if (response.ok) {
      console.log('\n✅ Athena API test successful!');
    } else {
      console.log('\n❌ Athena API test failed');
      console.log('Error details:', responseData);
    }
  } catch (error) {
    console.error('\n❌ Error testing Athena API:', error);
  }
}

// Run the test
testAthenaAPI();
