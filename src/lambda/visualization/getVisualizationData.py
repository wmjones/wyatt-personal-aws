import json
import boto3
import os
from boto3.dynamodb.conditions import Key
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource("dynamodb")
parameter_table = dynamodb.Table(os.environ.get("PARAMETER_TABLE"))


def lambda_handler(event, context):
    """
    Retrieves the current normal distribution parameters.
    Returns default values if no parameters exist.

    Supports retrieving parameters by user ID when specified in the query parameters.
    """
    try:
        # Extract user ID if provided in the query parameters
        query_params = event.get("queryStringParameters", {}) or {}
        user_id = None

        # Extract authorization information
        request_context = event.get("requestContext", {})
        authorizer = request_context.get("authorizer", {})
        if authorizer:
            claims = authorizer.get("claims", {})
            if claims:
                # If authenticated, get the user's ID from claims
                user_id = claims.get("sub")

        # Override with query parameter if provided
        if query_params and "userId" in query_params:
            user_id = query_params.get("userId")

        # Get parameter ID if specified, otherwise use default
        param_id = query_params.get("paramId", "normal_distribution_params")

        # If a specific user ID is provided, query by user ID through the GSI
        if user_id:
            logger.info(f"Querying parameters for user: {user_id}")
            response = parameter_table.query(IndexName="UserIdIndex", KeyConditionExpression=Key("userId").eq(user_id), Limit=10, ScanIndexForward=False)  # Get most recent 10 parameter sets for the user

            # If no results from user ID query, fall back to default parameters
            if not response.get("Items"):
                return {"statusCode": 200, "headers": {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"}, "body": json.dumps({"mean": 0, "stdDev": 1, "lastUpdatedBy": None, "lastUpdatedAt": None, "paramId": param_id, "userId": user_id})}

            # Return the user's parameters with additional metadata
            items = response.get("Items", [])
            return {"statusCode": 200, "headers": {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"}, "body": json.dumps({"parameters": items, "count": len(items)})}
        else:
            # Standard query by parameter ID when no user ID is specified
            response = parameter_table.query(KeyConditionExpression=Key("paramId").eq(param_id), Limit=1, ScanIndexForward=False)

            # Default values if no custom parameters exist
            if not response.get("Items"):
                return {"statusCode": 200, "headers": {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"}, "body": json.dumps({"mean": 0, "stdDev": 1, "lastUpdatedBy": None, "lastUpdatedAt": None, "paramId": param_id})}

            # Return the current parameters
            return {"statusCode": 200, "headers": {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"}, "body": json.dumps(response["Items"][0])}

    except Exception as e:
        logger.error(f"Error getting visualization data: {str(e)}")
        return {"statusCode": 500, "headers": {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"}, "body": json.dumps({"error": str(e)})}
