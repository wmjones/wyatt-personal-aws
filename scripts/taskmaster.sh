#!/bin/bash
#
# TaskMaster helper script
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

COMMAND=$1
LOGFILE=$2

case "$COMMAND" in
  update-from-log)
    if [ -z "$LOGFILE" ]; then
      echo -e "${RED}Error: Log file path is required for update-from-log command${NC}"
      exit 1
    fi

    if [ ! -f "$LOGFILE" ]; then
      echo -e "${RED}Error: Log file not found: $LOGFILE${NC}"
      exit 1
    fi

    echo -e "${YELLOW}Analyzing pre-commit results and creating tasks...${NC}"

    # Use Task (Claude Code Agent) to analyze the log and create tasks
    claude-code "Please analyze the pre-commit results in $LOGFILE and create TaskMaster tasks for any issues that need to be addressed. Group similar issues together into logical tasks. For each issue, create a task that includes:

1. A descriptive title describing the type of issue
2. A detailed description explaining what needs to be fixed
3. A list of files affected
4. Information about why this is important to fix

Once you've created the tasks using the mcp__taskmaster-ai__add_task tool, list all the new tasks you've created. Make sure to prioritize the tasks appropriately based on importance."
    ;;
  *)
    echo "TaskMaster Helper Script"
    echo "Usage:"
    echo "  $0 update-from-log <logfile>  - Analyze pre-commit results and create tasks"
    ;;
esac
