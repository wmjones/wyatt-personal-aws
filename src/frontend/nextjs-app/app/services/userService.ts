import { apiService } from './api';
import type { User } from '../types/api';

export class UserService {
  private currentUser: User | null = null;
  private profileCache: { data: User; timestamp: number } | null = null;
  private cacheTimeout = 10 * 60 * 1000; // 10 minutes

  async getProfile(forceRefresh = false): Promise<User> {
    // Check cache first
    if (!forceRefresh && this.profileCache && Date.now() - this.profileCache.timestamp < this.cacheTimeout) {
      return this.profileCache.data;
    }

    const profile = await apiService.getUserProfile();

    // Update cache
    this.profileCache = { data: profile, timestamp: Date.now() };
    this.currentUser = profile;

    return profile;
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    const profile = await apiService.updateUserProfile(updates);

    // Update cache
    this.profileCache = { data: profile, timestamp: Date.now() };
    this.currentUser = profile;

    return profile;
  }

  // Helper methods
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isLoggedIn(): boolean {
    return this.currentUser !== null;
  }

  async updatePreferences(preferences: Record<string, unknown>): Promise<User> {
    // Since User type might not have preferences field, cast properly
    return this.updateProfile({ ...this.currentUser, preferences } as Partial<User>);
  }

  async updateSettings(settings: Record<string, unknown>): Promise<User> {
    // Since User type might not have settings field, cast properly
    return this.updateProfile({ ...this.currentUser, settings } as Partial<User>);
  }

  // Clear cache on logout
  clearCache() {
    this.currentUser = null;
    this.profileCache = null;
  }

  // Listen for auth state changes
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onAuthStateChange(_callback: (user: User | null) => void) {
    // This would integrate with auth service
    // For now, return a cleanup function
    return () => {
      // Cleanup logic
    };
  }
}

// Export singleton instance
export const userService = new UserService();
