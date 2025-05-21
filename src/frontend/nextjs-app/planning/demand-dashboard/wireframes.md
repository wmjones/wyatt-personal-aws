# Demand Planning Dashboard Wireframes

## Layout Structure

The dashboard follows a main layout with persistent header, collapsible sidebar, and tabbed content area.

```
┌────────────────────────────────────────────────────────────────┐
│ Header: Logo, Time Period Controls, Refresh, User Menu         │
├────────┬───────────────────────────────────────────────────────┤
│        │                                                       │
│        │ Tab Navigation: Forecast | History | Settings         │
│        │                                                       │
│        │ ┌───────────────────────────────────────────────────┐ │
│        │ │                                                   │ │
│ H      │ │                                                   │ │
│ i      │ │                                                   │ │
│ e      │ │           Main Content Area                       │ │
│ r      │ │                                                   │ │
│ a      │ │                                                   │ │
│ r      │ │                                                   │ │
│ c      │ │                                                   │ │
│ h      │ │                                                   │ │
│ y      │ │                                                   │ │
│        │ └───────────────────────────────────────────────────┘ │
│        │                                                       │
├────────┴───────────────────────────────────────────────────────┤
│ Footer: Copyright, Version, Links                              │
└────────────────────────────────────────────────────────────────┘
```

## Main Dashboard Screen (Forecast Tab)

```
┌────────────────────────────────────────────────────────────────┐
│ [Logo] Demand Planning Dashboard  [Time: Q1 2025 ▼] [↻] [User ▼]│
├────────┬───────────────────────────────────────────────────────┤
│ Hierarchy │ [Forecast] | History | Settings                     │
│ ─────── │ ┌───────────────────────────────────────────────────┐ │
│ 🔍 Search │ │              Forecast Visualization              │ │
│        │ │    ┌─────────────────────────────────────────┐    │ │
│ Type:  │ │    │                                         │    │ │
│ [Geography▼] │    │             Line Chart:                  │    │ │
│        │ │    │        Baseline vs Adjusted Forecast     │    │ │
│ ☐ Region │ │    │               Over Time                  │    │ │
│  ├─☐ East │ │    │                                         │    │ │
│  │ ├─☐ NE │ │    └─────────────────────────────────────────┘    │ │
│  │ └─☐ SE │ │                                                   │ │
│  ├─☐ West │ │ Selected: Region: East, Products: A, B            │ │
│  │ └─☑ SW │ │                                                   │ │
│  └─☐ Central │ ├───────────────────────────────────────────────────┤ │
│        │ │ Adjustment Controls                                 │ │
│ Type:  │ │ ┌─────────────────┐ ┌─────────────────┐ ┌───────────┐ │ │
│ [Product▼] │ │  Type: [▼ %]    │ │ Value: [  5   ] │ │Time: [▼]  │ │ │
│        │ │ └─────────────────┘ └─────────────────┘ └───────────┘ │ │
│ ☐ Cat A │ │ Reason: [▼ Promotion]    Notes: [____________]      │ │
│  ├─☑ Prod A │ │                                                   │ │
│  └─☑ Prod B │ │ [    Apply Adjustment    ]  [   Reset Changes   ] │ │
│        │ │                                                   │ │
│ Selected: │ │ Impact Summary:                                  │ │
│ [SW] [Prod A] │ │ Baseline Total: 10,500 units                     │ │
│ [Prod B] │ │ Adjusted Total: 11,025 units (+5%)                │ │
│        │ │                                                   │ │
│ [Clear All] │ └───────────────────────────────────────────────────┘ │
├────────┴───────────────────────────────────────────────────────┤
│ © 2025 Company Name | v1.0.0                                   │
└────────────────────────────────────────────────────────────────┘
```

## History Tab

