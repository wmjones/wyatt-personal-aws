'use client'

import { useTheme } from './theme-provider'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setTheme('light')}
        className={`p-2 rounded-lg transition-colors ${
          theme === 'light' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
        }`}
        aria-label="Light theme"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M12 20V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M4 12H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M22 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M6.34315 6.34315L4.92893 4.92893" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M19.0711 19.0711L17.6569 17.6569" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M6.34315 17.6569L4.92893 19.0711" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M19.0711 4.92893L17.6569 6.34315" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="12" cy="12" r="4" fill="currentColor"/>
        </svg>
      </button>

      <button
        onClick={() => setTheme('dark')}
        className={`p-2 rounded-lg transition-colors ${
          theme === 'dark' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
        }`}
        aria-label="Dark theme"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor"/>
        </svg>
      </button>

      <button
        onClick={() => setTheme('system')}
        className={`p-2 rounded-lg transition-colors ${
          theme === 'system' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
        }`}
        aria-label="System theme"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M3 9H21" stroke="currentColor" strokeWidth="2"/>
          <path d="M9 21V9" stroke="currentColor" strokeWidth="2"/>
        </svg>
      </button>

      <span className="ml-2 text-sm text-muted-foreground">
        Current: {resolvedTheme === 'dark' ? 'Dark' : 'Light'}
      </span>
    </div>
  )
}
