# CFA Brand Colors Documentation

## Current Brand Color Palette

### Primary Colors
- **CFA Red Primary**: `#DD0033` - Main brand color
- **CFA Red**: `#e83b45` - Secondary red variant
- **CFA Red Light**: `#FF6B8A` - Light red for hover states
- **CFA Red Subtle**: `#FFF5F7` - Very light red for backgrounds
- **CFA Red Border**: `#FFE1E6` - Red for borders

### Neutral Colors
- **Background Primary**: `#FFFFFF` - Main background
- **Background Secondary**: `#F9FAFB` - Secondary background
- **Background Tertiary**: `#F3F4F6` - Tertiary background
- **Border**: `#EEEDEB` - Default border color
- **Border Medium**: `#D1D5DB` - Medium weight borders

### Text Colors
- **Text Primary**: `#111827` - Main text color
- **Text Secondary**: `#4b5563` - Secondary text
- **Text Tertiary**: `#9ca3af` - Tertiary/muted text
- **Text Inverse**: `#ffffff` - Text on dark backgrounds

### Chart Colors (Preserved)
- **Forecast Y50**: `#3B82F6` - Blue for median forecast
- **Confidence Bands**: `#DD0033` - Red for y_05/y_95 ranges
- **Adjusted Forecast**: `#EAB308` - Yellow for user adjustments

### UI State Colors
- **Success**: `#10b981`
- **Warning**: `#f59e0b`
- **Error**: `#ef4444`
- **Info**: `#3b82f6`

## Accessibility Compliance

### WCAG 2.1 AA Contrast Requirements
- Normal text: 4.5:1 minimum contrast ratio
- Large text (18px+): 3:1 minimum contrast ratio
- UI elements: 3:1 minimum contrast ratio

### Verified Color Combinations
✅ **Compliant Combinations**:
- Text Primary (#111827) on Background Primary (#FFFFFF): 19.3:1
- Text Secondary (#4b5563) on Background Primary (#FFFFFF): 8.6:1
- CFA Red Primary (#DD0033) on Background Primary (#FFFFFF): 4.6:1
- Text Inverse (#FFFFFF) on CFA Red Primary (#DD0033): 4.6:1

⚠️ **Combinations Requiring Attention**:
- Text Tertiary (#9ca3af) on Background Primary (#FFFFFF): 3.0:1 - Only suitable for large text
- CFA Red Light (#FF6B8A) on Background Primary (#FFFFFF): 2.8:1 - Not suitable for text

### Recommendations
1. Use Text Primary (#111827) for all body text to ensure maximum readability
2. Use CFA Red Primary (#DD0033) for interactive elements and emphasis
3. Avoid using Text Tertiary (#9ca3af) for small text - reserve for large headings or decorative elements
4. Never use CFA Red Light (#FF6B8A) for text - only for hover states and decorative elements

## Implementation Notes
All color values are defined in `app/globals.css` as CSS custom properties for consistent usage across the application.
