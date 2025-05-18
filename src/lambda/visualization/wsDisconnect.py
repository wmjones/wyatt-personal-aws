import boto3
import os
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource("dynamodb")
connection_table = dynamodb.Table(os.environ.get("CONNECTION_TABLE"))


def lambda_handler(event, context):
    """Handle WebSocket disconnect event"""
    connection_id = event["requestContext"]["connectionId"]

    try:
        # Get the connection record to log details before deletion
        connection_response = connection_table.get_item(Key={"connectionId": connection_id})

        if "Item" in connection_response:
            connection_data = connection_response["Item"]
            logger.info(f"Disconnecting user: {connection_data.get('userId', 'unknown')} with connection ID: {connection_id}")

            # Option 1: Delete the connection record
            connection_table.delete_item(Key={"connectionId": connection_id})

            # Option 2 (alternative): Mark connection as disconnected but let TTL expire it
            # This would be useful for analytics on connection durations
            # current_time = int(time.time())
            # connection_table.update_item(
            #     Key={"connectionId": connection_id},
            #     UpdateExpression="SET connectionStatus = :status, disconnectedAt = :time",
            #     ExpressionAttributeValues={
            #         ":status": "disconnected",
            #         ":time": current_time * 1000
            #     }
            # )
        else:
            logger.warning(f"Connection ID not found: {connection_id}")
            # Still attempt to delete in case it exists
            connection_table.delete_item(Key={"connectionId": connection_id})

        return {"statusCode": 200, "body": "Disconnected"}
    except Exception as e:
        logger.error(f"Error handling WebSocket disconnect: {str(e)}")
        return {"statusCode": 500, "body": str(e)}
