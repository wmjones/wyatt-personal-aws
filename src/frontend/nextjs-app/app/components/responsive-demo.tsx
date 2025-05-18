'use client'

export default function ResponsiveDemo() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Container Classes</h2>
        <div className="container-dashboard bg-muted p-4 rounded-lg">
          <p className="text-muted-foreground">This container adjusts its width based on screen size</p>
          <p className="text-sm">- 640px max-width on sm screens</p>
          <p className="text-sm">- 768px max-width on md screens</p>
          <p className="text-sm">- 1024px max-width on lg screens</p>
          <p className="text-sm">- Up to 1920px on dashboard screens</p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Dashboard Grid</h2>
        <div className="dashboard-grid">
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Card 1</h3>
            <p className="text-sm text-muted-foreground">Responsive grid item</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Card 2</h3>
            <p className="text-sm text-muted-foreground">Responsive grid item</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Card 3</h3>
            <p className="text-sm text-muted-foreground">Responsive grid item</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Card 4</h3>
            <p className="text-sm text-muted-foreground">Responsive grid item</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Responsive Typography</h2>
        <h1 className="responsive-heading text-primary">Responsive Heading</h1>
        <p className="text-muted-foreground">This heading changes size based on screen width</p>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Responsive Visibility</h2>
        <div className="space-y-4">
          <div className="mobile-only bg-warning text-white p-4 rounded-lg">
            <p className="font-semibold">Mobile Only</p>
            <p>This only shows on mobile screens (&lt; 768px)</p>
          </div>
          <div className="tablet-up bg-success text-white p-4 rounded-lg">
            <p className="font-semibold">Tablet and Up</p>
            <p>This shows on tablet screens and larger (≥ 768px)</p>
          </div>
          <div className="desktop-up bg-accent text-accent-foreground p-4 rounded-lg">
            <p className="font-semibold">Desktop and Up</p>
            <p>This shows on desktop screens and larger (≥ 1024px)</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Chart Container</h2>
        <div className="chart-container bg-muted rounded-lg flex items-center justify-center">
          <p className="text-muted-foreground">Chart placeholder - Min height: 300px, Max: 600px</p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Responsive Spacing</h2>
        <div className="responsive-padding bg-primary text-primary-foreground rounded-lg">
          <p>This box has responsive padding that increases with screen size</p>
          <p className="text-sm mt-2">Mobile: 1rem | Tablet: 1.5rem | Desktop: 2rem | XL: 2.5rem</p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Sidebar Layout Demo</h2>
        <div className="sidebar-layout bg-muted rounded-lg overflow-hidden h-64">
          <div className="sidebar bg-secondary p-4">
            <p className="font-semibold text-secondary-foreground">Sidebar</p>
            <p className="text-sm text-secondary-foreground">Fixed width on desktop</p>
          </div>
          <div className="main-content bg-background p-4">
            <p className="font-semibold">Main Content</p>
            <p className="text-sm text-muted-foreground">Flexible width area</p>
          </div>
        </div>
      </section>
    </div>
  )
}
