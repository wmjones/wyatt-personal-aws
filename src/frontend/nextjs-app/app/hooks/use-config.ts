'use client'

import { clientConfig, type ClientConfig } from '@/app/lib/config';

/**
 * Hook to access client-safe configuration in React components
 *
 * @example
 * const config = useConfig();
 * const appName = config.app.name;
 */
export function useConfig(): ClientConfig {
  return clientConfig;
}

/**
 * Hook to access specific config section
 *
 * @example
 * const authConfig = useConfigSection('auth');
 * const { region, userPoolId } = authConfig.aws;
 */
export function useConfigSection<K extends keyof ClientConfig>(
  section: K
): ClientConfig[K] {
  return clientConfig[section];
}
