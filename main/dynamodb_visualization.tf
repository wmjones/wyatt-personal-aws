# DynamoDB tables for the Normal Distribution Visualization Dashboard

# Normal distribution parameters table
# Stores visualization parameters with the following attributes:
# - paramId (S): Primary key - Identifier for the parameter set
# - timestamp (N): Sort key - Update timestamp
# - mean (N): Mean value for normal distribution
# - stdDev (N): Standard deviation value
# - lastUpdatedBy (S): User identifier who last updated
# - userId (S): User who owns the visualization
# - lastUpdatedAt (N): Last update timestamp (redundant with timestamp but more explicit)
module "parameter_table" {
  source = "./modules/dynamodb"

  environment = var.environment
  table_name  = "${var.project_name}-parameters-${var.environment}"
  hash_key    = "paramId"
  range_key   = "timestamp"

  attributes = [
    {
      name = "paramId"
      type = "S"
    },
    {
      name = "timestamp"
      type = "N"
    },
    # Adding userId as a searchable attribute for potential GSI
    {
      name = "userId"
      type = "S"
    }
  ]

  # Add a GSI to query parameters by user
  global_secondary_indexes = [
    {
      name               = "UserIdIndex"
      hash_key           = "userId"
      range_key          = "timestamp"
      write_capacity     = 5
      read_capacity      = 5
      projection_type    = "ALL"
      non_key_attributes = []
    }
  ]

  billing_mode = var.dynamodb_billing_mode

  enable_point_in_time_recovery = var.dynamodb_point_in_time_recovery

  tags = {
    Component   = "D3 Dashboard"
    Name        = "Parameter Table"
    Environment = var.environment
  }
}

# Parameter change history table
# Stores parameter change history with the following attributes:
# - userId (S): Primary key - User who made the change
# - timestamp (N): Sort key - When the change occurred
# - paramName (S): Name of the parameter changed (used in GSI)
# - paramId (S): ID of the parameter set that was changed
# - oldValue (N): Previous parameter value
# - newValue (N): New parameter value
# - userEmail (S): Email of the user for display purposes
module "history_table" {
  source = "./modules/dynamodb"

  environment = var.environment
  table_name  = "${var.project_name}-parameter-history-${var.environment}"
  hash_key    = "userId"
  range_key   = "timestamp"

  attributes = [
    {
      name = "userId"
      type = "S"
    },
    {
      name = "timestamp"
      type = "N"
    },
    {
      name = "paramName"
      type = "S"
    },
    {
      name = "paramId"
      type = "S"
    }
  ]

  global_secondary_indexes = [
    {
      name               = "ParamNameIndex"
      hash_key           = "paramName"
      range_key          = "timestamp"
      write_capacity     = 5
      read_capacity      = 5
      projection_type    = "ALL"
      non_key_attributes = []
    },
    {
      name               = "ParamIdIndex"
      hash_key           = "paramId"
      range_key          = "timestamp"
      write_capacity     = 5
      read_capacity      = 5
      projection_type    = "ALL"
      non_key_attributes = []
    }
  ]

  billing_mode = var.dynamodb_billing_mode

  enable_point_in_time_recovery = var.dynamodb_point_in_time_recovery

  tags = {
    Component   = "D3 Dashboard"
    Name        = "Parameter History Table"
    Environment = var.environment
  }
}

# WebSocket connections table
# Stores WebSocket connection information with the following attributes:
# - connectionId (S): Primary key - WebSocket connection identifier
# - userId (S): User identifier who owns the connection
# - connectedAt (N): Timestamp when the connection was established
# - expiry (N): TTL timestamp for connection expiration
# - connectionStatus (S): Status of the connection (connected, disconnected)
# - clientIp (S): Client IP address for diagnostics
module "connection_table" {
  source = "./modules/dynamodb"

  environment = var.environment
  table_name  = "${var.project_name}-connections-${var.environment}"
  hash_key    = "connectionId"

  attributes = [
    {
      name = "connectionId"
      type = "S"
    },
    {
      name = "userId"
      type = "S"
    }
  ]

  # Add a GSI to query connections by user
  global_secondary_indexes = [
    {
      name               = "UserConnectionsIndex"
      hash_key           = "userId"
      range_key          = "connectionId"
      write_capacity     = 5
      read_capacity      = 5
      projection_type    = "ALL"
      non_key_attributes = []
    }
  ]

  billing_mode = var.dynamodb_billing_mode

  # TTL for auto-cleanup of stale connections
  enable_point_in_time_recovery = false
  ttl_enabled                   = true
  ttl_attribute                 = "expiry"

  tags = {
    Component   = "D3 Dashboard"
    Name        = "WebSocket Connections Table"
    Environment = var.environment
  }
}
