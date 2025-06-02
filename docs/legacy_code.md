1. Hierarchy System (Major Legacy Feature)

  - HierarchySidebar.tsx - Unused component
  - useHierarchy.ts - Unused hook
  - selectedHierarchies state in both page components marked as "backward compatibility"
  - HierarchySelection type still passed around but appears to be replaced by the filter system

  2. Duplicate Page Implementations

  - page.tsx vs page-refactored.tsx - Two versions of the same page
  - useForecast.ts vs useForecastRefactored.ts - Two versions of the same hook
  - FilterSidebar.tsx vs FilterSidebarRefactored.tsx - Two versions of the filter component

  3. Time Period System (Partially Legacy)

  - timePeriodIds / selectedTimePeriods - Replaced by DateRangeFilter but kept for backward compatibility
  - No UI to actually select time periods anymore

  4. Unused State and Props

  - availableDateRange - Fetched but never used
  - historyError - Fetched but never used
  - setSelectedHierarchies - Declared but never used
  - setSelectedTimePeriods - Declared but never used

  5. BaseChart Legacy Code

  - showTooltip and hideTooltip functions defined but never used
  - margin prop defined but marked as unused

  6. Type Re-exports for Backward Compatibility

  - FilterOption type in SingleSelectFilter is just a re-export of DropdownOption

  7. Unused Documentation

  - Multiple README files in the components directory that might be outdated

  The codebase appears to be in a transitional state where:
  - The hierarchy system has been replaced by the filter system
  - Time period selection has been replaced by date range selection
  - There are duplicate implementations of major components
  - Legacy props and state are kept for backward compatibility but not actively used

  This suggests an incomplete refactoring where new features were added but old code wasn't fully removed.
