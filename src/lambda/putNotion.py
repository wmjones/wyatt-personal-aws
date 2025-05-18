import json
from datetime import datetime, timedelta

from notion_client import Client
from utils import SuperTask, get_secret, markdown_to_notion_blocks, tasks_to_json


def lambda_handler(event, context):
    print(f"event: {event}")
    secret = get_secret("notion_token", "us-east-2")
    secret_dict = json.loads(secret)
    notion_token = secret_dict["NOTION_API_TOKEN"]
    notion = Client(auth=notion_token)
    list_task_dict = []
    for json_task in json.loads(event["body"]):
        print(f"\njson_task: {json_task}")
        task = SuperTask(**json_task)
        # Create a new task in the Notion Kanban board
        try:
            if task.name == "Work":
                description_blocks = markdown_to_notion_blocks(task.description)
                chat_blocks = markdown_to_notion_blocks(task.agent_output)
                # combine description_blocks and chat_blocks as a single list
                children_blocks = description_blocks + chat_blocks
                # TODO: figure out how to have this show up in Notion using makrdown formatting
                notion.pages.create(
                    parent={"database_id": "c8a2c83ac85b4fe08b36bf631604f017"},
                    properties={
                        "title": {"title": [{"type": "text", "text": {"content": task.content}}]},
                        "Team": {"select": {"name": task.name}},
                        # TODO: maybe make deadline multi day events for longer kanban stories?
                        "Deadline": {
                            "date": {
                                "start": str(datetime.now()),
                                "end": str(datetime.now() + timedelta(minutes=30)),
                            }
                        },
                    },
                    children=children_blocks,
                )
            elif task.name == "Home":
                children_blocks = markdown_to_notion_blocks(task.description)
                notion.pages.create(
                    parent={"database_id": "c8a2c83ac85b4fe08b36bf631604f017"},
                    properties={
                        "title": {"title": [{"type": "text", "text": {"content": task.content}}]},
                        "Team": {"select": {"name": task.name}},
                        # Add a deadline date to the Deadline property where Start Date is current datetime and end date is 5pm EST today
                        "Deadline": {
                            "date": {
                                "start": str(datetime.now()),
                                "end": str(datetime.now() + timedelta(minutes=30)),
                            }
                        },
                    },
                    children=children_blocks,
                )
            elif task.project_id == "Weight":
                # Add to the Weight database where the Weight property gets the number in task.content
                notion.pages.create(
                    parent={"database_id": "17f1c81bc0e04694a6d546173135b2ac"},
                    properties={
                        "Weight": {"number": float(task.content)},
                        "Date": {"date": {"start": str(datetime.now().date())}},
                    },
                )
            list_task_dict.append(task)
        except Exception as error:
            return {"statusCode": 500, "body": json.dumps({"error": str(error)})}

    return {"statusCode": 200, "body": tasks_to_json(list_task_dict)}


if __name__ == "__main__":
    event = {
        "statusCode": 200,
        "body": '[{"name": "Work", "assignee_id": null, "assigner_id": null, "comment_count": 0, "is_completed": false, "content": "add new todoist pipeline for weight", "created_at": "2024-06-12T11:10:34.825542Z", "creator_id": "49425011", "description": "", "due": null, "id": "8110672962", "labels": [], "order": 1, "parent_id": null, "priority": 1, "project_id": "2334044360", "section_id": 158311513, "url": "https://todoist.com/app/task/8110672962", "duration": null, "sync_id": null, "agent_output": "Title: Implement New Todoist Pipeline for Tracking Weight\\n\\nDescription:\\nDevelop and integrate a new pipeline in Todoist for tracking the weight of inventory items. This pipeline will help in monitoring the weight data effectively and ensure that restaurants can adjust their orders based on weight-related metrics. This enhancement aims to improve the accuracy of inventory suggestions by including weight as a variable in the replenishment calculation.\\n\\nAcceptance Criteria:\\n1. **Pipeline Development**\\n   - Create a new pipeline in Todoist specifically for tracking inventory weight data.\\n   - Ensure the pipeline can intake, process, and output weight data seamlessly.\\n\\n2. **Data Integration**\\n   - Integrate weight data from existing databases and ensure compatibility with TSDM.\\n   - Validate and clean existing weight data before integration.\\n\\n3. **Dashboard and Reporting**\\n   - Develop a dashboard to visualize weight-related data and analytics.\\n   - Include relevant KPIs and metrics such as total weight, average weight, and weight distribution across different item categories.\\n\\n4. **User Interface**\\n   - Update the user interface in the existing replenishment system to include weight as a variable while placing orders.\\n   - Ensure the interface is user-friendly and provides clear guidance on how to utilize the new weight data in order suggestions.\\n\\n5. **Testing and Validation**\\n   - Perform end-to-end testing of the new pipeline to ensure data accuracy and system reliability.\\n   - Validate the accuracy of weight data against historical records.\\n\\n6. **Documentation and Training**\\n   - Create comprehensive documentation for the new weight tracking pipeline, including setup instructions and user manuals.\\n   - Conduct training sessions for team members and restaurant staff on how to use the new features.\\n\\nEstimation: 20 story points\\n\\n---\\n\\nThis Kanban user story ensures the task of implementing a new Todoist pipeline for tracking the weight of inventory items is well-defined, actionable, and aligned with project objectives, thereby enhancing team productivity and workflow efficiency."}]',
    }
    lambda_handler(event, None)
