import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoUserAttribute, CognitoUserSession } from 'amazon-cognito-identity-js';
import { config } from '../lib/config';
import type { SignInResult as TSignInResult, SignUpResult as TSignUpResult, ConfirmSignUpResult as TConfirmSignUpResult, ForgotPasswordResult as TForgotPasswordResult, ForgotPasswordSubmitResult as TForgotPasswordSubmitResult, AuthResult } from '../types/auth';

// Initialize Cognito User Pool with error handling
let userPool: CognitoUserPool | null = null;

try {
  if (config.auth.aws.userPoolId && config.auth.aws.clientId) {
    userPool = new CognitoUserPool({
      UserPoolId: config.auth.aws.userPoolId,
      ClientId: config.auth.aws.clientId,
    });
  } else {
    console.warn('Cognito configuration is missing. Authentication will not be available.');
  }
} catch (error) {
  console.error('Failed to initialize Cognito User Pool:', error);
}

export interface SignUpParams {
  email: string;
  password: string;
  name?: string;
  familyName?: string;
}

// Extended result types for internal use
// We'll handle SignIn result directly without extending the imported type

interface CurrentUserResult extends AuthResult {
  user?: CognitoUser | null;
  session?: CognitoUserSession;
  idToken?: string;
  accessToken?: string;
}

interface RefreshTokensResult extends AuthResult {
  session?: CognitoUserSession;
}

interface AuthService {
  signIn(email: string, password: string): Promise<TSignInResult>;
  signUp(params: SignUpParams): Promise<TSignUpResult>;
  confirmSignUp(email: string, code: string): Promise<TConfirmSignUpResult>;
  signOut(): Promise<AuthResult>;
  getCurrentUser(): Promise<CurrentUserResult>;
  resendSignUp(email: string): Promise<AuthResult>;
  forgotPassword(email: string): Promise<TForgotPasswordResult>;
  forgotPasswordSubmit(email: string, code: string, newPassword: string): Promise<TForgotPasswordSubmitResult>;
  changePassword(oldPassword: string, newPassword: string): Promise<AuthResult>;
  getIdToken(): Promise<string | null>;
  refreshTokens(): Promise<RefreshTokensResult>;
}

// Helper function to map CognitoUser to our User type
function mapCognitoUser(cognitoUser: CognitoUser | null): import('../types/auth').User | null {
  if (!cognitoUser) return null;
  return {
    username: cognitoUser.getUsername(),
    attributes: {} // This will be populated by user attributes
  };
}

