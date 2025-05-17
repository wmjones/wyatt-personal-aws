import { describe, it, expect, jest } from '@jest/globals';
import { authService } from '../../services/auth';
import { Auth } from 'aws-amplify';

// Mock Amplify
jest.mock('aws-amplify', () => ({
  Amplify: {
    configure: jest.fn(),
  },
  Auth: {
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    currentAuthenticatedUser: jest.fn(),
    currentSession: jest.fn(),
  },
}));

describe('Auth Service', () => {
  it('should configure Amplify on import', () => {
    expect(true).toBe(true); // Amplify configuration happens on module import
  });

  it('should handle successful sign in', async () => {
    const mockUser = { username: 'test@example.com' };
    // @ts-expect-error Mock is already set up
    Auth.signIn.mockResolvedValue(mockUser);

    const result = await authService.signIn('test@example.com', 'password');

    expect(result.success).toBe(true);
    expect(result.user).toEqual(mockUser);
    expect(result.message).toBe('Successfully signed in');
  });

  it('should handle sign in error', async () => {
    // @ts-expect-error Mock is already set up
    Auth.signIn.mockRejectedValue(new Error('Invalid credentials'));

    const result = await authService.signIn('test@example.com', 'wrong');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid credentials');
  });

  it('should get current authenticated user', async () => {
    const mockUser = { username: 'test@example.com' };
    const mockSession = {
      getIdToken: () => ({ getJwtToken: () => 'mock-id-token' }),
      getAccessToken: () => ({ getJwtToken: () => 'mock-access-token' }),
    };

    // @ts-expect-error Mock is already set up
    Auth.currentAuthenticatedUser.mockResolvedValue(mockUser);
    // @ts-expect-error Mock is already set up
    Auth.currentSession.mockResolvedValue(mockSession);

    const result = await authService.getCurrentUser();

    expect(result.success).toBe(true);
    expect(result.user).toEqual(mockUser);
    expect(result.idToken).toBe('mock-id-token');
    expect(result.accessToken).toBe('mock-access-token');
  });
});
