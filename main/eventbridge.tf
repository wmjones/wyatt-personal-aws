# Create the EventBridge rule directly
resource "aws_cloudwatch_event_rule" "todoist_workflow" {
  provider = aws.us_east_2 # Explicitly specify the us-east-2 provider

  name                = "todoist-workflow-rule-${var.environment}"
  description         = "Run the Todoist workflow on a schedule"
  schedule_expression = "rate(15 minutes)"

  tags = {
    Component   = "Productivity System"
    Name        = "EventBridge Scheduler"
    Environment = var.environment
  }

  # Add lifecycle to prevent recreation and ensure proper creation
  lifecycle {
    create_before_destroy = true
  }

  # Make sure the IAM role exists before creating this rule
  depends_on = [aws_iam_role.eventbridge_role]
}

# Create the EventBridge target with explicit role_arn
resource "aws_cloudwatch_event_target" "todoist_workflow" {
  provider = aws.us_east_2 # Explicitly specify the us-east-2 provider

  rule      = aws_cloudwatch_event_rule.todoist_workflow.name
  target_id = "trigger-todoist-workflow"
  arn       = module.todoist_workflow.state_machine_arn
  role_arn  = aws_iam_role.eventbridge_role.arn

  input_transformer {
    input_paths = {
      time = "$.time"
    }
    input_template = jsonencode({
      time   = "<time>",
      source = "aws.events"
    })
  }

  # Ensure rule is created before target
  depends_on = [
    aws_cloudwatch_event_rule.todoist_workflow,
    aws_iam_role.eventbridge_role,
    aws_iam_role_policy.eventbridge_policy
  ]
}
