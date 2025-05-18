You will build the React app locally and handle any build issues.

Follow these steps:
1. Define the React app directory path:
   ```
   REACT_APP_DIR="/workspaces/wyatt-personal-aws/src/frontend/react-app"
   ```

2. Check if the directory exists:
   ```
   if [ ! -d "$REACT_APP_DIR" ]; then
     echo "Error: React app directory not found at $REACT_APP_DIR"
     exit 1
   fi
   ```

3. Change to the React app directory:
   ```
   cd "$REACT_APP_DIR"
   ```

4. Build the React app and capture the output/error:
   ```
   npm run build > build_log.txt 2>&1
   BUILD_STATUS=$?
   ```

5. Check if the build was successful:
   - If BUILD_STATUS is 0 (success):
     - Display a success message
     - Print the local server command:
       ```
       echo "Build successful! Run the following command to start the local server:"
       echo "bash /workspaces/wyatt-personal-aws/scripts/local-server.sh"
       ```

   - If BUILD_STATUS is not 0 (failure):
     - Read the build_log.txt file to identify the error
     - Determine the appropriate developer persona based on the error type:
       - If errors are related to React/JS/TS code: Frontend Developer
       - If errors are related to styling/CSS: UI Designer
       - If errors are related to dependencies/build config: DevOps Engineer
     - Create a TaskMaster task to fix the issue:
       - Title: "Fix React App Build Errors"
       - Description: Include the error message and initial analysis
       - Priority: "high"
       - Include a note about which persona to assume when researching the issue

6. Return to the original directory:
   ```
   cd - > /dev/null
   ```

7. Summarize the action taken (successful build or task creation)
