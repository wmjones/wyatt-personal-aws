# Development Container for wyatt-personal-aws

This directory contains configuration for the VS Code Development Container used in the wyatt-personal-aws project. The DevContainer provides a consistent, isolated development environment with all necessary tools pre-installed.

## Features

The development container includes:

- Terraform CLI (v1.8.4)
- terraform-docs (v0.20.0) for generating module documentation
- Node.js 20 (LTS) with npm and npx
- Python 3 with pip and pre-commit
- Trivy security scanner (latest version) for vulnerability scanning
- GitHub CLI for Git and GitHub interactions
- Claude Code CLI
- MCP servers for enhanced AI assistance

## MCP Servers

The container comes with three pre-configured Model Context Protocol (MCP) servers:

1. **File System MCP Server**
   - Provides Claude Code with access to the project's files
   - Automatically maps to the `/workspace` directory

2. **TaskMaster AI MCP Server**
   - Facilitates project management with AI-powered task tracking
   - Creates, manages, and tracks tasks and subtasks
   - Pre-configured with environment variables for optimal operation

3. **Context7 MCP Server**
   - Provides access to documentation for various libraries and frameworks
   - Enhances Claude Code's knowledge of external dependencies

## Getting Started

To use the DevContainer:

1. Install VS Code and the "Remote - Containers" extension
2. Open the project in VS Code
3. Click on the green icon in the bottom-left corner or use the command palette (F1)
4. Select "Reopen in Container"

## Configuration Details

### DevContainer Configuration (`devcontainer.json`)

The `devcontainer.json` file configures:
- Base container image (Ubuntu 24.04)
- Workspace folder mapping to `/workspace`
- Port forwarding (5173, 8080)
- VS Code extensions
- MCP server configuration
- Persistent volumes for credentials and cache data:
  - `terraform-credentials`: Stores Terraform Cloud authentication tokens
  - `pre-commit-cache`: Stores pre-commit cache to avoid permission issues
  - `claude-code-history`: Persists Claude Code command history
  - `claude-code-cache`: Stores Claude Code cache data
  - `npm-global`: Stores globally installed npm packages

### Dockerfile

The `Dockerfile` installs:
- Required OS packages
- Development tools (Terraform, Node.js, Python)
- Global npm packages for MCP servers
- Pre-commit hooks

## Working with MCP Servers

The MCP servers are automatically started when the container is launched. To interact with them:

1. In VS Code, open the Command Palette (F1)
2. Type "MCP" to see available commands
3. Use "MCP: List Servers" to see the available servers
4. Use "MCP: Connect to Server" to connect to a specific server

## Customization

If you need to customize the environment:

- Edit `devcontainer.json` to change VS Code settings, extensions, or MCP configuration
- Edit `Dockerfile` to modify the container's installed packages or environment variables

## Troubleshooting

If you encounter issues with the MCP servers:

1. Check that the container was built successfully
2. Verify that the workspace folder is mapped correctly
3. Check the terminal for any error messages during container startup
4. Try rebuilding the container with "Dev Containers: Rebuild Container"

### Terraform Authentication Issues

If you encounter Terraform authentication issues:

1. Run `terraform login` in the terminal
2. Follow the prompts to authenticate with Terraform Cloud
3. Your credentials will be stored in the `terraform-credentials` volume and persist between container rebuilds

### Pre-commit Issues

If you encounter permission issues with pre-commit:

1. The container now includes a persistent volume for pre-commit cache to prevent permission problems
2. If you still see errors, you can manually fix permissions with:
   ```bash
   sudo mkdir -p /home/vscode/.cache/pre-commit && sudo chown -R vscode:vscode /home/vscode/.cache
   ```

## Using Trivy Security Scanner

The container comes with Trivy, a comprehensive security scanner for container images, file systems, and git repositories.

### Scanning Configuration Files

To scan Terraform or other IaC files for misconfigurations:

```bash
# Scan a specific configuration file
trivy config /path/to/file.tf

# Scan all configuration files in current directory
trivy fs --security-checks config .
```

### Scanning for Vulnerabilities

```bash
# Scan local filesystem for vulnerabilities
trivy fs .

# Scan a container image
trivy image image-name:tag
```

### Common Issues

If you encounter errors with Trivy commands, make sure to:

1. Use the correct syntax for the specific scanning type
2. Ensure you have sufficient permissions for the files being scanned
3. Update the vulnerability database with `trivy --debug image --download-db-only`

For more details, refer to the [Trivy documentation](https://aquasecurity.github.io/trivy/latest/)
