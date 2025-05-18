import { Amplify } from 'aws-amplify';
import { ResourcesConfig } from 'aws-amplify';
import {
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  signUp as amplifySignUp,
  confirmSignUp as amplifyConfirmSignUp,
  getCurrentUser as amplifyGetCurrentUser,
  // AWS Amplify types are imported but not directly used
  // We use our own interface definitions for better compatibility
} from 'aws-amplify/auth';

/**
 * AWS Amplify v6 type extensions
 *
 * NOTE: The AWS Amplify v6 authentication response structure has changed significantly.
 * In Amplify v6, the CognitoAuthSignInDetails type doesn't have a userAttributes property directly.
 * Instead, attributes are accessed differently in the signInDetails object.
 *
 * This extension creates a predictable interface for accessing user attributes regardless of
 * how the underlying structure might change in Amplify updates.
 *
 * IMPORTANT: If upgrading AWS Amplify, review this code to ensure compatibility.
 */
interface ExtendedSignInDetails {
  /**
   * User attributes such as email, sub (user ID), and custom attributes.
   * In Amplify v6, these might be accessed differently depending on the auth flow.
   */
  userAttributes?: {
    email: string;
    sub: string;
    [key: string]: any;
  };

  /**
   * Allow for other properties that might exist in the signInDetails
   */
  [key: string]: any;
}

// Get configuration from environment variables (set during build)
export const getEnvConfig = (): ResourcesConfig => {
  return {
    Auth: {
      Cognito: {
        userPoolId: process.env.REACT_APP_USER_POOL_ID || 'us-east-1_xxxxxxxx',
        userPoolClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID || 'xxxxxxxxxxxxxxxxxxxxxxxxxx',
        loginWith: {
          email: true
        }
      }
    },
    API: {
      REST: {
        api: {
          endpoint: process.env.REACT_APP_API_ENDPOINT || 'https://api.example.com'
        }
      }
    }
  };
};

// Initialize Amplify with configuration
export const configureAmplify = (providedConfig: Partial<ResourcesConfig> = {}) => {
  // Default configuration from environment variables
  const defaultConfig = getEnvConfig();

  // Check if we have valid Cognito configuration
  const userPoolId = defaultConfig.Auth?.Cognito?.userPoolId || '';
  const userPoolClientId = defaultConfig.Auth?.Cognito?.userPoolClientId || '';

  // Check if we have placeholder values (indicating real values weren't provided)
  const isPlaceholderUserPoolId = userPoolId.includes('xxxxxxxx');
  const isPlaceholderClientId = userPoolClientId.includes('xxxxxxxxxxxxxxxxxxxxxxxxxx');

  // Log configuration info
  console.log('Amplify configuration status:', {
    environment: process.env.NODE_ENV,
    stage: process.env.REACT_APP_STAGE || 'unknown',
    region: process.env.REACT_APP_REGION || 'unknown',
    hasValidUserPoolId: !isPlaceholderUserPoolId,
    hasValidClientId: !isPlaceholderClientId
  });

  // Simple way to merge configs
  Amplify.configure(defaultConfig);

  // Apply any additional provided config
  if (Object.keys(providedConfig).length > 0) {
    Amplify.configure(providedConfig);
  }

  // More detailed logging in development or if using placeholder values
  if (process.env.NODE_ENV === 'development' || isPlaceholderUserPoolId || isPlaceholderClientId) {
    console.log('Amplify configured with:', JSON.stringify({
      userPoolId: defaultConfig.Auth?.Cognito?.userPoolId,
      apiEndpoint: defaultConfig.API?.REST?.api?.endpoint,
    }, null, 2));

    if (isPlaceholderUserPoolId || isPlaceholderClientId) {
      console.info('INFO: Using development mode for authentication.');
      console.info('This is expected in development environments. Use development credentials to log in:');
      console.info('- Email: demo@example.com');
      console.info('- Password: password');
      console.info('');
      console.info('To use real Cognito authentication, ensure the following:');
      console.info('1. Run terraform apply to create Cognito resources');
      console.info('2. Run scripts/store-terraform-outputs.sh to store Cognito parameters in SSM');
      console.info('3. Set the following environment variables:');
      console.info('   - REACT_APP_USER_POOL_ID');
      console.info('   - REACT_APP_USER_POOL_CLIENT_ID');
    }
  }
};

// Export type for AuthState
export enum AuthState {
  SignIn = 'signIn',
  SignUp = 'signUp',
  ConfirmSignUp = 'confirmSignUp',
  ForgotPassword = 'forgotPassword',
  VerifyContact = 'verifyContact',
  SignedIn = 'signedIn',
}

