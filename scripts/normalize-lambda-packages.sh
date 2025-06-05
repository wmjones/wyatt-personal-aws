#!/bin/bash
# normalize-lambda-packages.sh
# This script normalizes Lambda deployment packages to prevent false drift detection
# when packages are rebuilt without code changes

set -euo pipefail

# Function to normalize a zip file
normalize_zip() {
    local zip_file="$1"
    local temp_dir=$(mktemp -d)

    echo "Normalizing $zip_file..."

    # Extract the zip file
    unzip -q "$zip_file" -d "$temp_dir"

    # Remove the original zip
    rm "$zip_file"

    # Find all files and set their modification time to a fixed date
    # Using 2000-01-01 00:00:00 UTC as the reference timestamp
    find "$temp_dir" -type f -exec touch -t 200001010000.00 {} \;

    # Remove any __pycache__ directories and .pyc files
    find "$temp_dir" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
    find "$temp_dir" -type f -name "*.pyc" -delete 2>/dev/null || true

    # Remove any .DS_Store files (macOS)
    find "$temp_dir" -type f -name ".DS_Store" -delete 2>/dev/null || true

    # Create a new zip with consistent compression settings
    # -X: exclude extra file attributes
    # -D: do not add directory entries
    # -r: recurse into directories
    # -9: maximum compression
    # --no-dir-entries: don't add directory entries
    (cd "$temp_dir" && zip -Xr9D "$zip_file" . --exclude "*.git*" "*.zip" "node_modules/.cache/*")

    # Clean up
    rm -rf "$temp_dir"

    echo "Normalized $zip_file"
}

# Main script
main() {
    local packages=(
        "deployment_package.zip"
        "athena-lambda.zip"
        "forecast-sync-lambda.zip"
    )

    for package in "${packages[@]}"; do
        if [[ -f "$package" ]]; then
            normalize_zip "$package"
        else
            echo "Warning: $package not found, skipping..."
        fi
    done
}

# Run main function
main "$@"