```
┌────────────────────────────────────────────────────────────────┐
│ [Logo] Demand Planning Dashboard  [Time: Q1 2025 ▼] [↻] [User ▼]│
├────────┬───────────────────────────────────────────────────────┤
│ Hierarchy │ Forecast | [History] | Settings                     │
│ ─────── │ ┌───────────────────────────────────────────────────┐ │
│ 🔍 Search │ │ Filters: [Date Range ▼] [Hierarchy ▼] [Type ▼] [🔍] │ │
│        │ │                                                   │ │
│        │ │ ┌─────┬────────┬─────────┬────────┬────────┬─────┐ │ │
│        │ │ │ Date│ Region │ Products│ Change │ Reason │ User│ │ │
│        │ │ ├─────┼────────┼─────────┼────────┼────────┼─────┤ │ │
│        │ │ │5/15 │ East   │ Prod A  │ +10%   │ Promo  │ JD  │ │ │
│        │ │ │5/14 │ West   │ Prod B  │ -5%    │ Weather│ AS  │ │ │
│        │ │ │5/12 │ Central│ Prod C  │ +7%    │ Trend  │ JD  │ │ │
│        │ │ │ ... │ ...    │ ...     │ ...    │ ...    │ ... │ │ │
│        │ │ └─────┴────────┴─────────┴────────┴────────┴─────┘ │ │
│        │ │                                                   │ │
│        │ │ ┌───────────────────────────────────────────────┐ │ │
│        │ │ │                                               │ │ │
│        │ │ │   Impact Analysis Chart: Historical Changes   │ │ │
│        │ │ │                                               │ │ │
│        │ │ └───────────────────────────────────────────────┘ │ │
│        │ │                                                   │ │
│        │ │ Total Adjustments: 34                             │ │
│        │ │ Net Impact: +2.3% ($1.2M)                         │ │
│        │ │                                                   │ │
│        │ └───────────────────────────────────────────────────┘ │
├────────┴───────────────────────────────────────────────────────┤
│ © 2025 Company Name | v1.0.0                                   │
└────────────────────────────────────────────────────────────────┘
```

## Hierarchy Selection Interface Detail

```
┌───────────────────┐
│ Type: [Geography▼]│
│                   │
│ 🔍 [Search...]     │
│                   │
│ ☐ All Regions     │
│  ├─☐ East         │
│  │ ├─☐ Northeast  │
│  │ │ ├─☑ NY       │
│  │ │ ├─☑ MA       │
│  │ │ └─☐ CT       │
│  │ └─☐ Southeast  │
│  │   ├─☐ FL       │
│  │   ├─☐ GA       │
│  │   └─☐ NC       │
│  └─☐ West         │
│    ├─☐ Northwest  │
│    │ ├─☐ WA       │
│    │ └─☐ OR       │
│    └─☐ Southwest  │
│      ├─☑ CA       │
│      ├─☐ AZ       │
│      └─☐ NV       │
│                   │
│ Selected:         │
│ [NY] [MA] [CA]    │
│                   │
│ [Clear All]       │
└───────────────────┘
```

## Adjustment Modal

```
┌─────────────────────────────────────────────────┐
│ Apply Forecast Adjustment                    [×] │
├─────────────────────────────────────────────────┤
│                                                 │
│ Selected Hierarchies:                           │
│ - Geography: Northeast (NY, MA)                 │
│ - Products: Category A (Products 1, 2)          │
│                                                 │
│ Time Period:                                    │
│ [▼ All periods] [or] [▼ Q2 2025] [to] [▼ Q4 2025]│
│                                                 │
│ Adjustment Type:                                │
│ (○) Percentage  ( ) Absolute Value              │
│                                                 │
│ Adjustment Value:                               │
│ [   5   ] %                                     │
│                                                 │
│ Reason:                                         │
│ [▼ Select reason...]                            │
│   Marketing Campaign                            │
│   Product Performance                           │
│   Economic Trends                               │
│   Weather Impact                                │
│   Supply Chain Issues                           │
│   Custom...                                     │
│                                                 │
│ Notes:                                          │
│ [                                           ]   │
│ [                                           ]   │
│                                                 │
│ Preview impact:                                 │
│ - Before: 10,500 units                          │
│ - After:  11,025 units (+525)                   │
│                                                 │
│ [    Cancel    ]        [    Apply    ]         │
└─────────────────────────────────────────────────┘
```

## Apple OSX Aesthetic with Chick-fil-A Colors

### Color Palette
- Primary: #E51636 (Chick-fil-A Red)
- Secondary: #004F71 (Chick-fil-A Blue)
- Accent: #E4002B (Bright Red)
- Background: #F5F5F7 (Light Gray, Apple-like)
- Surface: #FFFFFF (White)
- Border: #D2D2D7 (Light Gray, Apple-like)
- Text Primary: #1D1D1F (Almost Black, Apple-like)
- Text Secondary: #86868B (Medium Gray, Apple-like)

### Typography
- System font stack: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif
- Headings: Light weight
- Body: Regular weight
- Size scale following Apple's patterns

### UI Elements
- Subtle shadows
- Rounded corners (8px radius)
- Minimal borders
- Translucent surfaces
- Clean iconography
- Generous whitespace
