/**
 * Query key factory for dropdown-related queries
 * Ensures consistent key generation across the application
 */

export const dropdownKeys = {
  all: ['dropdownOptions'] as const,

  // State options
  states: () => [...dropdownKeys.all, 'states'] as const,

  // DMA options (can be filtered by state)
  dmas: (filters?: { stateId?: string }) =>
    [...dropdownKeys.all, 'dmas', filters || {}] as const,

  // DC options (can be filtered by state or DMA)
  dcs: (filters?: { stateId?: string; dmaId?: string }) =>
    [...dropdownKeys.all, 'dcs', filters || {}] as const,

  // Inventory item options
  inventoryItems: () => [...dropdownKeys.all, 'inventoryItems'] as const,

  // Restaurant options
  restaurants: () => [...dropdownKeys.all, 'restaurants'] as const,
}
