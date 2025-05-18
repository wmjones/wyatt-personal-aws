import React from 'react';
import { Card } from './ui/card';

interface AuthConfigErrorProps {
  error: string;
  userPoolId?: string;
  clientId?: string;
}

/**
 * Component to display when there's an authentication configuration error
 * This provides a more user-friendly message than the raw error
 */
const AuthConfigError: React.FC<AuthConfigErrorProps> = ({
  error,
  userPoolId,
  clientId
}) => {
  // Check if we're using placeholder values
  const isPlaceholderUserPoolId = userPoolId?.includes('xxxxxxxx');
  const isPlaceholderClientId = clientId?.includes('xxxxxxxxxxxxxxxxxxxxxxxxxx');

  // Determine the likely cause of the error
  let errorTitle = "Authentication Error";
  let errorMessage = "There was a problem with the authentication service.";
  let actionMessage = "Please try again later or contact support.";

  if (isPlaceholderUserPoolId || isPlaceholderClientId) {
    errorTitle = "Development Mode Active";
    errorMessage = "Authentication is using development mode credentials.";
    actionMessage = "This is expected in development environments. Use the demo email and password to login.";
  } else if (error.includes('User pool client')) {
    errorTitle = "User Pool Client Error";
    errorMessage = "The authentication client configuration is invalid.";
    actionMessage = "Please contact the administrator with error code: USER_POOL_CLIENT_ERROR";
  }

  // Choose icon and colors based on error type
  const isDevMode = isPlaceholderUserPoolId || isPlaceholderClientId;
  const iconColorClass = isDevMode ? "bg-blue-100" : "bg-red-100";
  const iconColor = isDevMode ? "text-blue-500" : "text-red-500";

  return (
    <Card className="w-full max-w-md p-6 mx-auto mt-4 bg-white shadow-lg rounded-lg">
      <div className="text-center">
        <div className={`w-16 h-16 ${iconColorClass} rounded-full flex items-center justify-center mx-auto mb-4`}>
          {isDevMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
        </div>

        <h2 className="text-xl font-semibold text-gray-800 mb-2">{errorTitle}</h2>
        <p className="text-gray-600 mb-4">{errorMessage}</p>
        <p className="text-gray-500 text-sm">{actionMessage}</p>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-gray-100 rounded text-left">
            <p className="text-sm font-medium text-gray-700">Developer Information:</p>
            <ul className="mt-2 text-xs text-gray-600 space-y-1">
              <li>- User Pool ID: {userPoolId || 'Not available'}</li>
              <li>- Client ID: {clientId ? `${clientId.substring(0, 5)}...` : 'Not available'}</li>
              <li>- Error: {error}</li>
              <li>- Environment: {process.env.NODE_ENV}</li>
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
};

export default AuthConfigError;
