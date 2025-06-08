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

# Install Git LFS if not already installed
if ! command -v git-lfs &> /dev/null; then
  echo "Installing Git LFS..."
  curl -s https://packagecloud.io/install/repositories/github/git-lfs/script.deb.sh | sudo bash
  sudo apt-get install -y git-lfs

  # Initial Git LFS installation without installing hooks
  # We'll let pre-commit manage the hooks instead
  git lfs install --skip-smudge --skip-repo

  status "Git LFS installed successfully"
else
  status "Git LFS already installed"
fi

# Ensure pre-commit is installed to manage our hooks
if ! command -v pre-commit &> /dev/null; then
  echo "Installing pre-commit..."
  pip install pre-commit
  status "pre-commit installed successfully"
else
  status "pre-commit already installed"
fi

# Install hooks managed by pre-commit
echo "Installing pre-commit hooks..."
pre-commit install --install-hooks
status "pre-commit hooks installed"

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

# First check if Oh My Zsh is installed
if [ ! -d ~/.oh-my-zsh ]; then
  echo "Installing Oh My Zsh..."
  # Install Oh My Zsh non-interactively
  sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
  status "Oh My Zsh installed"
fi

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
if [ -f ~/.zshrc ]; then
  echo "Updating plugins in .zshrc..."

  # First, check if plugins line exists
  if grep -q "^plugins=" ~/.zshrc; then
    # Check if our plugins are already there
    if ! grep -q "zsh-autosuggestions" ~/.zshrc || ! grep -q "zsh-syntax-highlighting" ~/.zshrc; then
      # Backup the original .zshrc
      cp ~/.zshrc ~/.zshrc.backup

      # Use a more robust sed command to update the plugins line
      # This handles various formats like plugins=(git) or plugins=(git docker) etc.
      sed -i '/^plugins=/s/)$/ zsh-autosuggestions zsh-syntax-highlighting)/' ~/.zshrc
      sed -i 's/zsh-autosuggestions zsh-autosuggestions/zsh-autosuggestions/g' ~/.zshrc
      sed -i 's/zsh-syntax-highlighting zsh-syntax-highlighting/zsh-syntax-highlighting/g' ~/.zshrc

      status "Updated plugins in .zshrc"
    else
      status "ZSH plugins already configured in .zshrc"
    fi
  else
    # If no plugins line exists, add it after the ZSH theme line
    echo "" >> ~/.zshrc
    echo "# Which plugins would you like to load?" >> ~/.zshrc
    echo "plugins=(git zsh-autosuggestions zsh-syntax-highlighting)" >> ~/.zshrc
    status "Added plugins configuration to .zshrc"
  fi
else
  warning "No .zshrc file found, skipping plugin configuration"
fi

# Stackframe initialization removed

# Check if Node.js 22+ is installed
echo "Checking Node.js version..."
node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$node_version" -lt 22 ]; then
  error_exit "Node.js version $node_version is too old. Need 22 or higher."
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

# Configure enhanced aliases and zsh settings
echo "Configuring enhanced zsh aliases and settings..."
cat >> ~/.zshrc << 'EOF'

# Performance optimizations
export DISABLE_AUTO_UPDATE="true"
export ZSH_AUTOSUGGEST_MANUAL_REBIND="true"
export ZSH_AUTOSUGGEST_BUFFER_MAX_SIZE="20"
export ZSH_AUTOSUGGEST_USE_ASYNC="true"

# Claude Code aliases
alias cc="claude-code"
alias cca="claude-code agent"
alias ccm="claude-code memory"

# Task Master integration
alias tm="npx taskmaster"
alias tms="npx taskmaster status"
alias tmn="npx taskmaster next"
alias tma="npx taskmaster add"

# Quick navigation
alias cdfr="cd /workspaces/wyatt-personal-aws-2/src/frontend/nextjs-app"
alias cdtf="cd /workspaces/wyatt-personal-aws-2/main"
alias cdroot="cd /workspaces/wyatt-personal-aws-2"

# Git shortcuts
alias g="git"
alias gs="git status"
alias gp="git pull"
alias gpu="git push"
alias gco="git checkout"
alias gcm="git commit -m"
alias gd="git diff"
alias gl="git log --oneline -10"

# AWS/Terraform shortcuts
alias tf="terraform"
alias tfa="terraform apply"
alias tfp="terraform plan"
alias tfw="terraform workspace"
alias tfi="terraform init"
alias tfd="terraform destroy"

# Docker shortcuts
alias dc="docker compose"
alias dcu="docker compose up"
alias dcd="docker compose down"
alias dcl="docker compose logs"

# Development shortcuts
alias ni="npm install"
alias nr="npm run"
alias nrd="npm run dev"
alias nrb="npm run build"
alias nrt="npm run test"

# Enhanced history settings
HISTSIZE=10000
SAVEHIST=10000
setopt SHARE_HISTORY
setopt HIST_EXPIRE_DUPS_FIRST
setopt HIST_IGNORE_DUPS
setopt HIST_VERIFY
setopt APPEND_HISTORY
setopt INC_APPEND_HISTORY

# Better completion settings
zstyle ':completion:*' use-cache on
zstyle ':completion:*' cache-path ~/.zsh/cache
zstyle ':completion:*' matcher-list 'm:{a-z}={A-Za-z}'
zstyle ':completion:*' menu select
zstyle ':completion:*' list-colors "${(s.:.)LS_COLORS}"

# Directory navigation
setopt AUTO_CD
setopt AUTO_PUSHD
setopt PUSHD_IGNORE_DUPS
setopt PUSHD_SILENT

# Productivity settings
setopt CORRECT
setopt INTERACTIVE_COMMENTS

# Auto-load environment variables from .env file
if [ -f /workspaces/wyatt-personal-aws-2/.env ]; then
  set -a  # automatically export all variables
  source /workspaces/wyatt-personal-aws-2/.env
  set +a  # disable automatic export
fi

# Function to reload env vars on demand
reload-env() {
  if [ -f /workspaces/wyatt-personal-aws-2/.env ]; then
    echo "Reloading environment variables from .env..."
    set -a  # automatically export all variables
    source /workspaces/wyatt-personal-aws-2/.env
    set +a  # disable automatic export
    echo "✅ Environment variables reloaded"
  else
    echo "⚠️ No .env file found at /workspaces/wyatt-personal-aws-2/.env"
  fi
}
EOF

status "Enhanced zsh configuration added"

# Install Neon MCP server
echo "Installing Neon MCP server..."
npm install -g @neondatabase/mcp-server-neon || warning "Failed to install Neon MCP server"
status "Neon MCP server installed"

# Load environment variables for the current session
if [ -f /workspaces/wyatt-personal-aws-2/.env ]; then
  echo "Loading environment variables..."
  set -a  # automatically export all variables
  source /workspaces/wyatt-personal-aws-2/.env
  set +a  # disable automatic export
  status "Environment variables loaded"
fi

status "Post-create setup completed!"
