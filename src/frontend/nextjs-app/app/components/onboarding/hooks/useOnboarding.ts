import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import toast from 'react-hot-toast';

export interface UserPreferences {
  id: number;
  user_id: string;
  has_seen_welcome: boolean;
  has_completed_tour: boolean;
  tour_progress: Record<string, unknown>;
  onboarding_completed_at: string | null;
  tooltips_enabled: boolean;
  preferred_help_format: string;
  created_at: string;
  updated_at: string;
}

interface UseOnboardingReturn {
  preferences: UserPreferences | null;
  isLoading: boolean;
  error: string | null;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  markWelcomeSeen: () => Promise<void>;
  markTourCompleted: () => Promise<void>;
  updateTourProgress: (stepId: string, completed: boolean) => Promise<void>;
  resetOnboarding: () => Promise<void>;
  shouldShowWelcome: boolean;
  shouldShowTour: boolean;
}

// const DEFAULT_PREFERENCES: Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
//   has_seen_welcome: false,
//   has_completed_tour: false,
//   tour_progress: {},
//   onboarding_completed_at: null,
//   tooltips_enabled: true,
//   preferred_help_format: 'text'
// };

export function useOnboarding(): UseOnboardingReturn {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();

  // Fetch user preferences
  const fetchPreferences = useCallback(async () => {
    if (!auth.isAuthenticated) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = await auth.getIdToken();
      const response = await fetch('/api/user/preferences', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch preferences');
      }

      const data = await response.json();
      setPreferences(data.preferences);

      // Store in localStorage for offline access
      localStorage.setItem('userPreferences', JSON.stringify(data.preferences));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load preferences';
      setError(errorMessage);

      // Try to load from localStorage as fallback
      const cached = localStorage.getItem('userPreferences');
      if (cached) {
        setPreferences(JSON.parse(cached));
      }
    } finally {
      setIsLoading(false);
    }
  }, [auth]);

  // Update preferences
  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    if (!auth.isAuthenticated) {
      throw new Error('User must be authenticated to update preferences');
    }

    try {
      const token = await auth.getIdToken();
      if (!token) {
        throw new Error('Failed to get authentication token');
      }

      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        // Don't throw on 401 errors to prevent redirect loops
        if (response.status === 401) {
          console.error('Authentication error updating preferences');
          return;
        }
        throw new Error('Failed to update preferences');
      }

      const data = await response.json();
      setPreferences(data.preferences);

      // Update localStorage
      localStorage.setItem('userPreferences', JSON.stringify(data.preferences));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update preferences';
      toast.error(errorMessage);
      throw err;
    }
  }, [auth]);

  // Convenience methods
  const markWelcomeSeen = useCallback(async () => {
    try {
      await updatePreferences({ has_seen_welcome: true });
    } catch (error) {
      // If the update fails, still close the modal and continue
      // This prevents redirect to login on skip
      console.error('Failed to mark welcome as seen:', error);

      // Update local state to prevent showing again in this session
      if (preferences) {
        setPreferences({
          ...preferences,
          has_seen_welcome: true
        });

        // Also update localStorage as a fallback
        localStorage.setItem('userPreferences', JSON.stringify({
          ...preferences,
          has_seen_welcome: true
        }));
      }
    }
  }, [updatePreferences, preferences]);

  const markTourCompleted = useCallback(async () => {
    await updatePreferences({
      has_completed_tour: true,
      onboarding_completed_at: new Date().toISOString()
    });
    toast.success('Welcome tour completed! 🎉');
  }, [updatePreferences]);

  const updateTourProgress = useCallback(async (stepId: string, completed: boolean) => {
    const currentProgress = preferences?.tour_progress || {};
    const updatedProgress = {
      ...currentProgress,
      [stepId]: completed
    };

    await updatePreferences({ tour_progress: updatedProgress });
  }, [preferences, updatePreferences]);

  const resetOnboarding = useCallback(async () => {
    await updatePreferences({
      has_seen_welcome: false,
      has_completed_tour: false,
      tour_progress: {},
      onboarding_completed_at: null
    });
    toast.success('Onboarding reset - you can start the tour again');
  }, [updatePreferences]);

  // Load preferences on mount and auth change
  useEffect(() => {
    if (auth.isAuthenticated && !auth.loading) {
      // Initialize the preferences table if needed (temporary fix)
      const initPreferences = async () => {
        try {
          const token = await auth.getIdToken();
          await fetch('/api/user/preferences/init', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        } catch (err) {
          console.error('Failed to initialize preferences table:', err);
        }
        // Fetch preferences after initialization
        fetchPreferences();
      };
      initPreferences();
    }
  }, [auth.isAuthenticated, auth.loading, fetchPreferences, auth]);

  // Computed properties
  const shouldShowWelcome = !preferences?.has_seen_welcome && auth.isAuthenticated;
  const shouldShowTour = !!(preferences?.has_seen_welcome && !preferences?.has_completed_tour && auth.isAuthenticated);

  return {
    preferences,
    isLoading,
    error,
    updatePreferences,
    markWelcomeSeen,
    markTourCompleted,
    updateTourProgress,
    resetOnboarding,
    shouldShowWelcome,
    shouldShowTour
  };
}
