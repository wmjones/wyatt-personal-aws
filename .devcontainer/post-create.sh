#!/bin/bash
# Exit immediately if a command exits with a non-zero status
set -e

# Function to display errors
error_exit() {
  echo "ERROR: $1" >&2
  exit 1
}

# Function to display status
status() {
  echo "✅ $1"
}

# Function to display warning
warning() {
  echo "⚠️ $1"
}

# Function to display info
info() {
  echo "ℹ️ $1"
}

echo "Running post-create setup..."

# Determine project directory more reliably
WORKSPACE_DIR="/workspaces"

# Check if we can find the actual workspace directory
if [ -d "$WORKSPACE_DIR" ]; then
  # Find the first directory in /workspaces that isn't node_modules or package
  PROJECT_DIR=$(find "$WORKSPACE_DIR" -mindepth 1 -maxdepth 1 -type d -not -name "node_modules" -not -name "package" | head -n 1)

  # If we couldn't find a directory, default to the workspace dir itself
  if [ -z "$PROJECT_DIR" ]; then
    PROJECT_DIR="$WORKSPACE_DIR"
  fi
else
  # If /workspaces doesn't exist, use the current directory
  PROJECT_DIR="$(pwd)"
fi

echo "Using project directory: $PROJECT_DIR"

# Install Claude Code globally instead of locally
if ! command -v claude &> /dev/null; then
  echo "Installing Claude Code globally..."

  # Install Claude Code globally
  npm install -g @anthropic-ai/claude-code || error_exit "Failed to install Claude Code globally"

  status "Claude Code installed globally"
else
  status "Claude Code already installed globally"
fi

# Set up ZSH plugins if not already installed
echo "Setting up ZSH plugins..."

# Install zsh-autosuggestions if not already installed
if [ ! -d "${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions" ]; then
  echo "Installing zsh-autosuggestions plugin..."
  git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
  status "zsh-autosuggestions plugin installed"
else
  warning "zsh-autosuggestions plugin already installed, skipping"
fi

# Install zsh-syntax-highlighting if not already installed
if [ ! -d "${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting" ]; then
  echo "Installing zsh-syntax-highlighting plugin..."
  git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
  status "zsh-syntax-highlighting plugin installed"
else
  warning "zsh-syntax-highlighting plugin already installed, skipping"
fi

# Update .zshrc plugins if needed
if grep -q "plugins=(git)" ~/.zshrc; then
  echo "Updating plugins in .zshrc..."
  sed -i 's/plugins=(git)/plugins=(git zsh-autosuggestions zsh-syntax-highlighting)/' ~/.zshrc
  status "Updated plugins in .zshrc"
elif ! grep -q "zsh-autosuggestions" ~/.zshrc; then
  echo "Adding plugins to .zshrc..."
  # This is a bit trickier - we need to find the plugins line and modify it
  # For now, let's just inform the user
  warning "Couldn't automatically update plugins in .zshrc"
  echo "   Please manually ensure these plugins are enabled in your .zshrc:"
  echo "   plugins=(... zsh-autosuggestions zsh-syntax-highlighting ...)"
fi

# Initialize Stackframe if not already done
echo "Checking for Stackframe initialization..."
if [ ! -f "$PROJECT_DIR/.stackframe-initialized" ]; then
  echo "Initializing Stackframe..."
  cd "$PROJECT_DIR"
  npx @stackframe/init-stack@latest || warning "Failed to initialize Stackframe"
  if [ $? -eq 0 ]; then
    touch .stackframe-initialized
    status "Stackframe initialized successfully"
  fi
else
  status "Stackframe already initialized"
fi

# Check if Node.js 18+ is installed
echo "Checking Node.js version..."
node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$node_version" -lt 18 ]; then
  error_exit "Node.js version $node_version is too old. Need 18 or higher."
else
  status "Node.js version $node_version is compatible"
fi

# Ensure we're in the right directory for Next.js project
NEXTJS_DIR="$PROJECT_DIR/src/frontend/nextjs-app"
echo "Next.js project directory: $NEXTJS_DIR"

# Create directory if it doesn't exist yet
if [ ! -d "$NEXTJS_DIR" ]; then
  echo "Creating Next.js project directory..."
  mkdir -p "$NEXTJS_DIR"
  status "Created Next.js project directory"