export const authService: AuthService = {
  // Sign in with email and password
  async signIn(email: string, password: string): Promise<TSignInResult> {
    try {
      if (!userPool) {
        return {
          success: false,
          error: 'Authentication service is not configured',
        } as TSignInResult;
      }

      const authenticationDetails = new AuthenticationDetails({
        Username: email,
        Password: password,
      });

      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      return new Promise<TSignInResult>((resolve) => {
        cognitoUser.authenticateUser(authenticationDetails, {
          onSuccess: () => {
            resolve({
              success: true,
              user: mapCognitoUser(cognitoUser),
              message: 'Successfully signed in',
            } as TSignInResult);
          },
          onFailure: (err) => {
            resolve({
              success: false,
              error: err.message || 'Failed to sign in',
            } as TSignInResult);
          },
          newPasswordRequired: () => {
            resolve({
              success: false,
              error: 'New password required',
            } as TSignInResult);
          },
          mfaRequired: () => {
            resolve({
              success: false,
              error: 'MFA required',
            } as TSignInResult);
          },
        });
      });
    } catch (error: unknown) {
      console.error('Error signing in:', error);
      return {
        success: false,
        error: (error as Error).message || 'Failed to sign in',
      } as TSignInResult;
    }
  },

  // Sign up new user
  async signUp({ email, password, name, familyName }: SignUpParams): Promise<TSignUpResult> {
    try {
      if (!userPool) {
        return {
          success: false,
          error: 'Authentication service is not configured',
        } as TSignUpResult;
      }

      const attributes: CognitoUserAttribute[] = [
        new CognitoUserAttribute({ Name: 'email', Value: email }),
      ];

      if (name) {
        attributes.push(new CognitoUserAttribute({ Name: 'name', Value: name }));
      }

      if (familyName) {
        attributes.push(new CognitoUserAttribute({ Name: 'family_name', Value: familyName }));
      }

      return new Promise<TSignUpResult>((resolve) => {
        userPool.signUp(email, password, attributes, [], (err, result) => {
          if (err) {
            resolve({
              success: false,
              error: err.message || 'Failed to sign up',
            } as TSignUpResult);
          } else {
            resolve({
              success: true,
              userConfirmed: result?.userConfirmed,
              userSub: result?.userSub,
              message: 'Successfully signed up',
            } as TSignUpResult);
          }
        });
      });
    } catch (error: unknown) {
      console.error('Error signing up:', error);
      return {
        success: false,
        error: (error as Error).message || 'Failed to sign up',
      } as TSignUpResult;
    }
  },

  // Confirm sign up with verification code
  async confirmSignUp(email: string, code: string): Promise<TConfirmSignUpResult> {
    try {
      if (!userPool) {
        return {
          success: false,
          error: 'Authentication service is not configured',
        } as TConfirmSignUpResult;
      }

      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      return new Promise<TConfirmSignUpResult>((resolve) => {
        cognitoUser.confirmRegistration(code, true, (err) => {
          if (err) {
            resolve({
              success: false,
              error: err.message || 'Failed to confirm sign up',
            } as TConfirmSignUpResult);
          } else {
            resolve({
              success: true,
              confirmed: true,
              message: 'Email verified successfully',
            } as TConfirmSignUpResult);
          }
        });
      });
    } catch (error: unknown) {
      console.error('Error confirming sign up:', error);
      return {
        success: false,
        error: (error as Error).message || 'Failed to confirm sign up',
      } as TConfirmSignUpResult;
    }
  },

  // Sign out current user
  async signOut(): Promise<AuthResult> {
    try {
      if (!userPool) {
        return {
          success: true,
          message: 'No active session to sign out',
        };
      }

      const cognitoUser = userPool.getCurrentUser();

      if (cognitoUser) {
        cognitoUser.signOut();
      }

      return {
        success: true,
        message: 'Successfully signed out',
      };
    } catch (error: unknown) {
      console.error('Error signing out:', error);
      return {
        success: false,
        error: (error as Error).message || 'Failed to sign out',
      };
    }
  },

  // Get current authenticated user
  async getCurrentUser(): Promise<CurrentUserResult> {
    try {
      if (!userPool) {
        return {
          success: false,
          user: null,
        };
      }

      const cognitoUser = userPool.getCurrentUser();

      if (!cognitoUser) {
        return {
          success: false,
          user: null,
        };
      }

      return new Promise<CurrentUserResult>((resolve) => {
        cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
          if (err || !session || !session.isValid()) {
            resolve({
              success: false,
              user: null,
            });
          } else {
            resolve({
              success: true,
              user: cognitoUser,
              session: session,
              idToken: session.getIdToken().getJwtToken(),
              accessToken: session.getAccessToken().getJwtToken(),
            });
          }
        });
      });
    } catch {
      // User is not authenticated
      return {
        success: false,
        user: null,
      };
    }
  },

  // Resend confirmation code
  async resendSignUp(email: string): Promise<AuthResult> {
    try {
      if (!userPool) {
        return {
          success: false,
          error: 'Authentication service is not configured',
        };
      }

      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      return new Promise<AuthResult>((resolve) => {
        cognitoUser.resendConfirmationCode((err) => {
          if (err) {
            resolve({
              success: false,
              error: err.message || 'Failed to resend code',
            });
          } else {
            resolve({
              success: true,
              message: 'Confirmation code resent',
            });
          }
        });
      });
    } catch (error: unknown) {
      console.error('Error resending code:', error);
      return {
        success: false,
        error: (error as Error).message || 'Failed to resend code',
      };
    }
  },

  // Forgot password - initiate reset
  async forgotPassword(email: string): Promise<TForgotPasswordResult> {
    try {
      if (!userPool) {
        return {
          success: false,
          error: 'Authentication service is not configured',
        } as TForgotPasswordResult;
      }

      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      return new Promise<TForgotPasswordResult>((resolve) => {
        cognitoUser.forgotPassword({
          onSuccess: () => {
            resolve({
              success: true,
              message: 'Password reset code sent',
            } as TForgotPasswordResult);
          },
          onFailure: (err) => {
            resolve({
              success: false,
              error: err.message || 'Failed to initiate password reset',
            } as TForgotPasswordResult);
          },
        });
      });
    } catch (error: unknown) {
      console.error('Error initiating password reset:', error);
      return {
        success: false,
        error: (error as Error).message || 'Failed to initiate password reset',
      } as TForgotPasswordResult;
    }
  },

  // Forgot password - submit new password
  async forgotPasswordSubmit(email: string, code: string, newPassword: string): Promise<TForgotPasswordSubmitResult> {
    try {
      if (!userPool) {
        return {
          success: false,
          error: 'Authentication service is not configured',
        };
      }

      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      return new Promise<TForgotPasswordSubmitResult>((resolve) => {
        cognitoUser.confirmPassword(code, newPassword, {
          onSuccess: () => {
            resolve({
              success: true,
              message: 'Password reset successfully',
            });
          },
          onFailure: (err) => {
            resolve({
              success: false,
              error: err.message || 'Failed to reset password',
            });
          },
        });
      });
    } catch (error: unknown) {
      console.error('Error resetting password:', error);
      return {
        success: false,
        error: (error as Error).message || 'Failed to reset password',
      };
    }
  },

  // Change password for authenticated user
  async changePassword(oldPassword: string, newPassword: string): Promise<AuthResult> {
    try {
      if (!userPool) {
        return {
          success: false,
          error: 'Authentication service is not configured',
        };
      }

      const cognitoUser = userPool.getCurrentUser();

      if (!cognitoUser) {
        return {
          success: false,
          error: 'User not authenticated',
        };
      }

      return new Promise<RefreshTokensResult>((resolve) => {
        cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
          if (err || !session || !session.isValid()) {
            resolve({
              success: false,
              error: 'Session invalid',
            });
          } else {
            cognitoUser.changePassword(oldPassword, newPassword, (err) => {
              if (err) {
                resolve({
                  success: false,
                  error: err.message || 'Failed to change password',
                });
              } else {
                resolve({
                  success: true,
                  message: 'Password changed successfully',
                });
              }
            });
          }
        });
      });
    } catch (error: unknown) {
      console.error('Error changing password:', error);
      return {
        success: false,
        error: (error as Error).message || 'Failed to change password',
      };
    }
  },

  // Get ID token for API requests
  async getIdToken(): Promise<string | null> {
    try {
      if (!userPool) {
        return null;
      }

      const cognitoUser = userPool.getCurrentUser();

      if (!cognitoUser) {
        return null;
      }

      return new Promise<string | null>((resolve) => {
        cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
          if (err || !session || !session.isValid()) {
            resolve(null);
          } else {
            resolve(session.getIdToken().getJwtToken());
          }
        });
      });
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  },

  // Refresh tokens
  async refreshTokens(): Promise<RefreshTokensResult> {
    try {
      if (!userPool) {
        return {
          success: false,
          error: 'Authentication service is not configured',
        };
      }

      const cognitoUser = userPool.getCurrentUser();

      if (!cognitoUser) {
        return {
          success: false,
          error: 'User not authenticated',
        };
      }

      return new Promise<RefreshTokensResult>((resolve) => {
        cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
          if (err) {
            resolve({
              success: false,
              error: err.message || 'Failed to get session',
            });
          } else if (session && session.isValid()) {
            resolve({
              success: true,
              session,
            });
          } else if (session) {
            // Need to refresh
            const refreshToken = session.getRefreshToken();
            cognitoUser.refreshSession(refreshToken, (err: Error | null, newSession: CognitoUserSession | null) => {
              if (err) {
                resolve({
                  success: false,
                  error: err.message || 'Failed to refresh tokens',
                });
              } else {
                resolve({
                  success: true,
                  session: newSession!,
                });
              }
            });
          } else {
            resolve({
              success: false,
              error: 'No session available',
            });
          }
        });
      });
    } catch (error: unknown) {
      console.error('Error refreshing tokens:', error);
      return {
        success: false,
        error: (error as Error).message || 'Failed to refresh tokens',
      };
    }
  },
};

export default authService;
