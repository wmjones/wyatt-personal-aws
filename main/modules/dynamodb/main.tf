module "dynamodb_table" {
  source  = "terraform-aws-modules/dynamodb-table/aws"
  version = "~> 3.0"

  name         = var.table_name
  hash_key     = var.hash_key
  range_key    = var.range_key
  billing_mode = var.billing_mode

  read_capacity  = var.billing_mode == "PROVISIONED" ? var.read_capacity : null
  write_capacity = var.billing_mode == "PROVISIONED" ? var.write_capacity : null

  attributes = var.attributes

  # Enable point-in-time recovery for production environments
  point_in_time_recovery_enabled = var.enable_point_in_time_recovery

  # Enable server-side encryption
  server_side_encryption_enabled = true

  # TTL configuration
  ttl_enabled        = var.ttl_enabled
  ttl_attribute_name = var.ttl_attribute

  # Global secondary indexes
  global_secondary_indexes = var.global_secondary_indexes

  # Local secondary indexes
  local_secondary_indexes = var.local_secondary_indexes

  # Auto-scaling settings (if PROVISIONED)
  autoscaling_enabled = var.billing_mode == "PROVISIONED" && var.autoscaling_enabled

  autoscaling_read = var.billing_mode == "PROVISIONED" && var.autoscaling_enabled ? {
    scale_in_cooldown  = 30
    scale_out_cooldown = 30
    target_value       = 70
    max_capacity       = var.autoscaling_read_max_capacity
  } : {}

  autoscaling_write = var.billing_mode == "PROVISIONED" && var.autoscaling_enabled ? {
    scale_in_cooldown  = 30
    scale_out_cooldown = 30
    target_value       = 70
    max_capacity       = var.autoscaling_write_max_capacity
  } : {}

  # Tagging
  tags = merge(var.tags, {
    Environment = var.environment
  })
}
