module "todoist_workflow" {
  source = "./modules/step_function"

  name     = "${var.project_name}-todoist-workflow-${var.environment}"
  type     = "STANDARD"
  role_arn = aws_iam_role.sfn_role.arn

  definition = jsonencode({
    Comment : "Todoist task enrichment workflow with ChatGPT and Notion integration",
    StartAt : "GetIncompleteTasks",
    States : {
      GetIncompleteTasks : {
        Type : "Task",
        Resource : module.todoist_lambda.function_arn,
        Next : "PutChatGPT",
        Retry : [
          {
            ErrorEquals : ["States.TaskFailed"],
            IntervalSeconds : 3,
            MaxAttempts : 2,
            BackoffRate : 1.5
          }
        ]
      },
      PutChatGPT : {
        Type : "Task",
        Resource : module.chatgpt_lambda.function_arn,
        Next : "PutNotion",
        Retry : [
          {
            ErrorEquals : ["States.TaskFailed"],
            IntervalSeconds : 3,
            MaxAttempts : 2,
            BackoffRate : 1.5
          }
        ]
      },
      PutNotion : {
        Type : "Task",
        Resource : module.notion_lambda.function_arn,
        Next : "PutTodoist",
        Retry : [
          {
            ErrorEquals : ["States.TaskFailed"],
            IntervalSeconds : 3,
            MaxAttempts : 2,
            BackoffRate : 1.5
          }
        ]
      },
      PutTodoist : {
        Type : "Task",
        Resource : module.put_todoist_lambda.function_arn,
        End : true,
        Retry : [
          {
            ErrorEquals : ["States.TaskFailed"],
            IntervalSeconds : 3,
            MaxAttempts : 2,
            BackoffRate : 1.5
          }
        ]
      }
    }
  })

  tags = {
    Component   = "Productivity System"
    Name        = "Todoist Workflow"
    Environment = var.environment
  }
}
