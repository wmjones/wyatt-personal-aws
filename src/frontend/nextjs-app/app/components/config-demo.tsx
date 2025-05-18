'use client'

import { useConfig, useConfigSection } from '@/app/hooks/use-config';

export default function ConfigDemo() {
  const config = useConfig();
  const authConfig = useConfigSection('auth');

  return (
    <div className="space-y-6 p-8">
      <h2 className="text-2xl font-bold">Configuration Demo</h2>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">App Configuration</h3>
        <div className="bg-card p-4 rounded-lg border border-border">
          <p><span className="font-medium">App Name:</span> {config.app.name}</p>
          <p><span className="font-medium">Description:</span> {config.app.description}</p>
          <p><span className="font-medium">URL:</span> {config.app.url}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Auth Configuration</h3>
        <div className="bg-card p-4 rounded-lg border border-border">
          <p><span className="font-medium">Region:</span> {authConfig.aws.region || 'Not configured'}</p>
          <p><span className="font-medium">User Pool ID:</span> {authConfig.aws.userPoolId ? '***' + authConfig.aws.userPoolId.slice(-4) : 'Not configured'}</p>
          <p><span className="font-medium">Client ID:</span> {authConfig.aws.clientId ? '***' + authConfig.aws.clientId.slice(-4) : 'Not configured'}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Feature Flags</h3>
        <div className="bg-card p-4 rounded-lg border border-border">
          <p><span className="font-medium">Dark Mode:</span> {config.features.darkMode ? 'Enabled' : 'Disabled'}</p>
          <p><span className="font-medium">Analytics:</span> {config.features.analytics ? 'Enabled' : 'Disabled'}</p>
          <p><span className="font-medium">Debug Mode:</span> {config.features.debugMode ? 'Enabled' : 'Disabled'}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Environment Status</h3>
        <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Environment variables are loaded from <code>.env.local</code> (if present)
            and environment-specific files. Server-side variables are validated on startup.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Missing required variables will cause the application to fail startup with a helpful error message.
          </p>
        </div>
      </div>
    </div>
  );
}
