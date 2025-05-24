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

4. **Push to origin**
   ```bash
   git push -u origin [current-branch]
   ```

5. **Create pull request to dev**
   ```bash
   gh pr create --base dev --title "[commit-message]" --body "[pr-description]"
   ```

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
- Create a PR to dev with a descriptive title and body
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

# 5. Create PR
$ gh pr create --base dev --title "ci(github-actions): Improve deployment workflow" --body "..."
```

## Notes

- Always creates PRs targeting the `dev` branch
- Uses conventional commit format for consistency
- Includes Claude attribution in commits
- Opens the PR in browser after creation
