output "table_id" {
  description = "ID of the DynamoDB table"
  value       = module.dynamodb_table.dynamodb_table_id
}

output "table_arn" {
  description = "ARN of the DynamoDB table"
  value       = module.dynamodb_table.dynamodb_table_arn
}

output "table_stream_arn" {
  description = "The ARN of the Table Stream. Only available when stream_enabled = true"
  value       = module.dynamodb_table.dynamodb_table_stream_arn
}

output "table_stream_label" {
  description = "A timestamp, in ISO 8601 format of the Table Stream. Only available when stream_enabled = true"
  value       = module.dynamodb_table.dynamodb_table_stream_label
}
