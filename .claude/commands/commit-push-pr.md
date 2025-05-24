# Commit, Push, and Create PR

This command commits all changes, pushes to the current branch, and creates a pull request to the dev branch.

## Steps to Execute

Execute these commands in order:

1. **Check current branch and status**
   ```bash
   git branch --show-current
   git status
   ```

2. **Stage all changes**
   ```bash
   git add -A
   ```

3. **Create commit with descriptive message**
   - Analyze the changes to determine commit type
   - Use conventional commit format: `type(scope): description`
   - Add Claude signature to commit message
   - Pre-commit hooks will run automatically and may:
     - Fix whitespace issues
     - Fix end-of-file issues
     - Run linters and formatters
     - Potentially block the commit if there are errors
   - If pre-commit hooks make changes:
     - Stage the fixes with `git add -A`
     - Retry the commit
   - If pre-commit hooks fail with errors:
     - Provide a summary of the errors
     - Stop and ask for guidance

4. **Push to origin**
   ```bash
   git push -u origin [current-branch]
   ```

5. **Check for existing PR and create if needed**
   - First check if a PR already exists for this branch
   ```bash
   gh pr list --head [current-branch] --base dev --state open
   ```
   - If no PR exists, create one:
   ```bash
   gh pr create --base dev --title "[commit-message]" --body "[pr-description]"
   ```
   - If PR already exists, display its URL

## Usage

To use this command, type:

```
/commit-push-pr
```

Claude will:
- Verify you're not on main or dev branch
- Stage all changes (both tracked and untracked)
- Analyze changes to create an appropriate commit message
- Push the branch to origin
- Check if a PR already exists for this branch
- Create a PR to dev if one doesn't exist, or show the existing PR URL
- Provide the PR URL for review

## Prerequisites

- Must not be on main or dev branch
- Must have changes to commit
- GitHub CLI (gh) must be configured
- Must have push access to the repository

## Example Flow

```bash
# 1. Check we're on a feature branch
$ git branch --show-current
feature/improve-github-actions

# 2. Stage all changes
$ git add -A

# 3. Commit with descriptive message
$ git commit -m "ci(github-actions): Improve deployment workflow with caching and error handling

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"

# 4. Push to origin
$ git push -u origin feature/improve-github-actions

# 5. Check for existing PR
$ gh pr list --head feature/improve-github-actions --base dev --state open
# If no PR exists, create one:
$ gh pr create --base dev --title "ci(github-actions): Improve deployment workflow" --body "..."
```

## Notes

- Always targets the `dev` branch for PRs
- Won't create duplicate PRs if one already exists
- Uses conventional commit format for consistency
- Includes Claude attribution in commits
- Opens the PR in browser after creation (if newly created)

## Pre-commit Hook Behavior

This repository has pre-commit hooks that run automatically on every commit. Common hooks include:

- **trailing-whitespace**: Removes trailing whitespace from files
- **end-of-file-fixer**: Ensures files end with a newline
- **check-yaml**: Validates YAML file syntax
- **check-merge-conflicts**: Prevents committing merge conflict markers
- **pyupgrade**: Updates Python code to newer syntax
- **black**: Formats Python code
- **flake8**: Lints Python code
- **terraform fmt**: Formats Terraform files
- **ESLint**: Lints JavaScript/TypeScript code
- **TypeScript**: Type-checks TypeScript code

If hooks make automatic fixes (like whitespace), the commit will fail the first time. Claude will automatically stage the fixes and retry the commit. If hooks fail with errors that can't be auto-fixed, Claude will provide a summary and ask for guidance.
