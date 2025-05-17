'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth';
import { CognitoUser } from 'amazon-cognito-identity-js';

interface AuthUser {
  username: string;
  email: string;
  attributes: {
    email: string;
    email_verified: boolean;
    sub: string;
    [key: string]: any;
  };
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (params: { email: string; password: string; name?: string }) => Promise<any>;
  signOut: () => Promise<void>;
  confirmSignUp: (email: string, code: string) => Promise<any>;
  forgotPassword: (email: string) => Promise<any>;
  forgotPasswordSubmit: (email: string, code: string, newPassword: string) => Promise<any>;
  refreshToken: () => Promise<boolean>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for authenticated user on mount
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const result = await authService.getCurrentUser();
      if (result.success && result.user) {
        const cognitoUser = result.user as CognitoUser;
        const attributes = await getUserAttributes(cognitoUser);

        setUser({
          username: cognitoUser.getUsername(),
          email: attributes.email || '',
          attributes,
        });
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserAttributes = async (cognitoUser: CognitoUser): Promise<any> => {
    return new Promise((resolve, reject) => {
      cognitoUser.getUserAttributes((err, attributes) => {
        if (err) {
          reject(err);
        } else {
          const attrs: any = {};
          attributes?.forEach(attr => {
            attrs[attr.getName()] = attr.getValue();
          });
          resolve(attrs);
        }
      });
    });
  };

  const signIn = async (email: string, password: string) => {
    const result = await authService.signIn(email, password);

    if (result.success && result.user) {
      const cognitoUser = result.user as CognitoUser;
      const attributes = await getUserAttributes(cognitoUser);

      setUser({
        username: cognitoUser.getUsername(),
        email: attributes.email || email,
        attributes,
      });
    }

    return result;
  };

  const signUp = async (params: { email: string; password: string; name?: string }) => {
    return await authService.signUp({
      email: params.email,
      password: params.password,
      name: params.name,
    });
  };

  const signOut = async () => {
    const result = await authService.signOut();
    if (result.success) {
      setUser(null);
    }
  };

  const confirmSignUp = async (email: string, code: string) => {
    return await authService.confirmSignUp(email, code);
  };

  const forgotPassword = async (email: string) => {
    return await authService.forgotPassword(email);
  };

  const forgotPasswordSubmit = async (email: string, code: string, newPassword: string) => {
    return await authService.forgotPasswordSubmit(email, code, newPassword);
  };

  const refreshToken = async () => {
    const result = await authService.refreshTokens();
    return result.success;
  };

  const getIdToken = async () => {
    return await authService.getIdToken();
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    confirmSignUp,
    forgotPassword,
    forgotPasswordSubmit,
    refreshToken,
    getIdToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Higher-order component for protected routes
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, loading } = useAuth();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);

    if (!mounted || loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading...</div>
        </div>
      );
    }

    if (!isAuthenticated) {
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return null;
    }

    return <Component {...props} />;
  };
}
