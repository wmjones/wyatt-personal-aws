You will build the Next.js app locally and handle any build issues.

Follow these steps:
1. Define the Next.js app directory path:
   ```
   NEXTJS_APP_DIR="/workspaces/wyatt-personal-aws/src/frontend/nextjs-app"
   ```

2. Check if the directory exists:
   ```
   if [ ! -d "$NEXTJS_APP_DIR" ]; then
     echo "Error: Next.js app directory not found at $NEXTJS_APP_DIR"
     exit 1
   fi
   ```

3. Change to the Next.js app directory:
   ```
   cd "$NEXTJS_APP_DIR"
   ```

4. Install dependencies if needed:
   ```
   if [ ! -d "node_modules" ] || [ "$1" == "--force-install" ]; then
     echo "Installing dependencies..."
     npm install
   fi
   ```

5. Build the Next.js app and capture the output/error:
   ```
   npm run build > build_log.txt 2>&1
   BUILD_STATUS=$?
   ```

6. Check if the build was successful:
   - If BUILD_STATUS is 0 (success):
     - Display a success message
     - Print the development server command:
       ```
       echo "Build successful! Run the following command to start the development server:"
       echo "cd $NEXTJS_APP_DIR && npm run dev"
       ```

   - If BUILD_STATUS is not 0 (failure):
     - Read the build_log.txt file to identify the error
     - Determine the appropriate developer persona based on the error type:
       - If errors are related to React/JS/TS code: Frontend Developer
       - If errors are related to styling/CSS/Tailwind: UI Designer
       - If errors are related to dependencies/build config: DevOps Engineer
       - If errors are related to Next.js configuration: Full Stack Developer
     - Create a TaskMaster task to fix the issue:
       - Title: "Fix Next.js App Build Errors"
       - Description: Include the error message and initial analysis
       - Priority: "high"
       - Include a note about which persona to assume when researching the issue

7. Return to the original directory:
   ```
   cd - > /dev/null
   ```

8. Summarize the action taken (successful build or task creation)
