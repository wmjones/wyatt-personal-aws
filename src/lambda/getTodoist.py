import json
import re
from dataclasses import asdict
from typing import List

from todoist_api_python.api import TodoistAPI
from utils import Task, get_secret


def strip_rich_text(text: str) -> str:
    emoji_pattern = re.compile(
        "["
        "\U0001f600-\U0001f64f"  # emoticons
        "\U0001f300-\U0001f5ff"  # symbols & pictographs
        "\U0001f680-\U0001f6ff"  # transport & map symbols
        "\U0001f1e0-\U0001f1ff"  # flags (iOS)
        "\U00010000-\U0010ffff"  # emoticons
        "]+",
        flags=re.UNICODE,
    )
    clean_text = emoji_pattern.sub(r"", text)
    return clean_text


def task_to_dict(task: Task) -> dict:
    task.content = strip_rich_text(task.content)
    return asdict(task)


def tasks_to_json(tasks: List[Task], project_id_list: List) -> str:
    tasks_dict = []
    for task in tasks:
        print(
            f"""
              task.project_id: {task.project_id},
              task.section_id: {task.section_id},
              task.content: {task.content}"""
        )
        if int(task.project_id) in project_id_list:
            task_dict = task_to_dict(task)
            tasks_dict.append(task_dict)
    return json.dumps(tasks_dict)


def lambda_handler(event, context):
    secret = get_secret("todoist_key", "us-east-2")
    secret_dict = json.loads(secret)
    todoist_api_key = secret_dict["TODOIST_API_KEY"]
    api = TodoistAPI(todoist_api_key)
    # read in config.json
    with open("config.json") as file:
        config = json.load(file)
    n_project_ids = len(config["projects"])
    project_id_list = [config["projects"][i]["project_id"] for i in range(n_project_ids)]
    print(f"project_id_list: {project_id_list}")

    try:
        tasks = api.get_tasks()
        print(f"tasks: {tasks}")
        json_str = tasks_to_json(tasks, project_id_list)
        print(f"json_str: {json_str}")
    except Exception as error:
        print(error)

    return {"statusCode": 200, "body": json_str}


if __name__ == "__main__":
    lambda_handler(None, None)