// Define the User interface
export interface User {
  username: string;
  attributes: {
    email: string;
    sub: string;
    [key: string]: any;
  };
}

// Helper function to get current authenticated user
export const getCurrentUser = async (): Promise<User | null> => {
  // Check if we're using placeholder values (development mode)
  const config = getEnvConfig();
  const userPoolId = config.Auth?.Cognito?.userPoolId || '';
  const userPoolClientId = config.Auth?.Cognito?.userPoolClientId || '';

  const isPlaceholderUserPoolId = userPoolId.includes('xxxxxxxx');
  const isPlaceholderClientId = userPoolClientId.includes('xxxxxxxxxxxxxxxxxxxxxxxxxx');

  // Development mode: check local storage for development login state
  if (process.env.NODE_ENV === 'development' || isPlaceholderUserPoolId || isPlaceholderClientId) {
    // Check if we have a development login in localStorage
    const devLoginState = localStorage.getItem('dev-auth-state');
    if (devLoginState === 'logged-in') {
      return {
        username: 'dev-user',
        attributes: {
          email: 'demo@example.com',
          sub: 'dev-user-id',
        },
      };
    }
    return null;
  }

  try {
    // For production, use actual Cognito authentication
    const { username, signInDetails } = await amplifyGetCurrentUser();

    // Extract user attributes safely with type assertions
    const extendedDetails = signInDetails as ExtendedSignInDetails;
    // Safely fallback to username if attributes aren't available
    const attributes = extendedDetails?.userAttributes ||
                      { email: username, sub: (signInDetails as any)?.sub || username || '' };

    return {
      username,
      attributes,
    };
  } catch (error) {
    console.log('No authenticated user found');
    return null;
  }
};

// Sign in helper function
export const signIn = async (
  username: string,
  password: string
): Promise<User> => {
  // For demo in development
  if (process.env.NODE_ENV === 'development') {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock authentication for demo
    if (username === 'demo@example.com' && password === 'password') {
      return {
        username: 'demo-user',
        attributes: {
          email: username,
          sub: '123456789',
        }
      };
    }
    throw new Error('Invalid email or password');
  }

  // Check if we have valid Cognito configuration
  const config = getEnvConfig();
  const userPoolId = config.Auth?.Cognito?.userPoolId || '';
  const userPoolClientId = config.Auth?.Cognito?.userPoolClientId || '';

  const isPlaceholderUserPoolId = userPoolId.includes('xxxxxxxx');
  const isPlaceholderClientId = userPoolClientId.includes('xxxxxxxxxxxxxxxxxxxxxxxxxx');

  // If we're using placeholder values, switch to development mode login
  if (isPlaceholderUserPoolId || isPlaceholderClientId) {
    console.info('Using development mode for authentication');

    // In development mode, allow login with demo credentials
    if (username === 'demo@example.com' && password === 'password') {
      // Store dev login state in localStorage
      localStorage.setItem('dev-auth-state', 'logged-in');

      return {
        username: 'dev-user',
        attributes: {
          email: username,
          sub: 'dev-user-id',
        }
      };
    } else {
      // Provide helpful error message for incorrect demo credentials
      throw new Error('Development mode active. Use demo@example.com / password to login.');
    }
  }

  try {
    // For production use Cognito
    const { isSignedIn, nextStep } = await amplifySignIn({ username, password });

    if (isSignedIn) {
      const { username: user, signInDetails } = await amplifyGetCurrentUser();

      // Extract user attributes safely with type assertions
      const extendedDetails = signInDetails as ExtendedSignInDetails;
      // Safely fallback to username if attributes aren't available
      const attributes = extendedDetails?.userAttributes ||
                        { email: username, sub: (signInDetails as any)?.sub || username || '' };

      return {
        username: user,
        attributes,
      };
    }

    throw new Error(`Could not sign in. Next step: ${nextStep.signInStep}`);
  } catch (error) {
    // Handle specific Cognito error for user pool client not existing
    if (error instanceof Error && error.message.includes('User pool client')) {
      console.error('Authentication failed: User pool client error', error);
      throw new Error('Authentication service configuration error. Please contact support with error code: USER_POOL_CLIENT_ERROR');
    }

    // Re-throw other errors
    throw error;
  }
};

