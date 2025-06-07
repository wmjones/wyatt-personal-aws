import { toPostgresDate } from '../app/lib/date-utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function testForecastAPI() {
  console.log('=== Testing Forecast API with Date Range ===\n');

  // Test dates
  const startDate = new Date('2024-12-31');
  const endDate = new Date('2025-01-17');

  console.log('1. Testing date conversion:');
  console.log(`  Start Date: ${startDate.toISOString()} -> ${toPostgresDate(startDate)}`);
  console.log(`  End Date: ${endDate.toISOString()} -> ${toPostgresDate(endDate)}`);
  console.log();

  // Prepare request payload
  const payload = {
    startDate: toPostgresDate(startDate),
    endDate: toPostgresDate(endDate),
    filters: {}
  };

  console.log('2. Request payload:');
  console.log(JSON.stringify(payload, null, 2));
  console.log();

  try {
    console.log('3. Making API request...');
    const response = await fetch(`${API_URL}/api/data/postgres-forecast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('API Error:', data);
      return;
    }

    console.log('4. Response summary:');
    console.log(`  Status: ${response.status}`);
    console.log(`  Total records: ${data.data?.length || 0}`);
    console.log();

    if (data.data && data.data.length > 0) {
      // Extract unique dates from response
      const dates = [...new Set(data.data.map((item: any) => item.date))].sort();

      console.log('5. Date range in response:');
      console.log(`  First date: ${dates[0]}`);
      console.log(`  Last date: ${dates[dates.length - 1]}`);
      console.log(`  Total unique dates: ${dates.length}`);
      console.log();

      console.log('6. All dates in response:');
      dates.forEach(date => {
        const count = data.data.filter((item: any) => item.date === date).length;
        console.log(`  ${date}: ${count} records`);
      });

      // Check for missing dates
      console.log('\n7. Checking for missing dates in the requested range:');
      const requestedDates = [];
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        requestedDates.push(toPostgresDate(new Date(d)));
      }

      const missingDates = requestedDates.filter(date => !dates.includes(date));
      if (missingDates.length > 0) {
        console.log(`  Found ${missingDates.length} missing dates:`);
        missingDates.forEach(date => console.log(`    - ${date}`));
      } else {
        console.log('  No missing dates found');
      }
    } else {
      console.log('No data returned from API');
    }

  } catch (error) {
    console.error('Error testing API:', error);
  }
}

// Additional test with raw SQL query simulation
async function testDateLogic() {
  console.log('\n=== Testing Date Logic ===\n');

  const startDate = new Date('2024-12-31');
  const endDate = new Date('2025-01-17');

  console.log('Date parsing check:');
  console.log(`  JavaScript Date: ${startDate.toISOString()}`);
  console.log(`  toPostgresDate: ${toPostgresDate(startDate)}`);
  console.log(`  Direct format: ${startDate.toISOString().split('T')[0]}`);

  // Check if dates are being shifted due to timezone
  console.log('\nTimezone check:');
  console.log(`  Local timezone offset: ${startDate.getTimezoneOffset()} minutes`);
  console.log(`  UTC Date: ${startDate.toUTCString()}`);
  console.log(`  Local Date: ${startDate.toString()}`);
}

// Run tests
async function main() {
  await testDateLogic();
  console.log('\n' + '='.repeat(50) + '\n');
  await testForecastAPI();
}

main();
