# Data Dashboard Visual Design Requirements

## Design Philosophy

### Core Principles
- **Visual Breathing Room**: Generous whitespace creates focus and reduces cognitive load
- **Information Hierarchy**: Size, color, and position guide the eye naturally through data
- **Seamless Flow**: Filter-to-adjustment workflow feels like one continuous action
- **Quiet Interface**: UI elements recede, allowing data to take center stage
- **Purposeful Minimalism**: Every element earns its place through clear utility

## Layout Architecture

### Grid System
- **12-column fluid grid** with 24px gutters
- **Base unit**: 8px for all spacing decisions
- **Container max-width**: 1440px centered with 32px padding
- **Aspect ratios**: 16:9 for primary plot area, golden ratio for supporting elements

### Layout Zones

#### Primary Structure
```
┌─────────────────────────────────────────────────────┐
│                    Header Bar (64px)                 │
├─────────────┬───────────────────────────────────────┤
│             │                                       │
│   Sidebar   │         Plotting Area                │
│   (320px)   │         (Fluid Width)                │
│             │                                       │
├─────────────┴───────────────────────────────────────┤
│              History Feed (240px height)             │
└─────────────────────────────────────────────────────┘
```

#### Responsive Breakpoints
- **Desktop**: 1280px+ (full layout)
- **Tablet**: 768px-1279px (sidebar collapses to overlay)
- **Mobile**: <768px (stacked layout, bottom sheet controls)

## Component Specifications

### 1. Primary Plotting Area

