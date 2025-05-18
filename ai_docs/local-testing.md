# Testing the React Application Locally

This guide explains how to test and view the React application locally before deploying it to AWS.

## Prerequisites

- Node.js and npm installed
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Access to project files

## Option 1: Using React Development Server

The React application comes with a development server that provides hot reloading capabilities.

1. Open a terminal and navigate to the React app directory:

```bash
cd /workspaces/wyatt-personal-aws/src/frontend/react-app
```

2. Install dependencies (if not already installed):

```bash
npm install
```

3. Start the development server:

```bash
npm start
```

4. Your browser will automatically open and navigate to:

```
http://localhost:3000
```

5. The website should now be visible in your browser. Any changes you make to the source code will automatically reload the page.

6. To stop the server, press `Ctrl+C` in your terminal.

## Option 2: Building and Serving Production Build

If you want to test the production build locally:

1. Navigate to the React app directory:

```bash
cd /workspaces/wyatt-personal-aws/src/frontend/react-app
```

2. Build the application:

```bash
npm run build
```

3. Install a simple HTTP server if not already installed:

```bash
npm install -g serve
```

4. Serve the build directory:

```bash
serve -s build
```

5. Open your browser and navigate to the URL provided by the serve command (usually http://localhost:5000).

## Option 3: Using the local-server.sh Script

For convenience, we've included a script that will start the React development server:

```bash
bash scripts/local-server.sh
```

## Testing Tips

1. **Test on Different Browsers**: Ensure your website looks good in Chrome, Firefox, Safari, and Edge.

2. **Test Responsive Design**: Resize your browser window to simulate different screen sizes, or use your browser's developer tools to simulate mobile devices.

3. **Check Error Pages**: Test error handling by triggering various error conditions in your application.

4. **Test Authentication**: If using Cognito authentication, test the sign-up, sign-in, and sign-out flows.

5. **Test API Integration**: Verify that API calls to backend services are working correctly.

6. **Check Console for Errors**: Keep your browser's developer console open to catch any JavaScript errors or warnings.

## Deploying Changes

After you've tested your changes locally and are satisfied with them, you can deploy to AWS using the CI/CD pipeline:

1. Commit your changes to the React app directory.
2. Push to the `dev` or `main` branch to trigger the automated deployment:

```bash
git add src/frontend/react-app/
git commit -m "Update React app code"
git push origin dev  # or main for production
```

Alternatively, you can manually deploy using the script provided:

```bash
bash scripts/ci/deploy_react_app.sh dev  # or prod for production
```

## Troubleshooting

- **CORS Issues**: If your API calls encounter CORS issues, make sure the API Gateway has CORS configured correctly for your local development environment.

- **Authentication Problems**: For Cognito authentication issues, verify that the user pool and app client are configured correctly in your local environment variables.

- **API Gateway URLs**: Ensure that your environment configuration points to the correct API Gateway URL for your environment (dev, prod).

- **Build Errors**: If you encounter build errors, check the console output for specific error messages. Common issues include missing dependencies or syntax errors.

- **Router Issues**: If you're using React Router and encounter issues with page navigation, make sure your routes are configured correctly and that your CloudFront distribution is set up to handle SPA routing.
