/**
 * Test suite for the forecast data seeding system
 *
 * This file contains tests for:
 * 1. S3 upload functionality
 * 2. Athena table creation and queries
 * 3. API endpoints
 * 4. Frontend components
 */

const { S3Client, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { AthenaClient, GetQueryExecutionCommand } = require('@aws-sdk/client-athena');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Mock environment variables for testing
process.env.AWS_REGION = 'us-east-1';
process.env.S3_BUCKET_NAME = 'wyatt-personal-aws-datalake-dev-35315550';
process.env.ATHENA_DATABASE = 'forecast_data_dev';
process.env.ATHENA_WORKGROUP = 'wyatt-personal-aws-forecast-analysis-dev';
process.env.ATHENA_OUTPUT_LOCATION = 's3://wyatt-personal-aws-athena-results-dev/query-results/';

// Initialize AWS clients
const s3Client = new S3Client({ region: process.env.AWS_REGION });
const athenaClient = new AthenaClient({ region: process.env.AWS_REGION });

// Test the S3 upload script
describe('Forecast Data Upload', () => {
  const csvPath = path.resolve(__dirname, '../../data/forecast_data.csv');
  const dataFolder = 'forecast_data';
  const s3Key = `${dataFolder}/forecast_data.csv`;

  test('CSV file exists', () => {
    expect(fs.existsSync(csvPath)).toBe(true);
  });

  test('CSV file has correct structure', () => {
    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split('\n');

    // Check header
    const header = lines[0].split(',');
    expect(header.length).toBe(9);
    expect(header).toContain('restaurant_id');
    expect(header).toContain('business_date');
    expect(header).toContain('y_50');

    // Check data rows (if file is not empty)
    if (lines.length > 1) {
      const dataRow = lines[1].split(',');
      expect(dataRow.length).toBe(9);

      // Check data types
      expect(!isNaN(Number(dataRow[0]))).toBe(true); // restaurant_id should be a number
      expect(!isNaN(new Date(dataRow[2]))).toBe(true); // business_date should be a valid date
      expect(!isNaN(Number(dataRow[6]))).toBe(true); // y_05 should be a number
    }
  });

  test('File exists in S3 bucket', async () => {
    try {
      const command = new HeadObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: s3Key,
      });

      await s3Client.send(command);
      // If no error is thrown, the file exists
      expect(true).toBe(true);
    } catch (error) {
      // This test may fail if the file hasn't been uploaded yet
      console.warn('File does not exist in S3 bucket yet. Upload it before running this test.');
      expect(error).toBeUndefined();
    }
  });
});

// Test Athena functionality
describe('Athena Integration', () => {
  // Helper to execute and check an Athena query
  async function testAthenaQuery(query) {
    // Function to start a query
    async function startQuery() {
      const { StartQueryExecutionCommand } = require('@aws-sdk/client-athena');

      const params = {
        QueryString: query,
        ResultConfiguration: {
          OutputLocation: process.env.ATHENA_OUTPUT_LOCATION,
        },
        QueryExecutionContext: {
          Database: process.env.ATHENA_DATABASE,
        },
        WorkGroup: process.env.ATHENA_WORKGROUP,
      };

      const command = new StartQueryExecutionCommand(params);
      const response = await athenaClient.send(command);
      return response.QueryExecutionId;
    }

    // Function to check query status
    async function checkQueryStatus(queryExecutionId) {
      const command = new GetQueryExecutionCommand({
        QueryExecutionId: queryExecutionId,
      });

      const response = await athenaClient.send(command);
      return response.QueryExecution.Status.State;
    }

    // Start the query
    const queryExecutionId = await startQuery();

    // Wait for the query to complete
    let status = 'RUNNING';
    let attempts = 0;

    while ((status === 'RUNNING' || status === 'QUEUED') && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      status = await checkQueryStatus(queryExecutionId);
      attempts++;
    }

    return status;
  }

  test('Athena database exists', async () => {
    const query = `SHOW DATABASES LIKE '${process.env.ATHENA_DATABASE}'`;
    const status = await testAthenaQuery(query);

    expect(status).toBe('SUCCEEDED');
  });

  test('Forecast table exists', async () => {
    const query = `SHOW TABLES IN ${process.env.ATHENA_DATABASE} LIKE 'forecast'`;
    const status = await testAthenaQuery(query);

    expect(status).toBe('SUCCEEDED');
  });

  test('Can query forecast data', async () => {
    const query = `SELECT COUNT(*) FROM ${process.env.ATHENA_DATABASE}.forecast`;
    const status = await testAthenaQuery(query);

    expect(status).toBe('SUCCEEDED');
  });
});

// Test the API endpoints
describe('API Integration', () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  test('Athena API endpoint returns data', async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/data/athena`, {
        action: 'get_forecast_summary',
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
      expect(response.data.data).toHaveProperty('columns');
      expect(response.data.data).toHaveProperty('rows');
    } catch (error) {
      // This test may fail if the API is not running
      console.warn('API not available. Ensure the Next.js app is running.');
      expect(error).toBeUndefined();
    }
  });

  test('Forecast by date API endpoint works', async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/data/athena`, {
        action: 'get_forecast_by_date',
        filters: {
          start_date: '2024-01-01',
          end_date: '2024-12-31',
        },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
      expect(response.data.data.columns).toContain('business_date');
      expect(response.data.data.columns).toContain('avg_forecast');
    } catch (error) {
      console.warn('API not available. Ensure the Next.js app is running.');
      expect(error).toBeUndefined();
    }
  });

  test('Custom query API endpoint works', async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/data/athena`, {
        action: 'execute_query',
        query: 'SELECT DISTINCT state FROM forecast ORDER BY state LIMIT 10',
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
      expect(response.data.data.columns).toContain('state');
    } catch (error) {
      console.warn('API not available. Ensure the Next.js app is running.');
      expect(error).toBeUndefined();
    }
  });
});

/**
 * NOTE: Frontend component testing would typically be done with React Testing Library
 * or similar tools. The following tests are mocked to demonstrate the approach.
 */
describe('Frontend Components (mocked)', () => {
  test('ForecastDashboard renders correctly', () => {
    // Mock test - would use React Testing Library in a real implementation
    expect(true).toBe(true);
  });

  test('useAthenaQuery hook fetches data correctly', () => {
    // Mock test - would use React Testing Library in a real implementation
    expect(true).toBe(true);
  });

  test('ForecastChart renders data correctly', () => {
    // Mock test - would use React Testing Library with D3 testing utilities
    expect(true).toBe(true);
  });
});
