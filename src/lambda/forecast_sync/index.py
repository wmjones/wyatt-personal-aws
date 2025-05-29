#!/usr/bin/env python3
"""
Lambda function for automated forecast data synchronization from S3/Athena to Postgres.
Triggered by S3 events and GitHub Actions deployments.
"""

import os
import json
import logging
import time
from datetime import datetime
from typing import Dict, List, Any, Optional
import boto3
import psycopg2
from psycopg2.extras import execute_batch
import requests

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Environment variables
ATHENA_DB_NAME = os.environ.get("ATHENA_DB_NAME", "default")
ATHENA_OUTPUT_LOCATION = os.environ.get("ATHENA_OUTPUT_LOCATION", "s3://wyatt-datalake-dev-35315550/athena-results/")
FORECAST_TABLE_NAME = os.environ.get("FORECAST_TABLE_NAME", "forecast")
DATABASE_URL = os.environ.get("DATABASE_URL")
NEON_API_KEY = os.environ.get("NEON_API_KEY")
NEON_PROJECT_ID = os.environ.get("NEON_PROJECT_ID")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-2")
BATCH_SIZE = int(os.environ.get("BATCH_SIZE", "10000"))
ENVIRONMENT = os.environ.get("ENVIRONMENT", "dev")

# AWS clients
athena_client = boto3.client("athena", region_name=AWS_REGION)
s3_client = boto3.client("s3", region_name=AWS_REGION)


