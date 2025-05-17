import { Amplify, Auth } from 'aws-amplify';
import { config } from '../lib/config';

// Configure Amplify
Amplify.configure({
  Auth: {
    region: config.auth.aws.region,
    userPoolId: config.auth.aws.userPoolId,
    userPoolWebClientId: config.auth.aws.clientId,
  },
});

export interface SignUpParams {
  email: string;
  password: string;
  name?: string;
  familyName?: string;
}

export interface SignInResult {
  isSignedIn: boolean;
  nextStep?: any;
}

export const authService = {
  // Sign in with email and password
  async signIn(email: string, password: string) {
    try {
      const user = await Auth.signIn(email, password);
      return {
        success: true,
        user,
        message: 'Successfully signed in',
      };
    } catch (error: any) {
      console.error('Error signing in:', error);
      return {
        success: false,
        error: error.message || 'Failed to sign in',
      };
    }
  },

  // Sign up new user
  async signUp({ email, password, name, familyName }: SignUpParams) {
    try {
      const { user, userConfirmed, userSub } = await Auth.signUp({
        username: email,
        password,
        attributes: {
          email,
          ...(name && { name }),
          ...(familyName && { family_name: familyName }),
        },
      });

      return {
        success: true,
        user,
        userConfirmed,
        userSub,
        message: 'Successfully signed up',
      };
    } catch (error: any) {
      console.error('Error signing up:', error);
      return {
        success: false,
        error: error.message || 'Failed to sign up',
      };
    }
  },

  // Confirm sign up with verification code
  async confirmSignUp(email: string, code: string) {
    try {
      const result = await Auth.confirmSignUp(email, code);
      return {
        success: true,
        result,
        message: 'Email verified successfully',
      };
    } catch (error: any) {
      console.error('Error confirming sign up:', error);
      return {
        success: false,
        error: error.message || 'Failed to confirm sign up',
      };
    }
  },

  // Sign out current user
  async signOut() {
    try {
      await Auth.signOut();
      return {
        success: true,
        message: 'Successfully signed out',
      };
    } catch (error: any) {
      console.error('Error signing out:', error);
      return {
        success: false,
        error: error.message || 'Failed to sign out',
      };
    }
  },

  // Get current authenticated user
  async getCurrentUser() {
    try {
      const user = await Auth.currentAuthenticatedUser();
      const session = await Auth.currentSession();

      return {
        success: true,
        user,
        session,
        idToken: session.getIdToken().getJwtToken(),
        accessToken: session.getAccessToken().getJwtToken(),
      };
    } catch (error) {
      // User is not authenticated
      return {
        success: false,
        user: null,
      };
    }
  },

  // Resend confirmation code
  async resendSignUp(email: string) {
    try {
      await Auth.resendSignUp(email);
      return {
        success: true,
        message: 'Confirmation code resent',
      };
    } catch (error: any) {
      console.error('Error resending code:', error);
      return {
        success: false,
        error: error.message || 'Failed to resend code',
      };
    }
  },

  // Forgot password - initiate reset
  async forgotPassword(email: string) {
    try {
      const result = await Auth.forgotPassword(email);
      return {
        success: true,
        result,
        message: 'Password reset code sent',
      };
    } catch (error: any) {
      console.error('Error initiating password reset:', error);
      return {
        success: false,
        error: error.message || 'Failed to initiate password reset',
      };
    }
  },

  // Forgot password - submit new password
  async forgotPasswordSubmit(email: string, code: string, newPassword: string) {
    try {
      const result = await Auth.forgotPasswordSubmit(email, code, newPassword);
      return {
        success: true,
        result,
        message: 'Password reset successfully',
      };
    } catch (error: any) {
      console.error('Error resetting password:', error);
      return {
        success: false,
        error: error.message || 'Failed to reset password',
      };
    }
  },

  // Change password for authenticated user
  async changePassword(oldPassword: string, newPassword: string) {
    try {
      const user = await Auth.currentAuthenticatedUser();
      await Auth.changePassword(user, oldPassword, newPassword);
      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error: any) {
      console.error('Error changing password:', error);
      return {
        success: false,
        error: error.message || 'Failed to change password',
      };
    }
  },

  // Get ID token for API requests
  async getIdToken() {
    try {
      const session = await Auth.currentSession();
      return session.getIdToken().getJwtToken();
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  },

  // Refresh tokens
  async refreshTokens() {
    try {
      const session = await Auth.currentSession();
      if (session.isValid()) {
        return {
          success: true,
          session,
        };
      }

      // Refresh the session
      const user = await Auth.currentAuthenticatedUser();
      const refreshedSession = await Auth.refreshSession(
        user,
        session.getRefreshToken()
      );

      return {
        success: true,
        session: refreshedSession,
      };
    } catch (error: any) {
      console.error('Error refreshing tokens:', error);
      return {
        success: false,
        error: error.message || 'Failed to refresh tokens',
      };
    }
  },
};

export default authService;
