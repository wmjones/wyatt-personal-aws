# Component Mapping Document

## Overview

This document provides a comprehensive mapping between the existing react-app components and the retro-web-vibes-90s styling and structure. It outlines which components need replacement, refactoring, or creation during the migration process to achieve a consistent retro 90s aesthetic while maintaining the current functionality.

## Component Mapping Table

| Existing Component | Action | Target Component/Style | Priority | Complexity |
|-------------------|--------|------------------------|----------|------------|
| `Layout.tsx` | Refactor | RetroPattern + Container structure | High | Medium |
| `HomePage.tsx` | Replace | New RetroStyled Home page | High | Medium |
| `DemoPage.tsx` | Refactor | RetroStyled Demo with 90s controls | High | High |
| `ErrorPage.tsx` | Replace | RetroStyled Error page | Medium | Low |
| `NormalDistribution.tsx` | Enhance | Maintain D3 with RetroStyle | High | High |
| N/A | Create | RetroHeader component | High | Low |
| N/A | Create | RetroFooter component | High | Low |
| N/A | Create | CursorTrail effect | Low | Low |
| N/A | Create | MarqueeText component | Medium | Low |

## Detailed Component Mapping

### 1. Layout Component

**Current Implementation:**
```tsx
const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="container">
      <header>
        <h1>D3 Visualization Dashboard</h1>
        <p>A platform for interactive data visualization</p>
        <div className="nav-links" style={{ textAlign: 'center', marginTop: '15px' }}>
          <a href="/" style={{ margin: '0 10px', color: 'var(--primary-color)', textDecoration: 'none' }}>Home</a>
          <a href="/demo" style={{ margin: '0 10px', color: 'var(--primary-color)', textDecoration: 'none' }}>Demo</a>
        </div>
      </header>

      <main>{children}</main>

      <footer>
        <p>D3 Visualization Dashboard - Deployed via CI/CD Pipeline</p>
      </footer>
    </div>
  );
};
```

**Target Implementation:**
```tsx
const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="relative min-h-screen">
      <CursorTrail />
      <RetroPattern />

      <div className="container mx-auto px-4 py-12">
        <RetroHeader
          title="D3 VISUALIZATION DASHBOARD"
          subtitle="Interactive Data Visualization"
        />

        <main>{children}</main>

        <RetroFooter />
      </div>
    </div>
  );
};
```

**Key Changes:**
- Add RetroPattern background component
- Replace header with RetroHeader component
- Replace footer with RetroFooter component
- Add CursorTrail for interactive effect
- Update container styling to use Tailwind

### 2. HomePage Component

**Current Implementation:**
```tsx
// Basic information page with minimal styling
const HomePage: React.FC = () => {
  return (
    <section>
      <h2>Welcome to the D3 Visualization Dashboard</h2>
      <p>This dashboard demonstrates...</p>
      {/* Other content */}
    </section>
  );
};
```

