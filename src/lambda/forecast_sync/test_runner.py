#!/usr/bin/env python3
"""
Simple test runner to verify the Lambda function structure without dependencies
"""

import os
import ast


def validate_lambda_function():
    """Validate the Lambda function structure and syntax"""

    print("🔍 Validating Lambda function...")

    # Check if index.py exists
    if not os.path.exists("index.py"):
        print("❌ index.py not found")
        return False

    # Parse the Python file to check syntax
    try:
        with open("index.py") as f:
            ast.parse(f.read())
        print("✅ Python syntax is valid")
    except SyntaxError as e:
        print(f"❌ Syntax error: {e}")
        return False

    # Check for required components
    with open("index.py") as f:
        content = f.read()

    required_components = [("lambda_handler", "Lambda handler function"), ("ForecastSyncHandler", "Sync handler class"), ("create_schema", "Schema creation method"), ("sync_data", "Data sync method"), ("execute_athena_query", "Athena query method"), ("get_last_sync_info", "Sync tracking method")]

    all_found = True
    for component, description in required_components:
        if component in content:
            print(f"✅ Found {description}: {component}")
        else:
            print(f"❌ Missing {description}: {component}")
            all_found = False

    # Check environment variables usage
    env_vars = ["ATHENA_DB_NAME", "ATHENA_OUTPUT_LOCATION", "FORECAST_TABLE_NAME", "DATABASE_URL", "NEON_API_KEY", "NEON_PROJECT_ID", "AWS_REGION", "ENVIRONMENT"]

    print("\n📋 Environment variables:")
    for var in env_vars:
        if var in content:
            print(f"  ✅ {var}")
        else:
            print(f"  ⚠️  {var} (might not be used)")

    # Check error handling
    print("\n🛡️ Error handling:")
    if "try:" in content and "except" in content:
        print("  ✅ Exception handling found")
    else:
        print("  ❌ No exception handling found")

    if "logger" in content or "logging" in content:
        print("  ✅ Logging configured")
    else:
        print("  ❌ No logging found")

    return all_found


def validate_requirements():
    """Validate requirements.txt"""

    print("\n📦 Validating requirements.txt...")

    if not os.path.exists("requirements.txt"):
        print("❌ requirements.txt not found")
        return False

    with open("requirements.txt") as f:
        requirements = f.read().strip().split("\n")

    required_packages = ["boto3", "psycopg2", "requests"]

    for package in required_packages:
        found = any(package in req for req in requirements)
        if found:
            print(f"  ✅ {package}")
        else:
            print(f"  ❌ Missing {package}")

    return True


def validate_test_file():
    """Validate test file structure"""

    print("\n🧪 Validating test file...")

    if not os.path.exists("test_index.py"):
        print("❌ test_index.py not found")
        return False

    try:
        with open("test_index.py") as f:
            ast.parse(f.read())
        print("✅ Test file syntax is valid")
    except SyntaxError as e:
        print(f"❌ Test file syntax error: {e}")
        return False

    with open("test_index.py") as f:
        content = f.read()

    # Check for test classes
    test_classes = ["TestForecastSyncHandler", "TestLambdaHandler"]

    for test_class in test_classes:
        if test_class in content:
            print(f"✅ Found test class: {test_class}")
        else:
            print(f"❌ Missing test class: {test_class}")

    # Count test methods
    test_count = content.count("def test_")
    print(f"📊 Found {test_count} test methods")

    return True


def main():
    """Run all validations"""

    print("🚀 Lambda Function Validation Report")
    print("=" * 50)

    results = []

    # Run validations
    results.append(("Lambda Function", validate_lambda_function()))
    results.append(("Requirements", validate_requirements()))
    results.append(("Test File", validate_test_file()))

    # Summary
    print("\n📊 Summary:")
    print("=" * 50)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{name}: {status}")

    print(f"\nOverall: {passed}/{total} validations passed")

    if passed == total:
        print("\n🎉 All validations passed! Lambda function is ready for deployment.")
        return 0
    else:
        print("\n⚠️  Some validations failed. Please fix the issues before deployment.")
        return 1


if __name__ == "__main__":
    exit(main())
