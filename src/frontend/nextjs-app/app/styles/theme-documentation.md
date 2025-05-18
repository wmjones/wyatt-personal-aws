# Theme Documentation

This document describes the CSS custom properties (variables) and theming system used in the D3 Dashboard application.

## CSS Custom Properties

All theme variables are defined as CSS custom properties in `app/globals.css`. The variables are scoped to `:root` for light mode and `.dark` for dark mode.

### Color Variables

| Variable | Description | Light Mode | Dark Mode |
|----------|-------------|------------|-----------|
| `--background` | Main background color | `#ffffff` | `#0a0a0a` |
| `--foreground` | Main text color | `#0a0a0a` | `#ededed` |
| `--card` | Card background color | `#ffffff` | `#1a1a1a` |
| `--card-foreground` | Card text color | `#0a0a0a` | `#ededed` |
| `--primary` | Primary brand color | `#0070f3` | `#0098ff` |
| `--primary-foreground` | Text on primary color | `#ffffff` | `#000000` |
| `--secondary` | Secondary color | `#f0f0f0` | `#2a2a2a` |
| `--secondary-foreground` | Text on secondary color | `#0a0a0a` | `#ededed` |
| `--muted` | Muted backgrounds | `#f6f6f6` | `#2a2a2a` |
| `--muted-foreground` | Muted text | `#666666` | `#999999` |
| `--accent` | Accent color | `#7928ca` | `#ff0080` |
| `--accent-foreground` | Text on accent color | `#ffffff` | `#ffffff` |
| `--border` | Border color | `#e1e1e1` | `#2a2a2a` |
| `--input` | Input border color | `#e1e1e1` | `#2a2a2a` |
| `--ring` | Focus ring color | `#0070f3` | `#0098ff` |
| `--warning` | Warning state color | `#f5a623` | `#f5a623` |
| `--error` | Error state color | `#e00` | `#e00` |
| `--success` | Success state color | `#00a050` | `#00a050` |

### Spacing Variables

| Variable | Value | Usage |
|----------|-------|-------|
| `--spacing-0` | `0px` | No spacing |
| `--spacing-1` | `0.25rem` | Extra small spacing |
| `--spacing-2` | `0.5rem` | Small spacing |
| `--spacing-3` | `0.75rem` | Medium-small spacing |
| `--spacing-4` | `1rem` | Base spacing |
| `--spacing-5` | `1.25rem` | Medium spacing |
| `--spacing-6` | `1.5rem` | Medium-large spacing |
| `--spacing-8` | `2rem` | Large spacing |
| `--spacing-10` | `2.5rem` | Extra large spacing |
| `--spacing-12` | `3rem` | XX large spacing |
| `--spacing-16` | `4rem` | XXX large spacing |
| `--spacing-20` | `5rem` | XXXX large spacing |
| `--spacing-24` | `6rem` | XXXXX large spacing |

### Typography Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `--font-sans` | System fonts + Geist Sans | Sans-serif font stack |
| `--font-mono` | Monospace fonts + Geist Mono | Monospace font stack |
| `--font-size-xs` | `0.75rem` | Extra small text |
| `--font-size-sm` | `0.875rem` | Small text |
| `--font-size-base` | `1rem` | Base text size |
| `--font-size-lg` | `1.125rem` | Large text |
| `--font-size-xl` | `1.25rem` | Extra large text |
| `--font-size-2xl` | `1.5rem` | 2X large text |
| `--font-size-3xl` | `1.875rem` | 3X large text |
| `--font-size-4xl` | `2.25rem` | 4X large text |
| `--font-size-5xl` | `3rem` | 5X large text |

### Border Radius Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `--radius` | `0.5rem` | Base radius value |
| `--radius-none` | `0px` | No border radius |
| `--radius-sm` | `calc(var(--radius) - 4px)` | Small radius |
| `--radius-md` | `calc(var(--radius) - 2px)` | Medium radius |
| `--radius-lg` | `var(--radius)` | Large radius (default) |
| `--radius-xl` | `calc(var(--radius) + 4px)` | Extra large radius |
| `--radius-2xl` | `calc(var(--radius) + 8px)` | 2X large radius |
| `--radius-3xl` | `calc(var(--radius) + 16px)` | 3X large radius |
| `--radius-full` | `9999px` | Full radius (circles) |

### Animation Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `--animate-fade-in` | `fade-in 0.5s ease-out` | Fade in animation |
| `--animate-slide-up` | `slide-up 0.3s ease-out` | Slide up animation |
| `--animate-spin` | `spin 1s linear infinite` | Spinning animation |

## Usage with Tailwind CSS v4

All these CSS variables are mapped to Tailwind utilities through the `@theme inline` directive. This allows you to use them in your components like:

```jsx
// Colors
<div className="bg-primary text-primary-foreground">Primary button</div>
<div className="bg-muted text-muted-foreground">Muted text</div>

// Spacing
<div className="p-4 m-8">Padded and margined content</div>

// Typography
<h1 className="text-4xl font-sans">Large heading</h1>
<code className="text-sm font-mono">Code snippet</code>

// Border radius
<div className="rounded-lg">Card with large radius</div>
<div className="rounded-full">Circle element</div>

// Animations
<div className="animate-[fade-in_1s_ease-out]">Fading in element</div>
```

## Theme Switching

Dark mode is supported through the `.dark` class on the root HTML element. When this class is present, all the dark mode color values are applied automatically.

### Implementation Example

```jsx
// ThemeProvider component
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

## Best Practices

1. **Always use CSS variables** for colors instead of hard-coded values
2. **Use semantic color names** (e.g., `primary`, `secondary`) rather than color values
3. **Maintain consistency** by using the spacing scale for all margins and padding
4. **Test in both themes** to ensure proper contrast and readability
5. **Document new variables** when adding custom properties

## Adding New Variables

To add new CSS variables:

1. Add the variable to both `:root` (light) and `.dark` (dark) selectors
2. Map it in the `@theme inline` block if you want Tailwind utility classes
3. Document the variable in this file
4. Test in both light and dark modes

Example:
```css
:root {
  --new-color: #hexvalue;
}

.dark {
  --new-color: #darkvalue;
}

@theme inline {
  --color-new: var(--new-color);
}
```