**Target Implementation:**
```tsx
const HomePage: React.FC = () => {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center mb-16">
        <div className="order-2 md:order-1">
          <div className="space-y-6">
            <h2 className="retro-text text-3xl text-retro-teal">Data Visualization</h2>
            <p className="mono-text">
              Experience interactive data visualization with our retro-inspired dashboard.
              Explore statistical distributions with real-time parameter controls.
            </p>
            <div className="flex gap-4">
              <a href="/demo" className="retro-button">
                Try Demo
              </a>
              <a href="/about" className="bg-white text-retro-purple font-bold py-2 px-4 border-2 border-black hover:bg-gray-100">
                About
              </a>
            </div>

            <div className="border-2 border-dashed border-retro-pink p-4 bg-white">
              <p className="mono-text text-sm">
                <span className="text-retro-purple font-bold">&lt;NEW&gt;</span>
                Interactive normal distribution visualization with parameter controls!
                <span className="text-retro-purple font-bold">&lt;/NEW&gt;</span>
              </p>
            </div>
          </div>
        </div>

        <div className="order-1 md:order-2">
          <div className="retro-card p-6">
            <h3 className="retro-text text-2xl mb-4 text-center text-retro-purple">FEATURES</h3>
            <ul className="space-y-2 mono-text">
              <li className="flex items-start">
                <span className="text-retro-teal mr-2">→</span>
                <span>Interactive parameter controls</span>
              </li>
              <li className="flex items-start">
                <span className="text-retro-teal mr-2">→</span>
                <span>Real-time visualization updates</span>
              </li>
              <li className="flex items-start">
                <span className="text-retro-teal mr-2">→</span>
                <span>Statistical insights</span>
              </li>
              <li className="flex items-start">
                <span className="text-retro-teal mr-2">→</span>
                <span>WebSocket real-time collaboration</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <MarqueeText text="⚡ D3 VISUALIZATION DASHBOARD ⚡ INTERACTIVE DATA EXPLORATION ⚡ REAL-TIME COLLABORATION ⚡" />

      <div className="my-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        {['VISUALIZE', 'ANALYZE', 'COLLABORATE'].map((item, i) => (
          <div key={i} className="retro-card p-6 text-center">
            <h3 className="retro-text text-2xl mb-3 text-retro-purple">{item}</h3>
            <p className="mono-text text-sm">
              {item === 'VISUALIZE' && 'Create and customize statistical visualizations with intuitive controls.'}
              {item === 'ANALYZE' && 'Explore data patterns and distributions with interactive parameters.'}
              {item === 'COLLABORATE' && 'Share and update visualizations in real-time with WebSocket support.'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

**Key Changes:**
- Complete restyling with retro-themed components
- Two-column grid layout on desktop
- Feature cards with retro styling
- MarqueeText for scrolling banner
- Replace plain elements with styled retro components

### 3. DemoPage Component

**Current Implementation:**
```tsx
const DemoPage: React.FC = () => {
  const [mean, setMean] = useState<number>(0);
  const [stdDev, setStdDev] = useState<number>(1);
  // Other state and logic...

  return (
    <section className="visualizer">
      <h2>Normal Distribution Visualizer</h2>

      {/* Connection status indicator */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        {/* Status indicator */}
      </div>

      {/* Parameter controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '20px', justifyContent: 'center' }}>
        {/* Multiple input controls */}
      </div>

      {/* Visualization */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px' }}>
        <NormalDistribution mean={mean} stdDev={stdDev} updatedBy={lastUpdatedBy} />
      </div>

      {/* Data tables */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '20px' }}>
        {/* Multiple data tables */}
      </div>

      {/* Log output */}
      <div style={{
        maxHeight: '200px',
        overflowY: 'auto',
        border: '1px solid var(--light-gray)',
        padding: '10px',
        // Other styles...
      }}>
        {/* Log entries */}
      </div>
    </section>
  );
};
```

**Target Implementation:**
```tsx
const DemoPage: React.FC = () => {
  const [mean, setMean] = useState<number>(0);
  const [stdDev, setStdDev] = useState<number>(1);
  // Other state and logic (preserved)...

  return (
    <div>
      <div className="retro-card p-6 mb-8">
        <h2 className="retro-text text-3xl text-center text-retro-purple mb-6">NORMAL DISTRIBUTION VISUALIZER</h2>

        {/* Connection status indicator */}
        <div className="flex items-center mb-4 mono-text">
          <div
            className={`w-3 h-3 rounded-full mr-2 ${
              wsStatus === 'connected' ? 'bg-retro-teal' :
              wsStatus === 'connecting' ? 'bg-retro-yellow' :
              'bg-retro-pink'
            }`}
          ></div>
          <span>{
            wsStatus === 'connected' ? 'Connected' :
            wsStatus === 'connecting' ? 'Connecting...' :
            'Disconnected'
          }</span>
        </div>

        {/* Parameter controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="flex flex-col">
            <label className="mono-text text-sm font-medium mb-1" htmlFor="mean">Mean (μ)</label>
            <input
              type="number"
              id="mean"
              value={mean}
              onChange={e => setMean(parseFloat(e.target.value))}
              step="0.1"
              className="retro-input"
            />
          </div>

          {/* Other inputs styled similarly */}

          <div className="flex flex-col">
            <label className="mono-text text-sm font-medium mb-1">&nbsp;</label>
            <button
              onClick={updateParameters}
              className="retro-button"
            >
              UPDATE PARAMETERS
            </button>
          </div>

          <div className="flex flex-col">
            <label className="mono-text text-sm font-medium mb-1">&nbsp;</label>
            <button
              onClick={toggleWebSocketConnection}
              className="retro-button"
            >
              {wsStatus === 'connected' ? 'DISCONNECT' : 'CONNECT WEBSOCKET'}
            </button>
          </div>
        </div>

        {/* Visualization */}
        <div className="flex flex-col items-center my-8 border-4 border-black p-4 bg-white">
          <NormalDistribution mean={mean} stdDev={stdDev} updatedBy={lastUpdatedBy} />
        </div>
      </div>

      <MarqueeText text="⚡ PARAMETER VALUES: MEAN = {mean.toFixed(1)} ⚡ STD DEV = {stdDev.toFixed(1)} ⚡" />

      {/* Data tables */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
        <div className="retro-card p-4">
          <h4 className="retro-text text-xl text-retro-purple mb-2 pb-2 border-b-2 border-retro-purple border-dashed">
            PARAMETER TABLE
          </h4>
          <div className="mono-text text-sm">
            {/* Parameter data */}
          </div>
        </div>

        {/* Other data tables styled similarly */}
      </div>

      {/* Log output */}
      <div className="retro-card p-4 font-mono text-sm">
        <h4 className="retro-text text-xl text-retro-purple mb-2 pb-2 border-b-2 border-retro-purple border-dashed">
          SYSTEM LOG
        </h4>
        <div className="max-h-40 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="mb-1 pb-1 border-b border-gray-200 border-dashed">
              <span className="text-gray-500 mr-2">[{log.time}]</span>
              <span className={
                log.type === 'error' ? 'text-retro-pink' :
                log.type === 'success' ? 'text-retro-teal' :
                'text-retro-purple'
              }>
                {log.message}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

**Key Changes:**
- Maintain all state and logic
- Replace inline styles with Tailwind classes
- Apply retro-card and other retro styles to containers
- Use retro-input and retro-button classes
- Add MarqueeText for parameter display
- Improve responsive layout with grid system
- Add retro borders and backgrounds

### 4. NormalDistribution Component

**Current Implementation:**
The D3.js visualization component with a modern, clean design.

**Target Implementation:**
The core D3.js functionality should be preserved, but with these styling changes:

- Replace CSS variables with retro theme colors
- Add retro-style borders and backgrounds
- Use retro typography for labels
- Add pixel-style drop shadows
- Maintain all interactive functionality

**Key Changes:**
- Careful refactoring to preserve the D3.js logic
- Update all color references to use retro theme
- Add retro styling to the SVG container
- Use mono-text and retro-text for labels
- Keep all interactive features working

### 5. New RetroHeader Component

This component doesn't exist in the current application and should be created based on the retro-web-vibes-90s implementation:

```tsx
interface RetroHeaderProps {
  title: string;
  subtitle?: string;
}

const RetroHeader: React.FC<RetroHeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="text-center mb-12 relative">
      <h1 className="pixel-text text-4xl md:text-6xl font-bold text-retro-purple mb-4 text-shadow animate-bounce-slow">
        {title}
      </h1>
      {subtitle && (
        <p className="retro-text text-2xl md:text-3xl text-retro-teal">
          {subtitle}
          <span className="inline-block ml-1 animate-blink">_</span>
        </p>
      )}
      <div className="max-w-sm mx-auto my-6 h-2 bg-gradient-to-r from-retro-pink via-retro-purple to-retro-teal"></div>
    </div>
  );
};
```

### 6. New RetroFooter Component

This component should be created based on the retro-web-vibes-90s implementation:

```tsx
const RetroFooter: React.FC = () => {
  return (
    <footer className="mt-20 text-center">
      <div className="zigzag mb-8"></div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div>
          <h4 className="retro-text text-xl text-retro-teal mb-4">NAVIGATION</h4>
          <ul className="space-y-2 mono-text">
            <li><a href="/" className="hover:text-retro-purple">Home</a></li>
            <li><a href="/demo" className="hover:text-retro-purple">Demo</a></li>
            <li><a href="/about" className="hover:text-retro-purple">About</a></li>
          </ul>
        </div>

        <div>
          <h4 className="retro-text text-xl text-retro-teal mb-4">RESOURCES</h4>
          <ul className="space-y-2 mono-text">
            <li><a href="https://d3js.org/" target="_blank" rel="noopener noreferrer" className="hover:text-retro-purple">D3.js</a></li>
            <li><a href="https://reactjs.org/" target="_blank" rel="noopener noreferrer" className="hover:text-retro-purple">React</a></li>
            <li><a href="https://aws.amazon.com/" target="_blank" rel="noopener noreferrer" className="hover:text-retro-purple">AWS</a></li>
          </ul>
        </div>

        <div>
          <h4 className="retro-text text-xl text-retro-teal mb-4">CONNECT</h4>
          <p className="mono-text mb-2">Join our retro visualization community!</p>
          <div className="flex justify-center space-x-4">
            <a href="#" className="text-retro-purple hover:text-retro-pink text-xl">
              <span>📧</span>
            </a>
            <a href="#" className="text-retro-purple hover:text-retro-pink text-xl">
              <span>💬</span>
            </a>
            <a href="#" className="text-retro-purple hover:text-retro-pink text-xl">
              <span>📱</span>
            </a>
          </div>
        </div>
      </div>

      <p className="mono-text text-sm">
        D3 Visualization Dashboard - © {new Date().getFullYear()} - Deployed via CI/CD Pipeline
      </p>
      <p className="mono-text text-xs mt-2 text-gray-500">
        <span className="animate-blink">►</span> Best viewed with Netscape Navigator <span className="animate-blink">◄</span>
      </p>
    </footer>
  );
};
```

### 7. New MarqueeText Component

This component should be created based on the retro-web-vibes-90s implementation:

```tsx
interface MarqueeTextProps {
  text: string;
}

const MarqueeText: React.FC<MarqueeTextProps> = ({ text }) => {
  return (
    <div className="bg-retro-yellow text-black py-1 overflow-hidden border-y-2 border-black my-8">
      <div className="whitespace-nowrap mono-text font-bold inline-block animate-[marquee_15s_linear_infinite]">
        {Array(5).fill(text).map((item, index) => (
          <span key={index} className="mx-4">{item}</span>
        ))}
      </div>
    </div>
  );
};
```

### 8. New CursorTrail Component

This component should be created based on the retro-web-vibes-90s implementation:

```tsx
const CursorTrail: React.FC = () => {
  const [trail, setTrail] = useState<TrailDot[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [counter, setCounter] = useState(0);

  // Effect hooks for mouse tracking and trail generation...

  return (
    <>
      {trail.map((dot) => (
        <div
          key={dot.id}
          className="cursor-trail"
          style={{
            left: `${dot.x}px`,
            top: `${dot.y}px`,
            width: `${dot.size}px`,
            height: `${dot.size}px`,
          }}
        />
      ))}
    </>
  );
};
```

## UI Element Mapping

Beyond the main components, here are the UI elements that need restyling:

| Current UI Element | Action | Target Style | Notes |
|-------------------|--------|--------------|-------|
| Buttons | Refactor | retro-button class | Purple with deep borders |
| Inputs | Refactor | retro-input class | Black borders, purple focus ring |
| Cards/Sections | Refactor | retro-card class | White background, black border, shadow |
| Typography | Refactor | retro-text, pixel-text, mono-text | Font family changes |
| Colors | Replace | retro color palette | From CSS vars to Tailwind theme |
| Links | Refactor | Hover effects and colors | Color and hover animations |
| Status indicators | Refactor | Retro colors and styling | Maintain functionality |
| Tables | Refactor | Retro-style tables | Maintain data display |

## Implementation Strategy

The recommended approach for implementing this component mapping is:

1. **Setup Phase**
   - Implement the Tailwind configuration
   - Add the required fonts
   - Create the base typography classes
   - Set up the component library foundation

2. **Core Components First**
   - Implement RetroHeader and RetroFooter
   - Create the Layout with RetroPattern
   - Build the UI primitive components (buttons, inputs)

3. **Page Structure Second**
   - Refactor the HomePage with new styling
   - Refactor the ErrorPage with new styling

4. **Complex Components Last**
   - Carefully refactor the DemoPage while preserving functionality
   - Refactor the NormalDistribution component with new styling
   - Add MarqueeText and other decorative elements

5. **Polish and Effects**
   - Add CursorTrail and animations
   - Implement responsive behavior
   - Add final retro touches and effects

## Conclusion

This component mapping document provides a comprehensive plan for migrating the existing react-app components to match the retro-web-vibes-90s styling and architecture. By following this mapping, the migration can be performed systematically while ensuring that the core functionality of the visualization dashboard is preserved.
