# Main Visualizations Table
# Stores visualization metadata with the following attributes:
# - userId (S): Primary key - User who owns the visualization
# - visualizationId (S): Sort key - Unique identifier for the visualization
# - title (S): User-defined title for the visualization
# - description (S): User-defined description
# - visualizationType (S): Type of visualization (bar, line, scatter, etc.)
# - createdAt (N): Creation timestamp
# - updatedAt (N): Last update timestamp
# - isPublic (BOOL): Whether the visualization is publicly accessible
# - tags (SS): Set of user-defined tags for organization
# - parameterSetId (S): Reference to parameters table for this visualization
module "visualization_table" {
  source = "./modules/dynamodb"

  environment = var.environment
  table_name  = "${var.project_name}-visualizations-${var.environment}"
  hash_key    = "userId"
  range_key   = "visualizationId"

  attributes = [
    {
      name = "userId"
      type = "S"
    },
    {
      name = "visualizationId"
      type = "S"
    },
    {
      name = "createdAt"
      type = "N"
    },
    {
      name = "visualizationType"
      type = "S"
    },
    {
      name = "isPublic"
      type = "S" # Using string representation of boolean for GSI compatibility
    }
  ]

  global_secondary_indexes = [
    {
      name               = "CreatedAtIndex"
      hash_key           = "userId"
      range_key          = "createdAt"
      write_capacity     = 5
      read_capacity      = 5
      projection_type    = "ALL"
      non_key_attributes = []
    },
    {
      name               = "TypeIndex"
      hash_key           = "userId"
      range_key          = "visualizationType"
      write_capacity     = 5
      read_capacity      = 5
      projection_type    = "ALL"
      non_key_attributes = []
    },
    {
      name               = "PublicVisualizationsIndex"
      hash_key           = "isPublic"
      range_key          = "createdAt"
      write_capacity     = 5
      read_capacity      = 5
      projection_type    = "ALL"
      non_key_attributes = []
    }
  ]

  billing_mode = var.dynamodb_billing_mode

  # Enable point-in-time recovery
  enable_point_in_time_recovery = var.dynamodb_point_in_time_recovery

  # Auto-scaling settings
  autoscaling_enabled            = false
  autoscaling_read_max_capacity  = 100
  autoscaling_write_max_capacity = 100

  tags = {
    Component   = "D3 Dashboard"
    Name        = "Visualization Table"
    Environment = var.environment
  }
}