class ForecastSyncHandler:
    """Handler for forecast data synchronization"""

    def __init__(self):
        self.connection = None
        self.cursor = None
        self.sync_timestamp = None

    def __enter__(self):
        """Context manager entry"""
        self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        self.disconnect()

    def connect(self):
        """Establish database connection"""
        try:
            # If branch context is provided, get branch-specific database URL
            database_url = self._get_database_url()
            self.connection = psycopg2.connect(database_url)
            self.cursor = self.connection.cursor()
            logger.info("Database connection established")
        except Exception as e:
            logger.error(f"Failed to connect to database: {str(e)}")
            raise

    def disconnect(self):
        """Close database connection"""
        if self.cursor:
            self.cursor.close()
        if self.connection:
            self.connection.close()

    def _get_database_url(self) -> str:
        """Get database URL based on branch context"""
        # If DATABASE_URL is already set (e.g., in GitHub Actions), use it
        if DATABASE_URL:
            return DATABASE_URL

        # Otherwise, try to get branch-specific URL from Neon API
        if NEON_API_KEY and NEON_PROJECT_ID:
            branch_name = self._get_branch_name()
            if branch_name:
                return self._get_neon_branch_url(branch_name)

        raise ValueError("No database URL available")

    def _get_branch_name(self) -> Optional[str]:
        """Determine branch name from event context"""
        # This will be enhanced based on event source
        # For now, return environment-based branch
        if ENVIRONMENT == "production":
            return "main"
        elif ENVIRONMENT == "dev":
            return "dev"
        return None

    def _get_neon_branch_url(self, branch_name: str) -> str:
        """Get database URL for specific Neon branch"""
        headers = {"Authorization": f"Bearer {NEON_API_KEY}", "Content-Type": "application/json"}

        # Get branches
        response = requests.get(f"https://console.neon.tech/api/v2/projects/{NEON_PROJECT_ID}/branches", headers=headers)
        response.raise_for_status()

        branches = response.json()
        for branch in branches.get("branches", []):
            if branch["name"] == branch_name:
                branch_id = branch["id"]
                # Get connection string
                conn_response = requests.get(f"https://console.neon.tech/api/v2/projects/{NEON_PROJECT_ID}/branches/{branch_id}/connection_string", headers=headers)
                conn_response.raise_for_status()
                return conn_response.json()["connection_string"]

        raise ValueError(f"Branch {branch_name} not found")

    def create_schema(self):
        """Create or update database schema"""
        logger.info("Creating/updating database schema...")

        schema_sql = """
        -- Create forecast table if it doesn't exist
        CREATE TABLE IF NOT EXISTS forecast_data (
            id SERIAL PRIMARY KEY,
            restaurant_id INTEGER NOT NULL,
            inventory_item_id INTEGER NOT NULL,
            business_date DATE NOT NULL,
            dma_id VARCHAR(50),
            dc_id INTEGER,
            state VARCHAR(2) NOT NULL,
            y_05 DECIMAL(10, 2),
            y_50 DECIMAL(10, 2) NOT NULL,
            y_95 DECIMAL(10, 2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(restaurant_id, inventory_item_id, business_date)
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_forecast_business_date ON forecast_data(business_date);
        CREATE INDEX IF NOT EXISTS idx_forecast_state ON forecast_data(state);
        CREATE INDEX IF NOT EXISTS idx_forecast_state_date ON forecast_data(state, business_date);
        CREATE INDEX IF NOT EXISTS idx_forecast_dma ON forecast_data(dma_id) WHERE dma_id IS NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_forecast_dc ON forecast_data(dc_id) WHERE dc_id IS NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_forecast_restaurant ON forecast_data(restaurant_id);
        CREATE INDEX IF NOT EXISTS idx_forecast_inventory ON forecast_data(inventory_item_id);
        CREATE INDEX IF NOT EXISTS idx_forecast_composite ON forecast_data(state, dma_id, dc_id, business_date);

        -- Create sync tracking table
        CREATE TABLE IF NOT EXISTS forecast_sync_status (
            id SERIAL PRIMARY KEY,
            sync_type VARCHAR(50) NOT NULL,
            last_sync_timestamp TIMESTAMP NOT NULL,
            last_sync_date DATE,
            records_synced INTEGER,
            status VARCHAR(20),
            error_message TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Create updated_at trigger
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ language 'plpgsql';

        DROP TRIGGER IF EXISTS update_forecast_data_updated_at ON forecast_data;
        CREATE TRIGGER update_forecast_data_updated_at
            BEFORE UPDATE ON forecast_data
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        """

        try:
            self.cursor.execute(schema_sql)
            self.connection.commit()
            logger.info("Schema created/updated successfully")
        except Exception as e:
            logger.error(f"Failed to create schema: {str(e)}")
            self.connection.rollback()
            raise

    def get_last_sync_info(self) -> Dict[str, Any]:
        """Get information about the last successful sync"""
        try:
            self.cursor.execute(
                """
                SELECT last_sync_timestamp, last_sync_date
                FROM forecast_sync_status
                WHERE sync_type = 'incremental' AND status = 'success'
                ORDER BY created_at DESC
                LIMIT 1
            """
            )
            result = self.cursor.fetchone()
            if result:
                return {"last_sync_timestamp": result[0], "last_sync_date": result[1]}
            return {"last_sync_timestamp": None, "last_sync_date": None}
        except Exception as e:
            logger.warning(f"Failed to get last sync info: {str(e)}")
            return {"last_sync_timestamp": None, "last_sync_date": None}

    def execute_athena_query(self, query: str) -> List[Dict[str, Any]]:
        """Execute Athena query and return results"""
        logger.info(f"Executing Athena query: {query[:100]}...")

        # Start query execution
        response = athena_client.start_query_execution(QueryString=query, QueryExecutionContext={"Database": ATHENA_DB_NAME}, ResultConfiguration={"OutputLocation": ATHENA_OUTPUT_LOCATION})

        query_execution_id = response["QueryExecutionId"]

        # Wait for query to complete
        max_attempts = 60
        for attempt in range(max_attempts):
            result = athena_client.get_query_execution(QueryExecutionId=query_execution_id)
            status = result["QueryExecution"]["Status"]["State"]

            if status == "SUCCEEDED":
                break
            elif status in ["FAILED", "CANCELLED"]:
                error_msg = result["QueryExecution"]["Status"].get("StateChangeReason", "Unknown error")
                raise Exception(f"Query failed: {error_msg}")

            time.sleep(2)
        else:
            raise Exception("Query timeout")

        # Get results
        results = []
        paginator = athena_client.get_paginator("get_query_results")

        for page in paginator.paginate(QueryExecutionId=query_execution_id):
            # Skip header row on first page
            rows = page["ResultSet"]["Rows"]
            if not results and rows:
                header = [col["VarCharValue"] for col in rows[0]["Data"]]
                rows = rows[1:]

            for row in rows:
                record = {}
                for i, col in enumerate(row["Data"]):
                    col_name = header[i].lower()
                    value = col.get("VarCharValue")

                    # Type conversion
                    if col_name in ["restaurant_id", "inventory_item_id", "dc_id"]:
                        record[col_name] = int(value) if value else None
                    elif col_name in ["y_05", "y_50", "y_95"]:
                        record[col_name] = float(value) if value else None
                    else:
                        record[col_name] = value

                results.append(record)

        logger.info(f"Query returned {len(results)} records")
        return results

    def sync_data(self, sync_type: str = "incremental") -> int:
        """Sync data from Athena to Postgres"""
        sync_info = self.get_last_sync_info()
        last_sync_date = sync_info["last_sync_date"]

        # Build query based on sync type
        if sync_type == "incremental" and last_sync_date:
            # Sync only new data
            query = f"""
                SELECT
                    restaurant_id,
                    inventory_item_id,
                    business_date,
                    dma_id,
                    dc_id,
                    state,
                    y_05,
                    y_50,
                    y_95
                FROM {FORECAST_TABLE_NAME}
                WHERE business_date > DATE '{last_sync_date}'
                ORDER BY business_date, restaurant_id, inventory_item_id
            """
        else:
            # Full sync - get date range first
            date_range_query = f"""
                SELECT
                    MIN(business_date) as min_date,
                    MAX(business_date) as max_date
                FROM {FORECAST_TABLE_NAME}
            """
            date_range = self.execute_athena_query(date_range_query)

            if not date_range or not date_range[0].get("min_date"):
                logger.warning("No data found in Athena table")
                return 0

            min_date = date_range[0]["min_date"]
            max_date = date_range[0]["max_date"]

            query = f"""
                SELECT
                    restaurant_id,
                    inventory_item_id,
                    business_date,
                    dma_id,
                    dc_id,
                    state,
                    y_05,
                    y_50,
                    y_95
                FROM {FORECAST_TABLE_NAME}
                WHERE business_date >= DATE '{min_date}'
                    AND business_date <= DATE '{max_date}'
                ORDER BY business_date, restaurant_id, inventory_item_id
            """

        # Execute query and sync data
        data = self.execute_athena_query(query)

        if not data:
            logger.info("No new data to sync")
            return 0

        # Insert data in batches
        total_synced = 0
        insert_sql = """
            INSERT INTO forecast_data (
                restaurant_id, inventory_item_id, business_date,
                dma_id, dc_id, state, y_05, y_50, y_95
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (restaurant_id, inventory_item_id, business_date)
            DO UPDATE SET
                dma_id = EXCLUDED.dma_id,
                dc_id = EXCLUDED.dc_id,
                state = EXCLUDED.state,
                y_05 = EXCLUDED.y_05,
                y_50 = EXCLUDED.y_50,
                y_95 = EXCLUDED.y_95,
                updated_at = CURRENT_TIMESTAMP
        """

        try:
            for i in range(0, len(data), BATCH_SIZE):
                batch = data[i : i + BATCH_SIZE]
                values = [(record["restaurant_id"], record["inventory_item_id"], record["business_date"], record.get("dma_id"), record.get("dc_id"), record["state"], record.get("y_05"), record["y_50"], record.get("y_95")) for record in batch]

                execute_batch(self.cursor, insert_sql, values)
                total_synced += len(batch)
                logger.info(f"Synced batch: {total_synced}/{len(data)} records")

            self.connection.commit()

            # Update sync status
            max_date = max(record["business_date"] for record in data)
            self.cursor.execute(
                """
                INSERT INTO forecast_sync_status (
                    sync_type, last_sync_timestamp, last_sync_date,
                    records_synced, status
                ) VALUES (%s, %s, %s, %s, %s)
            """,
                (sync_type, datetime.now(), max_date, total_synced, "success"),
            )
            self.connection.commit()

            logger.info(f"Successfully synced {total_synced} records")
            return total_synced

        except Exception as e:
            logger.error(f"Failed to sync data: {str(e)}")
            self.connection.rollback()

            # Record failure
            self.cursor.execute(
                """
                INSERT INTO forecast_sync_status (
                    sync_type, last_sync_timestamp, records_synced,
                    status, error_message
                ) VALUES (%s, %s, %s, %s, %s)
            """,
                (sync_type, datetime.now(), 0, "failed", str(e)),
            )
            self.connection.commit()

            raise


