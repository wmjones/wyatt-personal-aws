You will help me get the next task from TaskMaster, create a new branch for it, and check it out.

First, check the current branch status:
1. Run `git branch --show-current` to get the current branch name.
2. Run `git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || echo "no_upstream"` to check if the branch has an upstream.
3. Run `git log --oneline HEAD ^origin/dev 2>/dev/null | wc -l` to count commits ahead of origin/dev.
4. If all of the following are true:
   - Current branch is not 'dev' or 'main'
   - Branch either has no upstream ("no_upstream") or no commits have been pushed yet
   - The command arguments ("$ARGUMENTS") are empty
   Then stay on the current branch and report: "Already on a working branch that hasn't been pushed yet."

Otherwise, proceed with one of these approaches:

If "$ARGUMENTS" is empty:
1. Check if the user included pasted content in their message (error logs, guides, etc.):
   a. If YES: Create a new TaskMaster task with `mcp__taskmaster-ai__add_task`:
      - Use a descriptive title that summarizes the content
      - Include the full pasted content in the task description
      - Set priority to "high"
      - After creating the task, extract the ID and create a branch name: `fix/ID-issue-type`
   b. If NO: Get the next task from TaskMaster:
      - Run `mcp__taskmaster-ai__next_task`
      - Extract the task ID and title from the response
      - Create a branch name: `task/ID-title-kebab-case` (convert spaces to hyphens, lowercase)

If "$ARGUMENTS" is non-empty:
1. Use it directly as the branch name

In all cases:
1. Use `git checkout -b [branch-name]` to create and check out the new branch
2. Summarize what you did and show the full task details

Always show the full task details when getting a task from TaskMaster or creating a new task from pasted content.
