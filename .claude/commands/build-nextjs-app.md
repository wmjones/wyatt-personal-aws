# Build Next.js App Command

Build the Next.js app and handle any build issues automatically.

## Usage

This command will:
1. Navigate to the Next.js app directory
2. Install dependencies if needed
3. Build the application
4. Handle any build errors by creating TaskMaster tasks
5. Provide next steps

## Implementation

Use the Bash tool to execute these steps sequentially:

1. **Set up environment**:
   ```bash
   NEXTJS_APP_DIR="/workspaces/wyatt-personal-aws/src/frontend/nextjs-app"
   cd "$NEXTJS_APP_DIR"
   ```

2. **Build the application**:
   ```bash
   npm run build
   ```

3. **Handle results**:
   - Success: Provide development server instructions
   - Failure: Create TaskMaster task with error analysis

## Error Handling

Create TaskMaster tasks for build failures based on error type:
- React/JS/TS errors → Frontend Developer persona
- CSS/Tailwind errors → UI Designer persona
- Dependencies/config → DevOps Engineer persona
- Next.js config → Full Stack Developer persona
