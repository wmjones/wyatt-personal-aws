import { describe, it, expect } from '@jest/globals';
import { authService } from '../../services/auth';

describe('Auth Service', () => {
  it('should have sign in function', () => {
    expect(authService.signIn).toBeDefined();
  });

  it('should have sign up function', () => {
    expect(authService.signUp).toBeDefined();
  });

  it('should have get current user function', () => {
    expect(authService.getCurrentUser).toBeDefined();
  });

  it('should have sign out function', () => {
    expect(authService.signOut).toBeDefined();
  });
});
