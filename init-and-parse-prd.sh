#!/bin/bash

# Clear any existing task-master files
echo "Cleaning up any existing TaskMaster files..."
rm -rf /workspaces/wyatt-personal-aws/tasks
rm -f /workspaces/wyatt-personal-aws/.taskmasterconfig

# Initialize TaskMaster AI project
echo "Initializing TaskMaster AI project..."
npx --yes task-master-ai@latest init \
  --yes \
  --projectRoot /workspaces/wyatt-personal-aws

# Wait a moment for initialization to complete
sleep 2

# Parse the PRD
echo "Parsing PRD to generate tasks..."
npx --yes task-master-ai@latest parse-prd \
  --input /workspaces/wyatt-personal-aws/scripts/prd.txt \
  --projectRoot /workspaces/wyatt-personal-aws \
  --numTasks 15 \
  --research

echo "TaskMaster initialization and PRD parsing complete!"
