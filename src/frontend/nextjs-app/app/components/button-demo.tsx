'use client'

export default function ButtonDemo() {
  return (
    <div className="space-y-6 p-8">
      <h2 className="text-2xl font-bold">Button Examples</h2>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Primary Buttons</h3>
        <div className="flex gap-4">
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
            Primary Button
          </button>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50" disabled>
            Disabled
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Secondary Buttons</h3>
        <div className="flex gap-4">
          <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-opacity">
            Secondary Button
          </button>
          <button className="px-4 py-2 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors">
            Outline Button
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Utility Buttons</h3>
        <div className="flex gap-4">
          <button className="px-4 py-2 bg-success text-white rounded-lg hover:opacity-90 transition-opacity">
            Success
          </button>
          <button className="px-4 py-2 bg-warning text-white rounded-lg hover:opacity-90 transition-opacity">
            Warning
          </button>
          <button className="px-4 py-2 bg-error text-white rounded-lg hover:opacity-90 transition-opacity">
            Error
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Cards</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 bg-card border border-border rounded-lg">
            <h4 className="text-lg font-semibold mb-2">Card Title</h4>
            <p className="text-muted-foreground">This is a card component with proper theming applied.</p>
          </div>
          <div className="p-6 bg-muted rounded-lg">
            <h4 className="text-lg font-semibold mb-2">Muted Card</h4>
            <p className="text-muted-foreground">This card uses the muted background color.</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Animations</h3>
        <div className="flex gap-4">
          <div className="p-4 bg-primary text-primary-foreground rounded-lg animate-[fade-in_1s_ease-out]">
            Fade In
          </div>
          <div className="p-4 bg-accent text-accent-foreground rounded-lg animate-[slide-up_0.5s_ease-out]">
            Slide Up
          </div>
          <div className="w-12 h-12 bg-secondary rounded-full animate-[spin_2s_linear_infinite]"></div>
        </div>
      </div>
    </div>
  )
}
