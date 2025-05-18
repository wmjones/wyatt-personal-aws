import json
import boto3
import time
import os
import logging
from boto3.dynamodb.conditions import Key

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource("dynamodb")
parameter_table = dynamodb.Table(os.environ.get("PARAMETER_TABLE"))
history_table = dynamodb.Table(os.environ.get("HISTORY_TABLE"))
connection_table = dynamodb.Table(os.environ.get("CONNECTION_TABLE"))

# Optional: WebSocket API client for real-time updates
apigw_management = None
if os.environ.get("WEBSOCKET_API_ENDPOINT"):
    endpoint = os.environ.get("WEBSOCKET_API_ENDPOINT")
    apigw_management = boto3.client("apigatewaymanagementapi", endpoint_url=endpoint)


def lambda_handler(event, context):
    """
    Updates normal distribution parameters and records the change history.
    Optionally broadcasts updates to connected clients via WebSocket.
    """
    # Extract user information from Cognito authorizer
    request_context = event.get("requestContext", {})
    authorizer = request_context.get("authorizer", {})
    claims = authorizer.get("claims", {})

    user_id = claims.get("sub", "anonymous")
    user_email = claims.get("email", "anonymous@example.com")

    # Parse request body
    body = json.loads(event.get("body", "{}"))
    new_mean = body.get("mean")
    new_std_dev = body.get("stdDev")

    # Custom parameter ID or user-specific parameter set
    param_id = body.get("paramId", "normal_distribution_params")

    # Allow custom title/description for the parameter set
    title = body.get("title", "Normal Distribution Parameters")
    description = body.get("description", "")

    # Validate input parameters
    if new_mean is None or new_std_dev is None:
        return {"statusCode": 400, "headers": {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"}, "body": json.dumps({"error": "Missing required parameters: mean and stdDev"})}

    if new_std_dev <= 0:
        return {"statusCode": 400, "headers": {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"}, "body": json.dumps({"error": "Standard deviation must be positive"})}

    try:
        # Get current params for history tracking
        current_params = parameter_table.query(KeyConditionExpression=Key("paramId").eq(param_id), Limit=1, ScanIndexForward=False)

        current_mean = 0
        current_std_dev = 1
        param_exists = False

        if current_params.get("Items"):
            param_exists = True
            current_mean = current_params["Items"][0].get("mean", 0)
            current_std_dev = current_params["Items"][0].get("stdDev", 1)

        timestamp = int(time.time() * 1000)  # Milliseconds since epoch

        # Build updated parameter item
        parameter_item = {"paramId": param_id, "timestamp": timestamp, "mean": new_mean, "stdDev": new_std_dev, "lastUpdatedBy": user_email, "userId": user_id, "lastUpdatedAt": timestamp, "title": title, "description": description}

        # Add unique version identifier for tracking
        if not param_exists:
            # For new parameter sets, create a version identifier
            parameter_item["version"] = "v1"
        else:
            # For updates, increment the version
            current_version = current_params["Items"][0].get("version", "v0")
            if current_version.startswith("v"):
                try:
                    version_num = int(current_version[1:])
                    parameter_item["version"] = f"v{version_num + 1}"
                except ValueError:
                    parameter_item["version"] = "v1"
            else:
                parameter_item["version"] = "v1"

        # Update the parameters
        parameter_table.put_item(Item=parameter_item)

        # Record change history with paramId
        if new_mean != current_mean:
            history_item = {"userId": user_id, "timestamp": timestamp, "paramName": "mean", "paramId": param_id, "oldValue": current_mean, "newValue": new_mean, "userEmail": user_email}
            history_table.put_item(Item=history_item)

        if new_std_dev != current_std_dev:
            history_item = {"userId": user_id, "timestamp": timestamp + 1, "paramName": "stdDev", "paramId": param_id, "oldValue": current_std_dev, "newValue": new_std_dev, "userEmail": user_email}  # Ensure unique timestamp
            history_table.put_item(Item=history_item)

        # Broadcast to all connected clients if WebSocket API is configured
        if apigw_management:
            broadcast_params_update(param_id, new_mean, new_std_dev, user_email, user_id)

        return {"statusCode": 200, "headers": {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"}, "body": json.dumps({"success": True, "timestamp": timestamp, "paramId": param_id, "version": parameter_item["version"]})}

    except Exception as e:
        logger.error(f"Error updating parameters: {str(e)}")
        return {"statusCode": 500, "headers": {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"}, "body": json.dumps({"error": str(e)})}


def broadcast_params_update(param_id, mean, std_dev, updated_by, user_id):
    """Broadcast parameter updates to all connected WebSocket clients"""
    if not apigw_management:
        return

    try:
        # Get all connection IDs
        response = connection_table.scan(ProjectionExpression="connectionId,userId")

        message = json.dumps({"type": "PARAMS_UPDATE", "data": {"paramId": param_id, "mean": mean, "stdDev": std_dev, "updatedBy": updated_by, "userId": user_id, "timestamp": int(time.time() * 1000)}})

        # Send to each connection
        for item in response.get("Items", []):
            connection_id = item["connectionId"]
            try:
                apigw_management.post_to_connection(ConnectionId=connection_id, Data=message)
                logger.info(f"Successfully sent update to connection {connection_id}")
            except Exception as e:
                # Connection is no longer valid, delete it
                if "GoneException" in str(e):
                    logger.info(f"Removing stale connection: {connection_id}")
                    connection_table.delete_item(Key={"connectionId": connection_id})
                else:
                    logger.error(f"Error posting to connection {connection_id}: {str(e)}")

    except Exception as e:
        logger.error(f"Error broadcasting update: {str(e)}")