def lambda_handler(event, context):
    """Lambda function entry point"""
    logger.info(f"Event: {json.dumps(event)}")

    try:
        # Determine sync type from event
        sync_type = "incremental"

        # Check if this is an S3 event
        if "Records" in event:
            for record in event["Records"]:
                if "eventSource" in record and record["eventSource"] == "aws:s3":
                    # S3 event - check if it's in the forecast prefix
                    s3_key = record["s3"]["object"]["key"]
                    if s3_key.startswith("forecast/"):
                        logger.info(f"S3 event detected for key: {s3_key}")
                        sync_type = "incremental"

        # Check if this is a scheduled event or manual trigger
        elif "source" in event:
            if event["source"] == "aws.events":
                logger.info("Scheduled event detected")
                sync_type = "incremental"
            elif event["source"] == "github.actions":
                logger.info("GitHub Actions deployment detected")
                sync_type = event.get("sync_type", "full")

        # Check if this is an EventBridge event
        elif "detail-type" in event:
            logger.info(f"EventBridge event detected: {event['detail-type']}")
            sync_type = event.get("detail", {}).get("sync_type", "incremental")

        # Perform sync
        with ForecastSyncHandler() as handler:
            # Create/update schema
            handler.create_schema()

            # Sync data
            records_synced = handler.sync_data(sync_type)

            response = {"statusCode": 200, "body": json.dumps({"message": f"Successfully synced {records_synced} records", "sync_type": sync_type, "records_synced": records_synced, "timestamp": datetime.now().isoformat()})}

            logger.info(f"Response: {response}")
            return response

    except Exception as e:
        logger.error(f"Lambda execution failed: {str(e)}")
        return {"statusCode": 500, "body": json.dumps({"error": str(e), "timestamp": datetime.now().isoformat()})}
