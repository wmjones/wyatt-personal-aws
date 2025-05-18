'use client'

import { useTheme } from './theme-provider'

export default function DarkModeDemo() {
  const { theme, resolvedTheme } = useTheme()

  return (
    <div className="space-y-6 p-8">
      <h2 className="text-2xl font-bold">Dark Mode Support</h2>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Current Theme</h3>
        <div className="flex gap-4">
          <div className="p-4 bg-card text-card-foreground rounded-lg border border-border">
            <p className="font-medium">Theme Setting: {theme}</p>
            <p className="text-sm text-muted-foreground">Resolved Theme: {resolvedTheme}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Color Showcase</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 bg-background text-foreground rounded-lg border border-border">
            <p className="font-medium">Background</p>
            <p className="text-sm">Default colors</p>
          </div>
          <div className="p-4 bg-primary text-primary-foreground rounded-lg">
            <p className="font-medium">Primary</p>
            <p className="text-sm">Brand color</p>
          </div>
          <div className="p-4 bg-secondary text-secondary-foreground rounded-lg">
            <p className="font-medium">Secondary</p>
            <p className="text-sm">Secondary style</p>
          </div>
          <div className="p-4 bg-muted text-muted-foreground rounded-lg">
            <p className="font-medium">Muted</p>
            <p className="text-sm">Subdued content</p>
          </div>
          <div className="p-4 bg-accent text-accent-foreground rounded-lg">
            <p className="font-medium">Accent</p>
            <p className="text-sm">Highlight color</p>
          </div>
          <div className="p-4 bg-card text-card-foreground rounded-lg border border-border">
            <p className="font-medium">Card</p>
            <p className="text-sm">Card background</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Components in Dark Mode</h3>
        <div className="space-y-2">
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
            Primary Button
          </button>
          <input
            type="text"
            placeholder="Input field"
            className="block w-full px-4 py-2 bg-background text-foreground border border-input rounded-lg focus:ring-2 focus:ring-ring focus:outline-none"
          />
          <div className="p-4 bg-warning text-white rounded-lg">
            <p className="font-medium">Warning Message</p>
            <p className="text-sm">This adapts to dark mode</p>
          </div>
          <div className="p-4 bg-error text-white rounded-lg">
            <p className="font-medium">Error Message</p>
            <p className="text-sm">Critical alerts</p>
          </div>
          <div className="p-4 bg-success text-white rounded-lg">
            <p className="font-medium">Success Message</p>
            <p className="text-sm">Positive feedback</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Theme Persistence</h3>
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-muted-foreground">The selected theme is saved to localStorage and persists across page refreshes and browser sessions.</p>
          <p className="text-sm mt-2">Try refreshing the page - your theme choice will be remembered!</p>
        </div>
      </div>
    </div>
  )
}
