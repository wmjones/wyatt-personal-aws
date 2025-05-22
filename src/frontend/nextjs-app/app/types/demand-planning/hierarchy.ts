/**
 * Types for hierarchical data structures in the demand planning dashboard
 */

// Common hierarchy node interface
export interface HierarchyNode {
  id: string;
  name: string;
  level: number;
  parentId: string | null;
  children?: HierarchyNode[];
  metadata?: Record<string, unknown>;
}

// Geography hierarchy
export interface GeographyNode extends HierarchyNode {
  type: 'region' | 'country' | 'state' | 'dma';
  code?: string;
}

// Product hierarchy
export interface ProductNode extends HierarchyNode {
  type: 'category' | 'subcategory' | 'product';
  sku?: string;
}

// Customer hierarchy
export interface CustomerNode extends HierarchyNode {
  type: 'segment' | 'account' | 'customer';
  accountId?: string;
}

// Campaign hierarchy
export interface CampaignNode extends HierarchyNode {
  type: 'campaign-type' | 'campaign' | 'initiative';
  startDate?: string;
  endDate?: string;
}

// Unified hierarchy type
export type HierarchyType = 'geography' | 'product' | 'customer' | 'campaign';

// Type guard for checking node types
export function isGeographyNode(node: HierarchyNode): node is GeographyNode {
  return 'type' in node &&
    ['region', 'country', 'state', 'dma'].includes((node as GeographyNode).type);
}

export function isProductNode(node: HierarchyNode): node is ProductNode {
  return 'type' in node &&
    ['category', 'subcategory', 'product'].includes((node as ProductNode).type);
}

export function isCustomerNode(node: HierarchyNode): node is CustomerNode {
  return 'type' in node &&
    ['segment', 'account', 'customer'].includes((node as CustomerNode).type);
}

export function isCampaignNode(node: HierarchyNode): node is CampaignNode {
  return 'type' in node &&
    ['campaign-type', 'campaign', 'initiative'].includes((node as CampaignNode).type);
}

// Hierarchy selection state
export interface HierarchySelection {
  type: HierarchyType;
  selectedNodes: string[]; // Array of node IDs
}
