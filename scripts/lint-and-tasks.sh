#!/usr/bin/env bash
#
# Script to run terraform fmt, pre-commit checks, and create taskmaster tasks
# for any issues found
#
# Usage:
#   ./lint-and-tasks.sh [environment]
#
# Examples:
#   ./lint-and-tasks.sh             # Auto-detect environment
#   ./lint-and-tasks.sh dev         # Force dev environment
#   ./lint-and-tasks.sh prod        # Force prod environment
#   ENV=dev ./lint-and-tasks.sh     # Set via environment variable
#
set -e

# Define colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the script directory and project root
SCRIPT_DIR=$(dirname "$0")
PROJECT_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)

# Check for command-line argument for environment
if [ -n "$1" ]; then
  ENV="$1"
  echo -e "${YELLOW}Environment specified via command line: $ENV${NC}"
fi

# Define output files - use current working directory for logs
PRECOMMIT_LOG="$(pwd)/precommit_results.log"
TERRAFORM_LOG="$(pwd)/terraform_fmt_results.log"
TERRAFORM_PLAN_LOG="$(pwd)/terraform_plan_results.log"

# Change to project root
cd "$PROJECT_ROOT"

# Copy dev environment first, then run terraform fmt
if [ -d "$PROJECT_ROOT/environments/dev" ] && [ -d "$PROJECT_ROOT/main" ]; then
  echo -e "${YELLOW}Setting up dev environment vars...${NC}"
  if [ -f "$PROJECT_ROOT/environments/dev/terraform.tfvars" ]; then
    echo -e "${YELLOW}Copying dev terraform.tfvars to main directory...${NC}"
    cp "$PROJECT_ROOT/environments/dev/terraform.tfvars" "$PROJECT_ROOT/main/terraform.tfvars" || \
      echo -e "${RED}Failed to copy dev environment tfvars file.${NC}"
  else
    echo -e "${RED}Dev environment tfvars file not found. Using existing main configuration.${NC}"
  fi
fi

echo -e "${YELLOW}Running terraform fmt recursively...${NC}"
echo "Terraform formatting results:" > "$TERRAFORM_LOG"
echo "======================" >> "$TERRAFORM_LOG"
echo "" >> "$TERRAFORM_LOG"

if [ -d "$PROJECT_ROOT/main" ]; then
  cd "$PROJECT_ROOT/main"
  # Run terraform fmt and capture both stdout and stderr to the log file
  if ! terraform fmt -recursive >> "$TERRAFORM_LOG" 2>&1; then
    echo -e "${RED}Terraform formatting failed. See $TERRAFORM_LOG for details.${NC}"
  else
    echo -e "${GREEN}Terraform formatting succeeded.${NC}"
  fi
  cd "$PROJECT_ROOT"
else
  echo -e "${RED}Directory $PROJECT_ROOT/main does not exist. Skipping terraform fmt.${NC}" | tee -a "$TERRAFORM_LOG"
fi

# Format environment tfvars files too
if [ -d "$PROJECT_ROOT/environments" ]; then
  cd "$PROJECT_ROOT/environments"
  # Check for tfvars files in the environments directory
  echo "Environment tfvars formatting:" >> "$TERRAFORM_LOG"
  echo "============================" >> "$TERRAFORM_LOG"
  echo "" >> "$TERRAFORM_LOG"

  if ls *.tfvars 2>/dev/null; then
    echo -e "${YELLOW}Formatting environment tfvars files...${NC}"
    echo "Root environment directory:" >> "$TERRAFORM_LOG"
    if ! terraform fmt *.tfvars >> "$TERRAFORM_LOG" 2>&1; then
      echo -e "${RED}Terraform formatting failed for environment files. See $TERRAFORM_LOG for details.${NC}"
    fi
  else
    echo -e "${YELLOW}No tfvars files found in root environments directory.${NC}"
    echo "No tfvars files found in root environments directory." >> "$TERRAFORM_LOG"
  fi

  # Process dev environment
  if [ -d "$PROJECT_ROOT/environments/dev" ]; then
    echo -e "${YELLOW}Processing dev environment...${NC}"
    cd "$PROJECT_ROOT/environments/dev"
    echo "" >> "$TERRAFORM_LOG"
    echo "Dev environment directory:" >> "$TERRAFORM_LOG"
    # Format tfvars files in dev environment
    if ls *.tfvars 2>/dev/null; then
      echo -e "${YELLOW}Formatting dev environment tfvars files...${NC}"
      if ! terraform fmt *.tfvars >> "$TERRAFORM_LOG" 2>&1; then
        echo -e "${RED}Terraform formatting failed for dev environment files. See $TERRAFORM_LOG for details.${NC}"
      fi
    else
      echo "No tfvars files found in dev environment directory." >> "$TERRAFORM_LOG"
    fi
  else
    echo -e "${YELLOW}No dev environment directory found.${NC}"
    echo "No dev environment directory found." >> "$TERRAFORM_LOG"
  fi

  # Process prod directory (but don't copy by default)
  if [ -d "$PROJECT_ROOT/environments/prod" ]; then
    echo -e "${YELLOW}Processing prod environment...${NC}"
    cd "$PROJECT_ROOT/environments/prod"
    echo "" >> "$TERRAFORM_LOG"
    echo "Prod environment directory:" >> "$TERRAFORM_LOG"
    if ls *.tfvars 2>/dev/null; then
      echo -e "${YELLOW}Formatting prod environment tfvars files...${NC}"
      if ! terraform fmt *.tfvars >> "$TERRAFORM_LOG" 2>&1; then
        echo -e "${RED}Terraform formatting failed for prod environment files. See $TERRAFORM_LOG for details.${NC}"
      fi
    else
      echo "No tfvars files found in prod environment directory." >> "$TERRAFORM_LOG"
    fi
  else
    echo -e "${YELLOW}No prod environment directory found.${NC}"
    echo "No prod environment directory found." >> "$TERRAFORM_LOG"
  fi

  cd "$PROJECT_ROOT"
