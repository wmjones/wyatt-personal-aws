# Custom Claude Code Commands

This directory contains custom slash commands for Claude Code to use in this project.

## Available Commands

### /project:next-task [branch-name]

Gets the next task from TaskMaster, creates a new branch for it, and checks it out.

**Usage:**
- `/project:next-task` - Gets the next available task from TaskMaster, creates a branch based on the task ID and title, and checks it out.
- `/project:next-task custom-branch-name` - Creates and checks out a new branch with the specified name, without getting a task from TaskMaster.

**Example:**
```
/project:next-task
```
This would get the next task, create a branch like `task/42-implement-feature`, and check it out.

```
/project:next-task fix/authentication-error
```
This would create and check out the branch `fix/authentication-error` without querying TaskMaster.

### /project:run-pre-commit

Runs pre-commit checks and either creates a task for fixing issues or creates a commit with all changes.

**Usage:**
- `/project:run-pre-commit` - Runs pre-commit checks, analyzes the results, and takes appropriate action.

**Example:**
```
/project:run-pre-commit
```
This runs pre-commit checks twice (once with output displayed, once logging to a file). If errors are found, it creates a TaskMaster task to fix them. If no errors are found, it commits all changes.

### /project:build-nextjs-app

Builds the Next.js app locally and either displays the local server command or creates a task for fixing build issues.

**Usage:**
- `/project:build-nextjs-app` - Builds the Next.js app and takes appropriate action based on the result.

**Example:**
```
/project:build-nextjs-app
```
This builds the Next.js app and:
- If successful: Displays the command to start the local development server
- If failed: Creates a TaskMaster task to research and fix the build issue, assuming the appropriate developer persona based on the error type

### /context

Loads comprehensive project documentation into Claude's context for better understanding of the project architecture and requirements.

**Usage:**
- `/context` - Loads CLAUDE.md and all ai_docs/* files into context

**Example:**
```
/context
```
This loads all project documentation including:
- Main project instructions (CLAUDE.md)
- Architecture overview and technical specifications
- D3 Dashboard implementation details
- Productivity system workflow
- Terraform infrastructure modules
- Environment configurations
- Design requirements and color palette

After loading, Claude will have full understanding of the hybrid architecture (Next.js on Vercel + AWS backend) and all project specifications.
