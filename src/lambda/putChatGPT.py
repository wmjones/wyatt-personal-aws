import json

from openai import OpenAI
from utils import SuperTask, get_secret, tasks_to_json


def lambda_handler(event, context):
    """AWS Lambda entry point."""
    print(f"event: {event}")

    secret = get_secret("open_ai_key", "us-east-2")
    secret_dict = json.loads(secret)

    with open("config.json") as file:
        config = json.load(file)

    project_id_list = [project["project_id"] for project in config["projects"]]

    # Initialize OpenAI client with the custom http_client
    client = OpenAI(api_key=secret_dict["OPEN_AI_KEY"])

    tasks = []
    for json_task in json.loads(event["body"]):
        try:
            system_prompt = ""
            task = SuperTask(**json_task)

            print(f"\njson_task: {json_task}")
            print(f"\ntask: {task}")

            if int(task.project_id) not in project_id_list:
                continue

            idx = project_id_list.index(int(task.project_id))
            project_cfg = config["projects"][idx]

            task.passChatGPT = project_cfg["passChatGPT"]
            task.name = project_cfg["name"]

            if task.section_id == "158311513":  # Biftu
                with open("biftu.txt") as file:
                    system_prompt = file.read()
            elif task.section_id == "158311520":  # Tony
                with open("tony.txt") as file:
                    system_prompt = file.read()

            if system_prompt:
                chat_completion = client.chat.completions.create(
                    messages=[
                        {"role": "user", "content": system_prompt},
                        {"role": "user", "content": task.content},
                    ],
                    model="gpt-4o",
                )
                task.agent_output = chat_completion.choices[0].message.content

            tasks.append(task)

        except Exception as error:  # noqa: BLE001
            print(error)
            return {
                "statusCode": 500,
                "body": json.dumps({"error": str(error)}),
            }

    return {
        "statusCode": 200,
        "body": tasks_to_json(tasks),
    }