fi

# Determine the current environment based on git branch or ENV variable
CURRENT_ENV=${ENV:-""}
if [ -z "$CURRENT_ENV" ]; then
  # Try to determine environment from git branch
  if command -v git > /dev/null 2>&1 && git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    if [ "$CURRENT_BRANCH" = "main" ]; then
      CURRENT_ENV="prod"
    else
      # Default to dev for any branch other than main
      CURRENT_ENV="dev"
    fi
  else
    # Default to dev if git not available
    CURRENT_ENV="dev"
  fi
fi

echo -e "${YELLOW}Current environment detected: $CURRENT_ENV${NC}"

# Always run pre-commit checks regardless of environment
echo -e "${YELLOW}Running pre-commit checks...${NC}"
echo "Pre-commit results:" > "$PRECOMMIT_LOG"
echo "===================" >> "$PRECOMMIT_LOG"
echo "" >> "$PRECOMMIT_LOG"

# Run pre-commit and capture output
echo -e "${YELLOW}Attempting to run pre-commit - this may fail if permissions are not set correctly${NC}"
if ! pre-commit run --all-files >> "$PRECOMMIT_LOG" 2>&1; then
  # Check if the error is permission related
  if grep -q "Permission denied" "$PRECOMMIT_LOG"; then
    echo -e "${RED}Pre-commit failed due to permission issues. To fix this, run:${NC}"
    echo -e "${YELLOW}sudo mkdir -p /home/vscode/.cache/pre-commit && sudo chown -R vscode:vscode /home/vscode/.cache${NC}"
  else
    echo -e "${RED}Pre-commit checks found issues. See $PRECOMMIT_LOG for details.${NC}"
  fi
else
  echo -e "${GREEN}Pre-commit checks passed successfully!${NC}"
fi

# Display the log file path
echo -e "${YELLOW}Log file created at: $PRECOMMIT_LOG${NC}"

# Create tasks from pre-commit results (only for dev environment)
if [ "$CURRENT_ENV" = "dev" ]; then
  # Ask claude-code to analyze the results and create tasks
  echo -e "${YELLOW}Asking Claude Code to analyze pre-commit results and create tasks...${NC}"
  echo

  # Display command to run
  echo "Run the following command to analyze the results with Claude Code:"
  echo "claude-code \"Please analyze the pre-commit results in $PRECOMMIT_LOG and create Task-Master tasks for any issues that need to be addressed. Group similar issues together into logical tasks. Once you've created the tasks, list all the new tasks you've created.\""

  # Check if claude-code command is available
  if command -v claude-code > /dev/null 2>&1; then
    # Now execute the claude-code analyze command
    if [ -f "$PROJECT_ROOT/scripts/taskmaster.sh" ]; then
      echo -e "${YELLOW}Analyzing pre-commit results and creating tasks...${NC}"
      bash "$PROJECT_ROOT/scripts/taskmaster.sh" update-from-log "$PRECOMMIT_LOG" || \
        echo -e "${RED}Failed to run taskmaster.sh. Check the script permissions and contents.${NC}"
    else
      echo -e "${RED}Taskmaster script not found at $PROJECT_ROOT/scripts/taskmaster.sh${NC}"
    fi
  else
    echo -e "${YELLOW}Skipping task creation: claude-code command not available in this environment.${NC}"
    echo "You can manually analyze the pre-commit results and create tasks later."
  fi
