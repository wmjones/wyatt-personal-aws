# Makefile for testing SSM scripts

.PHONY: test-ssm test-ssm-local test-ssm-unit test-ssm-dry-run test-deploy help

# Default target
help:
	@echo "Available targets:"
	@echo "  make test-ssm          - Run all SSM tests"
	@echo "  make test-ssm-local    - Test SSM script locally with mocks"
	@echo "  make test-ssm-unit     - Run unit tests for SSM script"
	@echo "  make test-ssm-dry-run  - Test SSM sync in dry-run mode"
	@echo "  make test-deploy       - Test deployment script in dry-run mode"

# Run all SSM tests
test-ssm: test-ssm-unit test-ssm-local test-ssm-dry-run
	@echo "✅ All SSM tests completed"

# Test SSM script locally
test-ssm-local:
	@echo "🔬 Testing SSM script locally..."
	@./scripts/test-ssm-locally.sh

# Run unit tests
test-ssm-unit:
	@echo "🧪 Running unit tests..."
	@./scripts/test-ssm-unit.sh

# Test SSM sync in dry-run mode
test-ssm-dry-run:
	@echo "🔄 Testing SSM sync (dry-run)..."
	@cd main && terraform workspace select dev || terraform workspace new dev
	@./scripts/sync-terraform-outputs-to-ssm.sh --dry-run

# Test deployment script in dry-run mode
test-deploy:
	@echo "🚀 Testing deployment script (dry-run)..."
	@./scripts/deploy-frontend.sh --env dev --dry-run

# Test with specific workspace
test-workspace-%:
	@echo "Testing with workspace: $*"
	@cd main && terraform workspace select $* || terraform workspace new $*
	@./scripts/sync-terraform-outputs-to-ssm.sh --dry-run --workspace $*

# Clean up test artifacts
clean:
	@echo "🧹 Cleaning up test artifacts..."
	@rm -rf test-terraform
	@rm -f scripts/test-sync.sh
