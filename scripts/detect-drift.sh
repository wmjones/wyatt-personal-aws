#!/bin/bash
# State drift detection script for Terraform Cloud workspaces
# Usage: ./detect-drift.sh [environment] [--fix]

set -e

# Set color outputs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
ENV=${1:-all}
FIX_MODE=false

if [ "$2" == "--fix" ]; then
    FIX_MODE=true
fi

# Map environment to workspace
declare -A WORKSPACE_MAP=(
  ["dev"]="wyatt-personal-aws-dev"
  ["prod"]="wyatt-personal-aws-prod"
)

# Function to check drift in a specific workspace
check_workspace_drift() {
    local env=$1
    local workspace=$2

    echo -e "${BLUE}=== Checking drift in $env environment ===${NC}"
    echo -e "${YELLOW}Workspace: $workspace${NC}"

    # Change to terraform directory
    cd /workspaces/wyatt-personal-aws/main

    # Set workspace
    export TF_WORKSPACE=$workspace

    # Initialize terraform
    echo -e "${YELLOW}Initializing Terraform...${NC}"
    terraform init -upgrade >/dev/null 2>&1

    # Select workspace
    terraform workspace select $workspace >/dev/null 2>&1 || {
        echo -e "${RED}Failed to select workspace $workspace${NC}"
        return 1
    }

    # Refresh state
    echo -e "${YELLOW}Refreshing state...${NC}"
    terraform refresh -var-file=environments/$env.tfvars >/dev/null 2>&1

    # Run plan to detect drift
    echo -e "${YELLOW}Checking for configuration drift...${NC}"

    # Capture plan output
    PLAN_OUTPUT="/tmp/drift-check-$env.txt"
    terraform plan -var-file=environments/$env.tfvars -detailed-exitcode -no-color > "$PLAN_OUTPUT" 2>&1
    PLAN_EXIT_CODE=$?

    # Analyze results
    case $PLAN_EXIT_CODE in
        0)
            echo -e "${GREEN}✓ No drift detected${NC}"
            rm -f "$PLAN_OUTPUT"
            return 0
            ;;
        1)
            echo -e "${RED}✗ Error running plan${NC}"
            cat "$PLAN_OUTPUT"
            rm -f "$PLAN_OUTPUT"
            return 1
            ;;
        2)
            echo -e "${RED}✗ Drift detected!${NC}"

            # Parse drift details
            echo -e "${YELLOW}Drift summary:${NC}"

            # Count changes
            ADDITIONS=$(grep -c "# .* will be created" "$PLAN_OUTPUT" || true)
            CHANGES=$(grep -c "# .* will be updated" "$PLAN_OUTPUT" || true)
            DELETIONS=$(grep -c "# .* will be destroyed" "$PLAN_OUTPUT" || true)

            echo "  - Resources to be created: $ADDITIONS"
            echo "  - Resources to be updated: $CHANGES"
            echo "  - Resources to be destroyed: $DELETIONS"
            echo ""

            # Show detailed drift
            echo -e "${YELLOW}Detailed drift:${NC}"
            grep -E "^  # |^  ~ |^  \+ |^  - " "$PLAN_OUTPUT" | head -20
            echo ""

            # If fix mode is enabled, offer to reconcile
            if [ "$FIX_MODE" == true ]; then
                echo -e "${YELLOW}Fix mode is enabled. Would you like to reconcile the drift?${NC}"
                read -p "Reconcile $env environment? (yes/no): " CONFIRM

                if [ "$CONFIRM" == "yes" ]; then
                    echo -e "${YELLOW}Running state reconciliation...${NC}"
                    /workspaces/wyatt-personal-aws/scripts/reconcile-state.sh $env
                fi
            else
                echo -e "${YELLOW}To automatically fix this drift, run:${NC}"
                echo "  ./detect-drift.sh $env --fix"
            fi

            # Save detailed report
            REPORT_FILE="/tmp/drift-report-$env-$(date +%Y%m%d-%H%M%S).txt"
            cp "$PLAN_OUTPUT" "$REPORT_FILE"
            echo -e "${BLUE}Full drift report saved to: $REPORT_FILE${NC}"

            rm -f "$PLAN_OUTPUT"
            return 2
            ;;
    esac
}

# Main execution
echo -e "${BLUE}Terraform State Drift Detection${NC}"
echo -e "${BLUE}==============================${NC}"
echo ""

if [ "$ENV" == "all" ]; then
    # Check all environments
    TOTAL_DRIFT=0

    for env in "${!WORKSPACE_MAP[@]}"; do
        check_workspace_drift "$env" "${WORKSPACE_MAP[$env]}"
        DRIFT_STATUS=$?

        if [ $DRIFT_STATUS -eq 2 ]; then
            ((TOTAL_DRIFT++))
        fi

        echo ""
    done

    # Summary
    echo -e "${BLUE}=== Drift Detection Summary ===${NC}"
    if [ $TOTAL_DRIFT -eq 0 ]; then
        echo -e "${GREEN}✓ No drift detected in any environment${NC}"
    else
        echo -e "${RED}✗ Drift detected in $TOTAL_DRIFT environment(s)${NC}"
        echo -e "${YELLOW}Run with --fix flag to reconcile drift${NC}"
    fi
else
    # Check specific environment
    if [ -z "${WORKSPACE_MAP[$ENV]}" ]; then
        echo -e "${RED}Invalid environment: $ENV${NC}"
        echo "Valid environments: dev, prod"
        exit 1
    fi

    check_workspace_drift "$ENV" "${WORKSPACE_MAP[$ENV]}"
fi

echo ""
echo -e "${BLUE}Drift detection complete!${NC}"

# Create cron job suggestion
echo ""
echo -e "${YELLOW}To run drift detection regularly, add this to your crontab:${NC}"
echo "# Run drift detection daily at 2 AM"
echo "0 2 * * * /workspaces/wyatt-personal-aws/scripts/detect-drift.sh all >> /var/log/terraform-drift.log 2>&1"