else
  echo -e "${YELLOW}Skipping task creation for $CURRENT_ENV environment.${NC}"
fi

# Check if terraform plan should be executed
ENV_VAR_FILE="$PROJECT_ROOT/main/environments/$CURRENT_ENV.tfvars"
if [ -d "$PROJECT_ROOT/main" ] && [ -f "$ENV_VAR_FILE" ]; then
  echo -e "${YELLOW}Running terraform plan to verify configuration ($CURRENT_ENV environment)...${NC}"
  echo "Terraform plan results for $CURRENT_ENV environment:" > "$TERRAFORM_PLAN_LOG"
  echo "====================" >> "$TERRAFORM_PLAN_LOG"
  echo "" >> "$TERRAFORM_PLAN_LOG"

  cd "$PROJECT_ROOT/main"
  # Attempt to initialize if .terraform directory doesn't exist
  if [ ! -d ".terraform" ]; then
    echo -e "${YELLOW}Running terraform init first...${NC}"
    echo "Terraform init output:" >> "$TERRAFORM_PLAN_LOG"
    echo "-----------------" >> "$TERRAFORM_PLAN_LOG"
    if ! terraform init >> "$TERRAFORM_PLAN_LOG" 2>&1; then
      echo -e "${RED}Terraform init failed. See $TERRAFORM_PLAN_LOG for details.${NC}"
      echo "Terraform init FAILED" >> "$TERRAFORM_PLAN_LOG"
    else
      echo "Terraform init SUCCEEDED" >> "$TERRAFORM_PLAN_LOG"
      echo "" >> "$TERRAFORM_PLAN_LOG"
    fi
  fi

  # Run terraform plan if init was successful
  if [ -d ".terraform" ]; then
    echo -e "${YELLOW}Running terraform plan for $CURRENT_ENV environment...${NC}"
    echo "Terraform plan output:" >> "$TERRAFORM_PLAN_LOG"
    echo "-----------------" >> "$TERRAFORM_PLAN_LOG"

    # Use a flag to check if a TF_API_TOKEN is available
    TF_TOKEN_AVAILABLE="false"
    if [ -n "$TF_API_TOKEN" ]; then
      TF_TOKEN_AVAILABLE="true"
    fi

    # Run terraform plan and capture the output
    terraform plan -var-file="environments/$CURRENT_ENV.tfvars" >> "$TERRAFORM_PLAN_LOG" 2>&1
    PLAN_EXIT_CODE=$?

    if [ $PLAN_EXIT_CODE -ne 0 ]; then
      # Check if the error is Terraform Cloud token related
      if grep -q "Required token could not be found" "$TERRAFORM_PLAN_LOG"; then
        echo -e "${RED}Terraform plan failed: No Terraform Cloud token found.${NC}"
        echo -e "${YELLOW}To fix this either:${NC}"
        echo -e " - Run 'terraform login' to authenticate with Terraform Cloud"
        echo -e " - Or set TF_API_TOKEN environment variable"
        echo -e " - Or modify the backend to use local state instead of Terraform Cloud"
      else
        echo -e "${RED}Terraform plan failed. See $TERRAFORM_PLAN_LOG for details.${NC}"
      fi
      echo "Terraform plan FAILED" >> "$TERRAFORM_PLAN_LOG"
    else
      echo -e "${GREEN}Terraform plan succeeded.${NC}"
      echo "Terraform plan SUCCEEDED" >> "$TERRAFORM_PLAN_LOG"
    fi
  fi
  cd "$PROJECT_ROOT"
else
  echo -e "${YELLOW}Skipping terraform plan (environment file not found: $ENV_VAR_FILE).${NC}"
  echo "Terraform plan skipped: environment file not found: $ENV_VAR_FILE" >> "$TERRAFORM_PLAN_LOG"
fi

echo -e "${GREEN}Done!${NC}"

# Display log file locations
echo -e "${YELLOW}Log files created:${NC}"
echo -e "  - Terraform formatting: ${TERRAFORM_LOG}"
echo -e "  - Terraform plan results: ${TERRAFORM_PLAN_LOG}"
echo -e "  - Pre-commit results: ${PRECOMMIT_LOG}"
