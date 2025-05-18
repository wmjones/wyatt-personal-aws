import json

from todoist_api_python.api import TodoistAPI
from utils import SuperTask, get_secret


def lambda_handler(event, context):
    task = json.loads(event["body"])
    secret = get_secret("todoist_key", "us-east-2")
    secret_dict = json.loads(secret)
    todoist_api_key = secret_dict["TODOIST_API_KEY"]
    api = TodoistAPI(todoist_api_key)

    for json_task in json.loads(event["body"]):
        try:
            print(f"\njson_task: {json_task}")
            task = SuperTask(**json_task)
            is_success = api.close_task(task_id=task.id)
            print(is_success)
        except Exception as error:
            return {"statusCode": 500, "body": json.dumps({"error": str(error)})}
    return {"statusCode": 200, "body": json.dumps({"message": "Task deleted"})}
