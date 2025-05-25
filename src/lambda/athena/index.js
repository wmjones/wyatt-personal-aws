const { AthenaClient, StartQueryExecutionCommand, GetQueryExecutionCommand, GetQueryResultsCommand } = require('@aws-sdk/client-athena');
const { GetObjectCommand, S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Initialize clients
const athenaClient = new AthenaClient({ region: process.env.AWS_REGION });
const s3Client = new S3Client({ region: process.env.AWS_REGION });

// Environment variables
const ATHENA_DB_NAME = process.env.ATHENA_DB_NAME;
const ATHENA_WORKGROUP = process.env.ATHENA_WORKGROUP;
const OUTPUT_LOCATION = process.env.OUTPUT_LOCATION;
const DATA_BUCKET = process.env.DATA_BUCKET;
const DATA_FOLDER = process.env.DATA_FOLDER;
const FORECAST_TABLE_NAME = process.env.FORECAST_TABLE_NAME;

/**
 * Create Athena table for forecast data if it doesn't exist
 */
const createForecastTable = async () => {
  // Query to check if table exists
  const checkTableQuery = `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = '${ATHENA_DB_NAME}'
    AND table_name = '${FORECAST_TABLE_NAME}'
  `;

  // Execute the check table query
  const checkResult = await executeQuery(checkTableQuery);
  const tableExists = checkResult.rows && checkResult.rows.length > 0;

  if (!tableExists) {
    // Define CREATE TABLE query for forecast data
    const createTableQuery = `
      CREATE EXTERNAL TABLE ${FORECAST_TABLE_NAME} (
        restaurant_id INT,
        inventory_item_id INT,
        business_date DATE,
        dma_id STRING,
        dc_id INT,
        state STRING,
        y_05 DOUBLE,
        y_50 DOUBLE,
        y_95 DOUBLE
      )
      ROW FORMAT DELIMITED
      FIELDS TERMINATED BY ','
      LINES TERMINATED BY '\\n'
      STORED AS TEXTFILE
      LOCATION 's3://${DATA_BUCKET}/${DATA_FOLDER}/'
      TBLPROPERTIES ('skip.header.line.count'='1');
    `;

    // Execute the create table query
    console.log('Creating Forecast table in Athena...');
    await executeQuery(createTableQuery);
    console.log('Forecast table created successfully');
  } else {
    console.log('Forecast table already exists in Athena');
  }
};

/**
 * Execute an Athena query and return the results
 */
const executeQuery = async (query) => {
  try {
    // Start the query execution
    const startQueryParams = {
      QueryString: query,
      ResultConfiguration: {
        OutputLocation: OUTPUT_LOCATION,
      },
      QueryExecutionContext: {
        Database: ATHENA_DB_NAME,
      },
      WorkGroup: ATHENA_WORKGROUP,
    };

    const startQueryCommand = new StartQueryExecutionCommand(startQueryParams);
    const { QueryExecutionId } = await athenaClient.send(startQueryCommand);

    // Wait for query to complete
    const queryStatus = await waitForQueryToComplete(QueryExecutionId);

    if (queryStatus !== 'SUCCEEDED') {
      throw new Error(`Query failed with status: ${queryStatus}`);
    }

    // Get query results
    const getResultsParams = {
      QueryExecutionId,
    };

    const getResultsCommand = new GetQueryResultsCommand(getResultsParams);
    const results = await athenaClient.send(getResultsCommand);

    // Process and return the results
    return processResults(results);
  } catch (error) {
    console.error('Error executing Athena query:', error);
    throw error;
  }
};

/**
 * Wait for an Athena query to complete
 */
const waitForQueryToComplete = async (queryExecutionId) => {
  let status = 'RUNNING';
  let attempts = 0;

  while (status === 'RUNNING' || status === 'QUEUED') {
    attempts++;
    if (attempts > 50) {
      throw new Error('Query timed out');
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    const getQueryParams = {
      QueryExecutionId: queryExecutionId,
    };

    const getQueryCommand = new GetQueryExecutionCommand(getQueryParams);
    const response = await athenaClient.send(getQueryCommand);
    status = response.QueryExecution.Status.State;

    if (status === 'FAILED' || status === 'CANCELLED') {
      const reason = response.QueryExecution.Status.StateChangeReason;
      throw new Error(`Query failed: ${reason}`);
    }
  }

  return status;
};

/**
 * Process Athena query results into a more usable format
 */
const processResults = (results) => {
  if (!results.ResultSet || !results.ResultSet.Rows) {
    return { columns: [], rows: [] };
  }

  const rows = results.ResultSet.Rows;

  // Extract column names from the first row
  const columns = rows[0].Data.map(data => data.VarCharValue);

  // Extract data rows (skip the header row)
  const dataRows = rows.slice(1).map(row => {
    return row.Data.map(data => data.VarCharValue);
  });

  return {
    columns,
    rows: dataRows
  };
};

/**
 * Lambda handler for Athena queries
 */
exports.handler = async (event) => {
  try {
    // Parse the request body
    const body = JSON.parse(event.body || '{}');
    const { action, query, filters } = body;

    // Make sure the forecast table exists
    await createForecastTable();

    let result;
    let responseMessage;

    switch (action) {
      case 'execute_query':
        // Execute a custom query
        if (!query) {
          return formatResponse(400, { error: 'Query parameter is required' });
        }
        result = await executeQuery(query);
        responseMessage = 'Query executed successfully';
        break;

      case 'get_forecast_summary':
        // Get summary statistics from forecast data
        const summaryQuery = `
          SELECT
            state,
            COUNT(*) as record_count,
            AVG(y_50) as avg_forecast,
            MIN(y_05) as min_forecast,
            MAX(y_95) as max_forecast
          FROM ${FORECAST_TABLE_NAME}
          ${filters && filters.state ? `WHERE state = '${filters.state}'` : ''}
          GROUP BY state
          ORDER BY state
        `;
        result = await executeQuery(summaryQuery);
        responseMessage = 'Forecast summary generated successfully';
        break;

      case 'get_forecast_by_date':
        // Get forecast data by date
        if (!filters || !filters.start_date) {
          return formatResponse(400, { error: 'start_date filter is required' });
        }

        const dateQuery = `
          SELECT
            business_date,
            AVG(y_50) as avg_forecast
          FROM ${FORECAST_TABLE_NAME}
          WHERE business_date BETWEEN DATE '${filters.start_date}' AND
            DATE '${filters.end_date || filters.start_date}'
          ${filters.state ? `AND state = '${filters.state}'` : ''}
          GROUP BY business_date
          ORDER BY business_date
        `;
        result = await executeQuery(dateQuery);
        responseMessage = 'Date-based forecast data retrieved successfully';
        break;

      default:
        return formatResponse(400, { error: 'Invalid action. Supported actions: execute_query, get_forecast_summary, get_forecast_by_date' });
    }

    return formatResponse(200, {
      message: responseMessage,
      data: result
    });
  } catch (error) {
    console.error('Error in Lambda handler:', error);
    return formatResponse(500, { error: error.message });
  }
};

/**
 * Format the HTTP response
 */
const formatResponse = (statusCode, body) => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(body)
  };
};