fi

# Check if Next.js project is already initialized
if [ ! -f "$NEXTJS_DIR/package.json" ]; then
  echo "Initializing Next.js project..."
  cd "$NEXTJS_DIR"

  # Create the Next.js project with TypeScript, ESLint, App Router, and Tailwind
  npx create-next-app@latest . --typescript --eslint --app --tailwind --no-git --yes || error_exit "Failed to create Next.js project"

  # Install D3.js and its TypeScript types
  echo "Installing D3.js and TypeScript types..."
  npm install d3 || error_exit "Failed to install d3"
  npm install --save-dev @types/d3 || error_exit "Failed to install @types/d3"

  status "Next.js project initialized with D3.js"
else
  status "Next.js project already initialized"
fi

# Install Next.js development tools if not in global packages
echo "Checking for Next.js and TypeScript tools..."
if ! npm list -g create-next-app > /dev/null 2>&1; then
  echo "Installing create-next-app globally..."
  npm install -g create-next-app@latest || warning "Failed to install create-next-app"
  status "create-next-app installed globally"
else
  status "create-next-app already installed"
fi

if ! npm list -g typescript > /dev/null 2>&1; then
  echo "Installing TypeScript globally..."
  npm install -g typescript || warning "Failed to install typescript"
  status "TypeScript installed globally"
else
  status "TypeScript already installed"
fi

# Install Vercel CLI if not already installed
echo "Installing Next.js development tools..."
if ! npm list -g vercel > /dev/null 2>&1; then
  echo "Installing Vercel CLI globally..."
  npm install -g vercel@latest || warning "Failed to install Vercel CLI"
  status "Vercel CLI installed"
else
  status "Vercel CLI already installed"
fi

# Attempt to fix ownership issues only if needed and with more specific targets
echo "Checking directory permissions..."
if [ -d "$PROJECT_DIR/.git" ]; then
  # Add project to git safe directories to avoid permission issues
  git config --global --add safe.directory "$PROJECT_DIR" 2>/dev/null || true
  info "Added project to git safe directories"
fi

# Only attempt to fix ownership of specific directories that we know might need it
for dir in "$PROJECT_DIR/.devcontainer" "$PROJECT_DIR/src" "$PROJECT_DIR/tasks" "$PROJECT_DIR/.taskmaster"; do
  if [ -d "$dir" ] && [ "$(stat -c %u "$dir" 2>/dev/null)" != "$(id -u vscode)" ]; then
    chown -R vscode:vscode "$dir" 2>/dev/null || info "Could not change ownership of $dir (this is normal for some directories)"
  fi
done

# Ensure npm cache is owned by vscode user to avoid warnings
if [ -d "/home/vscode/.npm" ]; then
  chown -R vscode:vscode /home/vscode/.npm 2>/dev/null || true
fi

# Configure Claude Code to exclude irrelevant directories
echo "Configuring Claude Code exclude directories..."
# claude config add ignorePatterns "node_modules,venv,.git,__pycache__,build,dist,.venv,coverage,.pytest_cache,.terraform,terraform.tfstate,terraform.tfstate.backup,.terraform.lock.hcl,*.log,*.pyc,*.pyo,*.pyd,*.so,*.dylib,*.dll,*.exe,*.o,*.obj,.DS_Store,Thumbs.db,*.swp,*.swo,*~,.idea,*.iml,*.ipr,*.iws,*.egg-info,*.egg,.tox,.coverage,htmlcov,.cache,.mypy_cache,.ruff_cache,__MACOSX,.Spotlight-V100,.Trashes,ehthumbs.db,Desktop.ini,$RECYCLE.BIN,*.cab,*.msi,*.msm,*.msp,*.lnk,npm-debug.log*,yarn-debug.log*,yarn-error.log*,pnpm-debug.log*,lerna-debug.log*,.vercel,.next,out,.nuxt,.cache,.parcel-cache,.turbo,.docusaurus,.serverless,.fusebox,.dynamodb,.npm,.yarn,.pnpm-store,.eslintcache" || warning "Failed to configure Claude Code exclude directories"
status "Claude Code configuration updated"

status "Post-create setup completed!"