// Sign up helper function
export const signUp = async (
  username: string,
  password: string,
  email: string,
  name?: string
): Promise<{ isSignUpComplete: boolean; nextStep?: string; userSub?: string }> => {
  // Check if we're using placeholder values (development mode)
  const config = getEnvConfig();
  const userPoolId = config.Auth?.Cognito?.userPoolId || '';
  const userPoolClientId = config.Auth?.Cognito?.userPoolClientId || '';

  const isPlaceholderUserPoolId = userPoolId.includes('xxxxxxxx');
  const isPlaceholderClientId = userPoolClientId.includes('xxxxxxxxxxxxxxxxxxxxxxxxxx');

  // If we're using placeholder values, switch to development mode signup
  if (process.env.NODE_ENV === 'development' || isPlaceholderUserPoolId || isPlaceholderClientId) {
    console.info('Using development mode for sign-up');

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In development mode, simulate successful sign-up
    localStorage.setItem('dev-signup-email', email);
    localStorage.setItem('dev-signup-username', username);

    return {
      isSignUpComplete: false,
      nextStep: 'CONFIRM_SIGN_UP',
      userSub: 'dev-user-id'
    };
  }

  try {
    // For production, use Cognito
    // Use the username as the name if not provided
    const displayName = name || username;

    const { isSignUpComplete, userId, nextStep } = await amplifySignUp({
      username,
      password,
      options: {
        userAttributes: {
          email,
          name: displayName
          // Removed 'name.formatted' as it's not in the Cognito schema
        }
      }
    });

    return {
      isSignUpComplete,
      nextStep: nextStep?.signUpStep,
      userSub: userId
    };
  } catch (error) {
    // Handle specific Cognito errors
    if (error instanceof Error) {
      if (error.name === 'UsernameExistsException') {
        throw new Error('This email is already registered. Please sign in instead.');
      }

      if (error.message.includes('User pool client')) {
        console.error('Sign-up failed: User pool client error', error);
        throw new Error('Authentication service configuration error. Please contact support with error code: USER_POOL_CLIENT_ERROR');
      }

      // Handle schema validation errors
      if (error.message.includes('schema') || error.message.includes('attributes')) {
        console.error('Sign-up failed: Schema validation error', error);
        throw new Error('Unable to create account due to validation error. Please contact support with error code: SCHEMA_VALIDATION_ERROR');
      }

      // Handle password policy errors
      if (error.message.includes('password')) {
        throw new Error(error.message);
      }
    }

    // Re-throw other errors
    console.error('Sign-up error:', error);
    throw error;
  }
};

// Confirm sign up helper function
export const confirmSignUp = async (
  username: string,
  confirmationCode: string
): Promise<boolean> => {
  // Check if we're using placeholder values (development mode)
  const config = getEnvConfig();
  const userPoolId = config.Auth?.Cognito?.userPoolId || '';
  const userPoolClientId = config.Auth?.Cognito?.userPoolClientId || '';

  const isPlaceholderUserPoolId = userPoolId.includes('xxxxxxxx');
  const isPlaceholderClientId = userPoolClientId.includes('xxxxxxxxxxxxxxxxxxxxxxxxxx');

  // If we're using placeholder values, switch to development mode
  if (process.env.NODE_ENV === 'development' || isPlaceholderUserPoolId || isPlaceholderClientId) {
    console.info('Using development mode for confirming sign-up');

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // In development mode, any code confirms the user
    if (confirmationCode.length === 6) {
      // Store confirmed user in local storage for development
      localStorage.setItem('dev-auth-state', 'signed-up');
      return true;
    } else {
      throw new Error('Invalid confirmation code. Please enter the 6-digit code.');
    }
  }

  try {
    // For production, use Cognito
    const { isSignUpComplete } = await amplifyConfirmSignUp({
      username,
      confirmationCode
    });

    return isSignUpComplete;
  } catch (error) {
    // Handle specific Cognito errors
    if (error instanceof Error) {
      if (error.name === 'CodeMismatchException') {
        throw new Error('Invalid verification code. Please try again.');
      }

      if (error.name === 'ExpiredCodeException') {
        throw new Error('Verification code has expired. Please request a new one.');
      }
    }

    // Re-throw other errors
    console.error('Confirm sign-up error:', error);
    throw error;
  }
};

// Sign out helper function
export const signOut = async (): Promise<void> => {
  // Check if we're using placeholder values (development mode)
  const config = getEnvConfig();
  const userPoolId = config.Auth?.Cognito?.userPoolId || '';
  const userPoolClientId = config.Auth?.Cognito?.userPoolClientId || '';

  const isPlaceholderUserPoolId = userPoolId.includes('xxxxxxxx');
  const isPlaceholderClientId = userPoolClientId.includes('xxxxxxxxxxxxxxxxxxxxxxxxxx');

  // Handle development mode or placeholder values
  if (process.env.NODE_ENV === 'development' || isPlaceholderUserPoolId || isPlaceholderClientId) {
    // Clear development auth state
    localStorage.removeItem('dev-auth-state');
    localStorage.removeItem('dev-signup-email');
    localStorage.removeItem('dev-signup-username');

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return;
  }

  // For production
  await amplifySignOut();
};
