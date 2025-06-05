#!/bin/bash
# filter-lambda-drift.sh
# This script analyzes Terraform plan output to filter out drift caused only by Lambda source_code_hash changes

set -euo pipefail

# Function to check if a resource change is only due to source_code_hash
is_source_hash_only_change() {
    local resource_changes="$1"

    # Parse the JSON to find changes
    local changes=$(echo "$resource_changes" | jq -r '.change.before // {} | keys[] as $k | select(.change.after[$k] != .change.before[$k]) | $k' 2>/dev/null || echo "")

    # If the only change is source_code_hash, return true
    if [[ "$changes" == "source_code_hash" ]] || [[ -z "$changes" ]]; then
        return 0
    else
        return 1
    fi
}

# Function to analyze plan and report real drift
analyze_drift() {
    local plan_json="$1"
    local real_drift_count=0
    local lambda_hash_only_count=0
    local real_drift_resources=()

    # Get all resource changes
    local resource_changes=$(echo "$plan_json" | jq -c '.resource_changes[]? // empty')

    while IFS= read -r change; do
        local address=$(echo "$change" | jq -r '.address')
        local type=$(echo "$change" | jq -r '.type')
        local action=$(echo "$change" | jq -r '.change.actions[0]')

        # Skip if no action or action is "no-op"
        if [[ "$action" == "null" ]] || [[ "$action" == "no-op" ]]; then
            continue
        fi

        # Check if this is a Lambda function with only source_code_hash changes
        if [[ "$type" == "aws_lambda_function" ]] && [[ "$action" == "update" ]]; then
            if is_source_hash_only_change "$change"; then
                ((lambda_hash_only_count++))
                echo "ℹ️  Lambda hash-only change (ignoring): $address"
            else
                ((real_drift_count++))
                real_drift_resources+=("$address")
                echo "⚠️  Real drift detected: $address"
            fi
        else
            ((real_drift_count++))
            real_drift_resources+=("$address")
            echo "⚠️  Real drift detected: $address ($type - $action)"
        fi
    done <<< "$resource_changes"

    # Summary
    echo ""
    echo "## Drift Analysis Summary"
    echo "------------------------"
    echo "Real drift resources: $real_drift_count"
    echo "Lambda hash-only changes (ignored): $lambda_hash_only_count"
    echo ""

    if [[ $real_drift_count -gt 0 ]]; then
        echo "### Resources with real drift:"
        for resource in "${real_drift_resources[@]}"; do
            echo "  - $resource"
        done
        return 1  # Exit with error if real drift exists
    else
        echo "✅ No real drift detected (Lambda source_code_hash changes were ignored)"
        return 0
    fi
}

# Main function
main() {
    local plan_file="${1:-}"

    if [[ -z "$plan_file" ]]; then
        echo "Usage: $0 <terraform-plan-json-file>"
        echo "Example: terraform show -json tfplan > plan.json && $0 plan.json"
        exit 1
    fi

    if [[ ! -f "$plan_file" ]]; then
        echo "Error: Plan file '$plan_file' not found"
        exit 1
    fi

    echo "Analyzing Terraform plan for real drift..."
    echo ""

    analyze_drift "$(cat "$plan_file")"
}

# Run main function
main "$@"
