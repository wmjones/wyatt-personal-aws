import json
import re
from dataclasses import asdict, dataclass
from typing import List

import boto3
from botocore.exceptions import ClientError


@dataclass
class Task:
    assignee_id: str
    assigner_id: str
    comment_count: int
    is_completed: bool
    content: str
    created_at: str
    creator_id: str
    description: str
    due: dict
    id: str
    labels: list
    order: int
    parent_id: str
    priority: int
    project_id: str
    section_id: str
    url: str
    duration: str
    sync_id: str


@dataclass
class SuperTask(Task):
    agent_output: str = ""
    passChatGPT: bool = True
    name: str = ""

    def __init__(self, agent_output="", passChatGPT=True, name="", **kwargs):
        super().__init__(**kwargs)
        self.agent_output = agent_output
        self.passChatGPT = passChatGPT
        self.name = name


def tasks_to_json(tasks: List[SuperTask]) -> str:
    tasks_dict = []
    for task in tasks:
        # if task.project_id == "2334637095":  # Biftu
        task_dict = asdict(task)
        tasks_dict.append(task_dict)
    return json.dumps(tasks_dict)


def parse_inline_formatting(text):
    parts = []
    bold_pattern = r"\*\*(.*?)\*\*"

    last_end = 0
    for match in re.finditer(bold_pattern, text):
        if match.start() > last_end:
            parts.append({"type": "text", "text": {"content": text[last_end : match.start()]}})

        parts.append({"type": "text", "text": {"content": match.group(1)}, "annotations": {"bold": True}})

        last_end = match.end()

    if last_end < len(text):
        parts.append({"type": "text", "text": {"content": text[last_end:]}})

    return parts


def markdown_to_notion_blocks(markdown_content):
    blocks = []
    lines = markdown_content.split("\n")

    list_number = 0
    for line in lines:
        if line.strip() == "":
            list_number = 0  # Reset list numbering on empty lines
            continue

        # Check for headings
        if line.startswith("#"):
            level = len(line.split()[0])
            content = line.lstrip("#").strip()
            blocks.append(
                {
                    "object": "block",
                    "type": f"heading_{level}",
                    f"heading_{level}": {"rich_text": parse_inline_formatting(content)},
                }
            )
            list_number = 0  # Reset list numbering after headings

        # Check for bullet lists
        elif line.strip().startswith("- "):
            content = line.strip()[2:]
            blocks.append(
                {
                    "object": "block",
                    "type": "bulleted_list_item",
                    "bulleted_list_item": {"rich_text": parse_inline_formatting(content)},
                }
            )
            list_number = 0  # Reset list numbering for bullet lists

        # Check for numbered lists
        elif re.match(r"^\d+\.", line.strip()):
            list_number += 1
            content = re.sub(r"^\d+\.", "", line).strip()
            blocks.append(
                {
                    "object": "block",
                    "type": "numbered_list_item",
                    "numbered_list_item": {"rich_text": parse_inline_formatting(content)},
                }
            )

        # Everything else as a paragraph
        else:
            blocks.append({"object": "block", "type": "paragraph", "paragraph": {"rich_text": parse_inline_formatting(line)}})
            list_number = 0  # Reset list numbering for paragraphs

    return blocks


def get_secret(secret_name, region_name):
    # Create a Secrets Manager client
    session = boto3.session.Session()
    client = session.client(service_name="secretsmanager", region_name=region_name)

    try:
        get_secret_value_response = client.get_secret_value(SecretId=secret_name)
    except ClientError as e:
        # For a list of exceptions thrown, see
        # https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
        raise e

    return get_secret_value_response["SecretString"]


if __name__ == "__main__":
    # Read in the example.md file
    with open("src/lambda/example.md") as file:
        markdown_content = file.read()
    # test the markdown_to_notion_blocks function
    print(markdown_to_notion_blocks(markdown_content))
