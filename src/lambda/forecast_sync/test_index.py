#!/usr/bin/env python3
"""
Unit tests for the forecast sync Lambda function
"""

import os
import json
import unittest
from unittest.mock import Mock, patch
from datetime import datetime, date

# Set up test environment variables before importing the handler
os.environ["ATHENA_DB_NAME"] = "test_db"
os.environ["ATHENA_OUTPUT_LOCATION"] = "s3://test-bucket/athena-results/"
os.environ["FORECAST_TABLE_NAME"] = "test_forecast"
os.environ["DATABASE_URL"] = "postgresql://test:test@localhost/test"
os.environ["NEON_API_KEY"] = "test_api_key"
os.environ["NEON_PROJECT_ID"] = "test_project_id"
os.environ["AWS_REGION"] = "us-east-2"
os.environ["ENVIRONMENT"] = "test"

from index import ForecastSyncHandler, lambda_handler


class TestForecastSyncHandler(unittest.TestCase):
    """Test cases for ForecastSyncHandler class"""

    def setUp(self):
        """Set up test fixtures"""
        self.handler = ForecastSyncHandler()
        self.mock_connection = Mock()
        self.mock_cursor = Mock()

    @patch("index.psycopg2.connect")
    def test_connect_with_database_url(self, mock_connect):
        """Test database connection with DATABASE_URL"""
        mock_connect.return_value = self.mock_connection
        self.mock_connection.cursor.return_value = self.mock_cursor

        self.handler.connect()

        mock_connect.assert_called_once_with(os.environ["DATABASE_URL"])
        self.assertEqual(self.handler.connection, self.mock_connection)
        self.assertEqual(self.handler.cursor, self.mock_cursor)

    @patch("index.requests.get")
    @patch("index.psycopg2.connect")
    def test_connect_with_neon_api(self, mock_connect, mock_requests):
        """Test database connection using Neon API"""
        # Remove DATABASE_URL to test Neon API path
        with patch.dict(os.environ, {"DATABASE_URL": ""}):
            # Mock Neon API responses
            mock_branches_response = Mock()
            mock_branches_response.json.return_value = {"branches": [{"name": "dev", "id": "branch-123"}]}
            mock_branches_response.raise_for_status = Mock()

            mock_conn_response = Mock()
            mock_conn_response.json.return_value = {"connection_string": "postgresql://neon:test@neon.tech/test"}
            mock_conn_response.raise_for_status = Mock()

            mock_requests.side_effect = [mock_branches_response, mock_conn_response]

            mock_connect.return_value = self.mock_connection
            self.mock_connection.cursor.return_value = self.mock_cursor

            with patch.dict(os.environ, {"ENVIRONMENT": "dev"}):
                self.handler.connect()

            # Verify API calls
            self.assertEqual(mock_requests.call_count, 2)
            mock_connect.assert_called_once_with("postgresql://neon:test@neon.tech/test")

    def test_disconnect(self):
        """Test database disconnection"""
        self.handler.connection = self.mock_connection
        self.handler.cursor = self.mock_cursor

        self.handler.disconnect()

        self.mock_cursor.close.assert_called_once()
        self.mock_connection.close.assert_called_once()

    @patch("index.athena_client")
    def test_execute_athena_query_success(self, mock_athena):
        """Test successful Athena query execution"""
        # Mock query execution
        mock_athena.start_query_execution.return_value = {"QueryExecutionId": "query-123"}

        # Mock query status - succeeded immediately
        mock_athena.get_query_execution.return_value = {"QueryExecution": {"Status": {"State": "SUCCEEDED"}}}

        # Mock query results
        mock_athena.get_paginator.return_value.paginate.return_value = [
            {
                "ResultSet": {
                    "Rows": [
                        # Header row
                        {"Data": [{"VarCharValue": "restaurant_id"}, {"VarCharValue": "inventory_item_id"}, {"VarCharValue": "business_date"}, {"VarCharValue": "state"}, {"VarCharValue": "y_50"}]},
                        # Data row
                        {"Data": [{"VarCharValue": "123"}, {"VarCharValue": "456"}, {"VarCharValue": "2024-01-01"}, {"VarCharValue": "CA"}, {"VarCharValue": "100.50"}]},
                    ]
                }
            }
        ]

        self.handler.connection = self.mock_connection
        self.handler.cursor = self.mock_cursor

        results = self.handler.execute_athena_query("SELECT * FROM test")

        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["restaurant_id"], 123)
        self.assertEqual(results[0]["inventory_item_id"], 456)
        self.assertEqual(results[0]["business_date"], "2024-01-01")
        self.assertEqual(results[0]["state"], "CA")
        self.assertEqual(results[0]["y_50"], 100.50)

    @patch("index.athena_client")
    def test_execute_athena_query_failure(self, mock_athena):
        """Test Athena query execution failure"""
        mock_athena.start_query_execution.return_value = {"QueryExecutionId": "query-123"}

        # Mock query status - failed
        mock_athena.get_query_execution.return_value = {"QueryExecution": {"Status": {"State": "FAILED", "StateChangeReason": "Invalid SQL syntax"}}}

        self.handler.connection = self.mock_connection
        self.handler.cursor = self.mock_cursor

        with self.assertRaises(Exception) as context:
            self.handler.execute_athena_query("INVALID SQL")

        self.assertIn("Query failed", str(context.exception))

    def test_get_last_sync_info(self):
        """Test retrieving last sync information"""
        self.handler.connection = self.mock_connection
        self.handler.cursor = self.mock_cursor

        # Mock successful query
        test_timestamp = datetime.now()
        test_date = date.today()
        self.mock_cursor.fetchone.return_value = (test_timestamp, test_date)

        result = self.handler.get_last_sync_info()

        self.assertEqual(result["last_sync_timestamp"], test_timestamp)
        self.assertEqual(result["last_sync_date"], test_date)

    def test_get_last_sync_info_no_data(self):
        """Test retrieving last sync info when no data exists"""
        self.handler.connection = self.mock_connection
        self.handler.cursor = self.mock_cursor

        # Mock no results
        self.mock_cursor.fetchone.return_value = None

        result = self.handler.get_last_sync_info()

        self.assertIsNone(result["last_sync_timestamp"])
        self.assertIsNone(result["last_sync_date"])

    @patch.object(ForecastSyncHandler, "execute_athena_query")
    @patch.object(ForecastSyncHandler, "get_last_sync_info")
    def test_sync_data_incremental(self, mock_get_sync_info, mock_execute_query):
        """Test incremental data sync"""
        self.handler.connection = self.mock_connection
        self.handler.cursor = self.mock_cursor

        # Mock last sync info
        mock_get_sync_info.return_value = {"last_sync_timestamp": datetime.now(), "last_sync_date": "2024-01-01"}

        # Mock query results
        mock_execute_query.return_value = [{"restaurant_id": 123, "inventory_item_id": 456, "business_date": "2024-01-02", "dma_id": "DMA1", "dc_id": 1, "state": "CA", "y_05": 90.0, "y_50": 100.0, "y_95": 110.0}]

        records_synced = self.handler.sync_data("incremental")

        self.assertEqual(records_synced, 1)
        self.mock_connection.commit.assert_called()

    @patch.object(ForecastSyncHandler, "execute_athena_query")
    @patch.object(ForecastSyncHandler, "get_last_sync_info")
    def test_sync_data_full(self, mock_get_sync_info, mock_execute_query):
        """Test full data sync"""
        self.handler.connection = self.mock_connection
        self.handler.cursor = self.mock_cursor

        # Mock query results
        mock_execute_query.side_effect = [
            # Date range query result
            [{"min_date": "2024-01-01", "max_date": "2024-01-31"}],
            # Data query result
            [{"restaurant_id": 123, "inventory_item_id": 456, "business_date": "2024-01-01", "dma_id": "DMA1", "dc_id": 1, "state": "CA", "y_05": 90.0, "y_50": 100.0, "y_95": 110.0}, {"restaurant_id": 124, "inventory_item_id": 457, "business_date": "2024-01-02", "dma_id": "DMA2", "dc_id": 2, "state": "NY", "y_05": 80.0, "y_50": 90.0, "y_95": 100.0}],
        ]

        records_synced = self.handler.sync_data("full")

        self.assertEqual(records_synced, 2)
        self.mock_connection.commit.assert_called()

    @patch.object(ForecastSyncHandler, "execute_athena_query")
    def test_sync_data_no_data(self, mock_execute_query):
        """Test sync when no data is available"""
        self.handler.connection = self.mock_connection
        self.handler.cursor = self.mock_cursor

        # Mock empty query results
        mock_execute_query.return_value = []

        records_synced = self.handler.sync_data("incremental")

        self.assertEqual(records_synced, 0)

    def test_create_schema(self):
        """Test schema creation"""
        self.handler.connection = self.mock_connection
        self.handler.cursor = self.mock_cursor

        self.handler.create_schema()

        # Verify schema SQL was executed
        self.mock_cursor.execute.assert_called_once()
        self.mock_connection.commit.assert_called_once()

        # Check that the SQL contains expected table creation
        executed_sql = self.mock_cursor.execute.call_args[0][0]
        self.assertIn("CREATE TABLE IF NOT EXISTS forecast_data", executed_sql)
        self.assertIn("CREATE TABLE IF NOT EXISTS forecast_sync_status", executed_sql)
        self.assertIn("CREATE INDEX", executed_sql)