#### Container Properties
- **Background**: Pure white (#FFFFFF)
- **Border**: None - defined by negative space
- **Padding**: 32px all sides
- **Shadow**: None - flat design aesthetic

#### Chart Canvas
- **Aspect Ratio**: 16:9 locked for consistency
- **Grid Lines**: #F3F4F6 at 0.5px weight
- **Axis Lines**: #E5E7EB at 1px weight
- **Data Lines**: 2px weight with anti-aliasing
- **Interactive States**: 10% opacity increase on hover

### 2. Integrated Filter & Adjustment Sidebar

#### Panel Structure
- **Width**: Fixed 320px
- **Height**: Matches plotting area height exactly
- **Background**: #FAFAFA with 100% opacity
- **Border**: Right edge only - 1px solid #E5E7EB
- **Padding**: 24px
- **Overflow**: Visible - content flows naturally

#### Section Hierarchy

##### Filter Section (Top)
- **Height**: Variable based on content
- **Separation**: 1px divider line at #E5E7EB after 16px spacing

##### Adjustment Section (Below Filters)
- **Height**: Variable, extends as needed
- **Visual Connection**: Subtle fade transition from filters
- **Vertical Spacing**: Components stack with consistent 16px gaps

### 3. Filter Components

#### Filter Layout
- **Vertical Spacing**: 12px between individual filters
- **Grouping**: Subtle 24px spacing between logical groups
- **Alignment**: Full width of sidebar minus padding

#### Individual Filters
- **Height**: 40px
- **Background**: White with 1px #E5E7EB border
- **Border Radius**: 6px
- **Padding**: 12px horizontal
- **Label Integration**:
  - Placeholder style when unselected: 14px regular, #9CA3AF
  - Transforms to small label on selection: 11px, #6B7280, positioned top-left at 8px
  - Selected value: 14px medium, #374151
- **Dropdown Indicator**: 12px chevron, right-aligned, #6B7280
- **Active State**: #2563EB border, subtle #F0F9FF background
- **Hover State**: #F9FAFB background, pointer cursor
- **Multi-select**: Inline checkboxes within dropdown menu

#### Filter-to-Adjustment Transition
- **Visual Bridge**: Subtle gradient fade from last filter to adjustment controls
- **Spacing**: 32px gap with centered divider dot pattern

### 4. Adjustment Controls

#### Layout Structure
- **Container**: Centered horizontally within sidebar
- **Background**: White with 1px #E5E7EB border
- **Border Radius**: 8px
- **Padding**: 20px
- **Component Spacing**: 16px vertical gaps

#### Adjustment Value Display
- **Typography**: 28px bold, monospace font
- **Color**: #374151 (neutral), #059669 (positive), #DC2626 (negative)
- **Format**: Always shows sign (+/-) and percentage symbol
- **Alignment**: Center
- **Transition**: 200ms ease-out on value change

#### Increment Controls
- **Layout**: Horizontal, flanking the value display
- **Button Size**: 40px square
- **Background**: White with 1px #E5E7EB border
- **Border Radius**: 6px
- **Icons**: 16px plus/minus symbols, centered
- **Hover State**: #F9FAFB background
- **Active State**: #E5E7EB background
- **Disabled State**: #D1D5DB border, #9CA3AF icon
- **Increment**: Fixed 2.5% per click

#### Save Button
- **Width**: Full width of container
- **Height**: 40px
- **Background**: #2563EB
- **Typography**: 14px medium, white
- **Border Radius**: 6px
- **Hover State**: 10% darker (#1D4ED8)
- **Active State**: 15% darker (#1E40AF)
- **Loading State**: Replace text with 16px spinner
- **Success State**: Brief checkmark icon before returning to default

### 5. History Feed

#### Container
- **Height**: Fixed 240px
- **Background**: #FAFAFA
- **Border Top**: 1px solid #E5E7EB
- **Padding**: 24px
- **Overflow**: Horizontal scroll with subtle fade edges

#### History Cards
- **Width**: 280px
- **Height**: 160px
- **Background**: White
- **Border**: 1px solid #E5E7EB
- **Border Radius**: 8px
- **Shadow**: 0 1px 3px rgba(0,0,0,0.05)
- **Margin**: 16px between cards
- **Padding**: 16px

#### Card Content Structure
- **Timestamp**: Top-right, 12px regular, #9CA3AF
- **Adjustment Value**: Large central display, 24px bold
- **Impact Metrics**: Bottom section, 13px regular
- **User Avatar**: 24px circle, top-left with 2px white border

## Typography System

### Font Family
- **Primary**: Inter, -apple-system, BlinkMacSystemFont, sans-serif
- **Monospace**: 'SF Mono', Consolas, monospace (for data values)

### Type Scale
- **Display**: 32px, bold (chart titles only)
- **Heading**: 20px, semibold (section headers)
- **Body**: 14px, regular (primary content)
- **Caption**: 12px, regular (metadata, timestamps)
- **Micro**: 11px, medium (labels, tags)

### Font Weights
- **Regular**: 400 (body text)
- **Medium**: 500 (emphasis)
- **Semibold**: 600 (headings)
- **Bold**: 700 (data values)

## Color System

### Primary Palette
- **Action Blue**: #2563EB (primary actions, selections)
- **Neutral Grey**: #6B7280 (secondary text, borders)
- **Background**: #FFFFFF (primary), #FAFAFA (secondary)

### Semantic Colors
- **Positive**: #059669 (increases, gains)
- **Negative**: #DC2626 (decreases, losses)
- **Warning**: #F59E0B (caution states)
- **Success**: #10B981 (confirmations)

### Functional Greys
- **50**: #F9FAFB (hover states)
- **100**: #F3F4F6 (dividers)
- **200**: #E5E7EB (borders)
- **300**: #D1D5DB (disabled states)
- **400**: #9CA3AF (placeholder text)
- **500**: #6B7280 (body text)
- **600**: #4B5563 (emphasis text)
- **700**: #374151 (headings)

## Spacing & Measurements

### Spacing Scale
- **4px**: Micro (internal component spacing)
- **8px**: Small (related elements)
- **16px**: Medium (component padding)
- **24px**: Large (section spacing)
- **32px**: Extra large (major sections)
- **48px**: Jumbo (page-level spacing)

### Component Dimensions
- **Button Height**: 40px (standard), 32px (compact)
- **Input Height**: 40px
- **Border Radius**: 6px (small), 8px (medium), 12px (large)
- **Icon Sizes**: 16px (inline), 20px (standalone), 24px (primary)

## Interaction Patterns

### Hover States
- **Timing**: 150ms ease-out transition
- **Color Shift**: 5% darker or lighter depending on base
- **Elevation**: Subtle shadow for clickable elements
- **Cursor**: Pointer for all interactive elements

### Active States
- **Color**: Primary blue or semantic color
- **Contrast**: Ensure 4.5:1 minimum ratio
- **Focus Ring**: 2px offset, primary blue

### Loading States
- **Skeleton Screens**: Animated gradient pulse
- **Spinners**: 20px, 2px stroke, primary blue
- **Progress Bars**: 4px height, rounded ends

### Transitions
- **Micro**: 150ms (hover, focus)
- **Standard**: 200ms (state changes)
- **Smooth**: 300ms (panel slides, expansions)
- **Dramatic**: 500ms (page transitions)

## Visual Hierarchy Principles

### Size Hierarchy
1. **Primary Data**: Largest visual weight (chart plot)
2. **Adjustment Values**: Second-largest (current state)
3. **Controls**: Medium size (interactive elements)
4. **Metadata**: Smallest (timestamps, labels)

### Color Hierarchy
1. **Data Colors**: Most vibrant (chart lines, bars)
2. **Action Colors**: Primary blue for CTAs
3. **Semantic Colors**: For state indication
4. **Neutral Colors**: For structure and text

### Spatial Hierarchy
1. **Center Stage**: Plotting area dominates
2. **Supporting Cast**: Sidebar provides context
3. **Reference**: History feed for comparison

## Accessibility Considerations

### Contrast Requirements
- **Normal Text**: 4.5:1 minimum
- **Large Text**: 3:1 minimum (18px+)
- **UI Elements**: 3:1 minimum
- **Focus Indicators**: 3:1 against adjacent colors

### Focus Management
- **Tab Order**: Logical left-to-right, top-to-bottom
- **Focus Trap**: Modal and dropdown contexts
- **Skip Links**: Hidden but accessible navigation

### Visual Indicators
- **Never rely on color alone**
- **Icons support text labels**
- **Patterns or shapes for data differentiation**
- **Clear hover and focus states**

## Design Tokens

### Border Styles
- **Default**: 1px solid #E5E7EB
- **Focus**: 2px solid #2563EB
- **Error**: 1px solid #DC2626
- **Success**: 1px solid #10B981

### Shadow Definitions
- **Subtle**: 0 1px 3px rgba(0,0,0,0.05)
- **Standard**: 0 2px 8px rgba(0,0,0,0.1)
- **Elevated**: 0 4px 16px rgba(0,0,0,0.15)
- **Floating**: 0 8px 24px rgba(0,0,0,0.2)

### Animation Curves
- **Ease-out**: cubic-bezier(0.0, 0, 0.2, 1)
- **Ease-in-out**: cubic-bezier(0.4, 0, 0.2, 1)
- **Spring**: cubic-bezier(0.34, 1.56, 0.64, 1)

## Implementation Notes

### Performance Considerations
- Minimize repaints during adjustments
- Debounce slider updates at 100ms
- Virtualize history feed for smooth scrolling
- Lazy load historical adjustment cards

### Browser Support
- Target modern evergreen browsers
- Graceful degradation for older versions
- Progressive enhancement for advanced features
- Test across Chrome, Safari, Firefox, Edge

### Responsive Behavior
- Sidebar transforms to modal overlay on tablet
- Bottom sheet pattern for mobile adjustments
- Touch-friendly 44px minimum tap targets
- Swipe gestures for history navigation

## Quality Checklist

### Visual Consistency
- [ ] All similar elements share exact specifications
- [ ] Spacing follows 8px grid system
- [ ] Colors from defined palette only
- [ ] Typography follows established scale

### Functional Clarity
- [ ] Every control has clear affordance
- [ ] States are visually distinct
- [ ] Feedback is immediate and clear
- [ ] Errors are gracefully handled

### Aesthetic Balance
- [ ] Whitespace creates visual breathing room
- [ ] Elements align to consistent grid
- [ ] Visual weight is properly distributed
- [ ] Nothing feels cramped or sparse
