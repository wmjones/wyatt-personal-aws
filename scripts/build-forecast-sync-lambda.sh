#!/bin/bash
set -e

# Build script for forecast sync lambda
echo "Building forecast sync lambda package..."

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Set paths
LAMBDA_DIR="$PROJECT_ROOT/src/lambda/forecast_sync"
BUILD_DIR="$PROJECT_ROOT/build/forecast_sync_lambda"
OUTPUT_FILE="$PROJECT_ROOT/main/forecast-sync-lambda.zip"

# Clean and create build directory
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Copy Python files
cp "$LAMBDA_DIR"/*.py "$BUILD_DIR/"

# Install dependencies if requirements.txt exists
if [ -f "$LAMBDA_DIR/requirements.txt" ]; then
    echo "Installing dependencies..."
    pip install -r "$LAMBDA_DIR/requirements.txt" -t "$BUILD_DIR/" --no-cache-dir --upgrade
fi

# Create zip file using Python
cd "$BUILD_DIR"
python3 -c "
import zipfile
import os
import glob

def create_zip(zip_path, source_dir):
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            # Skip __pycache__ directories
            dirs[:] = [d for d in dirs if d != '__pycache__']
            for file in files:
                # Skip .pyc files and .dist-info directories
                if file.endswith('.pyc') or '.dist-info' in root:
                    continue
                file_path = os.path.join(root, file)
                arc_name = os.path.relpath(file_path, source_dir)
                zipf.write(file_path, arc_name)

create_zip('$OUTPUT_FILE', '.')
"

echo "Lambda package created at: $OUTPUT_FILE"

# Clean up
rm -rf "$BUILD_DIR"