class TestLambdaHandler(unittest.TestCase):
    """Test cases for lambda_handler function"""

    @patch("index.ForecastSyncHandler")
    def test_lambda_handler_s3_event(self, mock_handler_class):
        """Test Lambda handler with S3 event"""
        mock_handler = Mock()
        mock_handler_class.return_value.__enter__.return_value = mock_handler
        mock_handler.sync_data.return_value = 100

        event = {"Records": [{"eventSource": "aws:s3", "s3": {"object": {"key": "forecast/data.parquet"}}}]}

        response = lambda_handler(event, None)

        self.assertEqual(response["statusCode"], 200)
        body = json.loads(response["body"])
        self.assertEqual(body["sync_type"], "incremental")
        self.assertEqual(body["records_synced"], 100)

        # Verify handler methods were called
        mock_handler.create_schema.assert_called_once()
        mock_handler.sync_data.assert_called_once_with("incremental")

    @patch("index.ForecastSyncHandler")
    def test_lambda_handler_scheduled_event(self, mock_handler_class):
        """Test Lambda handler with scheduled event"""
        mock_handler = Mock()
        mock_handler_class.return_value.__enter__.return_value = mock_handler
        mock_handler.sync_data.return_value = 50

        event = {"source": "aws.events", "time": "2024-01-01T00:00:00Z"}

        response = lambda_handler(event, None)

        self.assertEqual(response["statusCode"], 200)
        body = json.loads(response["body"])
        self.assertEqual(body["sync_type"], "incremental")
        self.assertEqual(body["records_synced"], 50)

    @patch("index.ForecastSyncHandler")
    def test_lambda_handler_github_actions_event(self, mock_handler_class):
        """Test Lambda handler with GitHub Actions event"""
        mock_handler = Mock()
        mock_handler_class.return_value.__enter__.return_value = mock_handler
        mock_handler.sync_data.return_value = 200

        event = {"source": "github.actions", "sync_type": "full"}

        response = lambda_handler(event, None)

        self.assertEqual(response["statusCode"], 200)
        body = json.loads(response["body"])
        self.assertEqual(body["sync_type"], "full")
        self.assertEqual(body["records_synced"], 200)

        # Verify full sync was called
        mock_handler.sync_data.assert_called_once_with("full")

    @patch("index.ForecastSyncHandler")
    def test_lambda_handler_eventbridge_event(self, mock_handler_class):
        """Test Lambda handler with EventBridge event"""
        mock_handler = Mock()
        mock_handler_class.return_value.__enter__.return_value = mock_handler
        mock_handler.sync_data.return_value = 75

        event = {"detail-type": "Forecast Sync", "detail": {"sync_type": "incremental"}}

        response = lambda_handler(event, None)

        self.assertEqual(response["statusCode"], 200)
        body = json.loads(response["body"])
        self.assertEqual(body["sync_type"], "incremental")
        self.assertEqual(body["records_synced"], 75)

    @patch("index.ForecastSyncHandler")
    def test_lambda_handler_error(self, mock_handler_class):
        """Test Lambda handler error handling"""
        mock_handler = Mock()
        mock_handler_class.return_value.__enter__.return_value = mock_handler
        mock_handler.create_schema.side_effect = Exception("Database connection failed")

        event = {"source": "test"}

        response = lambda_handler(event, None)

        self.assertEqual(response["statusCode"], 500)
        body = json.loads(response["body"])
        self.assertIn("error", body)
        self.assertEqual(body["error"], "Database connection failed")


if __name__ == "__main__":
    unittest.main()
