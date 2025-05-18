import boto3
import os
import time
import logging
import json

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource("dynamodb")
connection_table = dynamodb.Table(os.environ.get("CONNECTION_TABLE"))


def lambda_handler(event, context):
    """Handle WebSocket connect event"""
    connection_id = event["requestContext"]["connectionId"]

    # Extract requestContext information
    request_context = event.get("requestContext", {})
    source_ip = request_context.get("identity", {}).get("sourceIp", "unknown")

    # Extract query parameters if provided
    query_params = {}
    if "queryStringParameters" in event and event["queryStringParameters"]:
        query_params = event["queryStringParameters"]

    # Get userId from query parameters or default to anonymous
    user_id = query_params.get("userId", "anonymous")

    current_time = int(time.time())
    timestamp_ms = current_time * 1000

    try:
        # Set TTL for 24 hours (86400 seconds)
        expiry = current_time + 86400

        # Create connection record with enhanced attributes
        connection_item = {"connectionId": connection_id, "userId": user_id, "connectedAt": timestamp_ms, "expiry": expiry, "connectionStatus": "connected", "clientIp": source_ip}

        # Store connection in DynamoDB
        connection_table.put_item(Item=connection_item)

        logger.info(f"WebSocket connected: {json.dumps(connection_item)}")
        return {"statusCode": 200, "body": "Connected"}
    except Exception as e:
        logger.error(f"Error handling WebSocket connect: {str(e)}")
        return {"statusCode": 500, "body": str(e)}
