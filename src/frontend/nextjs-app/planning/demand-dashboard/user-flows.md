# Demand Planning Dashboard User Flows

This document outlines the key user interaction flows for the Demand Planning Dashboard.

## 1. Hierarchical Selection Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Select         │     │  Navigate       │     │  Select         │
│  Hierarchy Type ├────►│  Tree Structure ├────►│  Nodes          │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
┌─────────────────┐     ┌─────────────────┐     ┌────────▼────────┐
│  View           │     │  Remove         │     │  See Selected   │
│  Forecast       │◄────┤  Selections     │◄────┤  Nodes as Tags  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Steps:
1. User selects a hierarchy type (Geography, Product, Customer, Campaign)
2. User navigates through the hierarchical tree structure
3. User selects one or more nodes at different levels (multi-select)
4. Selected nodes appear as tags in the "Selected" section
5. User can remove selections by clicking on the tags
6. Forecast view updates based on the selected hierarchies

## 2. Forecast Adjustment Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Select         │     │  Configure      │     │  Enter          │
│  Hierarchies    ├────►│  Adjustment     ├────►│  Adjustment     │
└─────────────────┘     │  Parameters     │     │  Value          │
                        └─────────────────┘     └────────┬────────┘
                                                         │
┌─────────────────┐     ┌─────────────────┐     ┌────────▼────────┐
│  View Updated   │     │  Apply          │     │  Add Reason     │
│  Forecast       │◄────┤  Adjustment     │◄────┤  and Notes      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Steps:
1. User selects hierarchies to adjust (must have at least one selection)
2. User configures adjustment parameters:
   - Type (percentage or absolute)
   - Time periods to adjust
3. User enters the adjustment value
4. User selects a reason and adds optional notes
5. User applies the adjustment
6. Forecast visualization updates to reflect changes

## 3. Viewing Adjustment History Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Navigate to    │     │  Set Filter     │     │  Sort by        │
│  History Tab    ├────►│  Parameters     ├────►│  Column         │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
┌─────────────────┐     ┌─────────────────┐     ┌────────▼────────┐
│  View Detailed  │     │  Export         │     │  Browse         │
│  Adjustment     │◄────┤  History Data   │◄────┤  Results        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Steps:
1. User navigates to the History tab
2. User sets filter parameters (date range, hierarchy, reason, user)
3. User sorts the results by clicking on column headers
4. User browses through the filtered, sorted adjustment history
5. User can export the history data for further analysis
6. User can click on an adjustment to view detailed information

## 4. Time Period Selection Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Click Time     │     │  Select Time    │     │  Choose         │
│  Period Control ├────►│  Granularity    ├────►│  Specific       │
└─────────────────┘     └─────────────────┘     │  Periods        │
                                                └────────┬────────┘
                                                         │
                        ┌─────────────────┐     ┌────────▼────────┐
                        │  Update         │◄────┤  Apply Time     │
                        │  Visualizations │     │  Selection      │
                        └─────────────────┘     └─────────────────┘
```

### Steps:
1. User clicks on the time period control in the header
2. User selects time granularity (weekly, monthly, quarterly)
3. User chooses specific time periods to view
4. User applies the time selection
5. All visualizations update to reflect the selected time periods

## 5. Dashboard Navigation Flow

```
┌─────────────────┐     ┌─────────────────┐
│  Initial        │     │  Select Tab     │
│  Dashboard Load ├────►│  (Forecast,     │
└─────────────────┘     │   History,      │
                        │   Settings)     │
                        └────────┬────────┘
                                 │
                                 ▼
          ┌─────────────────────┬─────────────────────┐
          │                     │                     │
┌─────────▼────────┐  ┌─────────▼────────┐  ┌─────────▼────────┐
│  Forecast View   │  │  History View    │  │  Settings View   │
│  - Charts        │  │  - Table         │  │  - Preferences   │
│  - Adjustments   │  │  - Filters       │  │  - User Options  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Steps:
1. Dashboard loads with default view (Forecast)
2. User can select different tabs:
   - Forecast: View and adjust forecast data
   - History: View adjustment history
   - Settings: Configure dashboard preferences
3. Each view provides its own unique functionality and interface

## 6. Data Refresh Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Click Refresh  │     │  Show Loading   │     │  Fetch Latest   │
│  Button         ├────►│  Indicator      ├────►│  Data           │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                        ┌─────────────────┐     ┌────────▼────────┐
                        │  Display        │◄────┤  Process        │
                        │  Updated Data   │     │  Response       │
                        └─────────────────┘     └─────────────────┘
```

### Steps:
1. User clicks the refresh button in the header
2. Loading indicator appears
3. Dashboard fetches the latest data from the API
4. Response is processed
5. UI updates to display the refreshed data

## 7. Mobile Adaptation Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Access         │     │  Collapse       │     │  Tap Menu       │
│  Dashboard      ├────►│  Sidebar        ├────►│  Button to      │
│  on Mobile      │     │  Automatically  │     │  Show Sidebar   │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
┌─────────────────┐     ┌─────────────────┐     ┌────────▼────────┐
│  Interact with  │     │  Tap Outside    │     │  Interact with  │
│  Main Content   │◄────┤  to Dismiss     │◄────┤  Sidebar        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Steps:
1. User accesses the dashboard on a mobile device
2. Sidebar is automatically collapsed
3. User taps the menu button to show the sidebar
4. User interacts with the hierarchy selection in the sidebar
5. User taps outside the sidebar to dismiss it
6. User continues to interact with the main content area

## 8. Accessibility Navigation Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Tab Navigation │     │  Use Arrow Keys │     │  Activate       │
│  Through UI     ├────►│  Within         ├────►│  Controls with  │
│  Elements       │     │  Components     │     │  Enter/Space    │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
┌─────────────────┐     ┌─────────────────┐     ┌────────▼────────┐
│  Navigate to    │     │  Escape to      │     │  Receive        │
│  Next Section   │◄────┤  Close Dialogs  │◄────┤  Feedback       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Steps:
1. User navigates through UI elements using Tab key
2. User uses arrow keys to navigate within components (e.g., tree view)
3. User activates controls with Enter or Space keys
4. User receives visual and screen reader feedback for actions
5. User can close dialogs with Escape key
6. User continues tabbing to navigate to the next section
