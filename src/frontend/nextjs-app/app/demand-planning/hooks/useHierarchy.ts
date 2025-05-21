'use client';

import { useState, useEffect } from 'react';
import { HierarchyNode, HierarchyType } from '@/app/types/demand-planning';

interface UseHierarchyProps {
  initialType?: HierarchyType;
}

export default function useHierarchy({ initialType = 'geography' }: UseHierarchyProps = {}) {
  const [hierarchyType, setHierarchyType] = useState<HierarchyType>(initialType);
  const [isLoading, setIsLoading] = useState(false);
  const [hierarchyData, setHierarchyData] = useState<HierarchyNode[]>([]);
  const [selectedNodes, setSelectedNodes] = useState<Record<string, boolean>>({});

  // Mock data - would be fetched from API in a real implementation
  useEffect(() => {
    const fetchHierarchyData = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock data based on hierarchy type
        let mockData: HierarchyNode[] = [];
        
        switch (hierarchyType) {
          case 'geography':
            mockData = [
              { id: 'region-1', name: 'East', level: 0, parentId: null },
              { id: 'region-1-1', name: 'Northeast', level: 1, parentId: 'region-1' },
              { id: 'region-1-1-1', name: 'NY', level: 2, parentId: 'region-1-1' },
              { id: 'region-1-1-2', name: 'MA', level: 2, parentId: 'region-1-1' },
              { id: 'region-1-2', name: 'Southeast', level: 1, parentId: 'region-1' },
              { id: 'region-1-2-1', name: 'FL', level: 2, parentId: 'region-1-2' },
              { id: 'region-2', name: 'West', level: 0, parentId: null },
              { id: 'region-2-1', name: 'Southwest', level: 1, parentId: 'region-2' },
              { id: 'region-2-1-1', name: 'CA', level: 2, parentId: 'region-2-1' },
            ];
            break;
          case 'product':
            mockData = [
              { id: 'category-1', name: 'Electronics', level: 0, parentId: null },
              { id: 'category-1-1', name: 'Computers', level: 1, parentId: 'category-1' },
              { id: 'category-1-1-1', name: 'Laptops', level: 2, parentId: 'category-1-1' },
              { id: 'category-1-1-2', name: 'Desktops', level: 2, parentId: 'category-1-1' },
              { id: 'category-2', name: 'Home', level: 0, parentId: null },
              { id: 'category-2-1', name: 'Kitchen', level: 1, parentId: 'category-2' },
              { id: 'category-2-1-1', name: 'Appliances', level: 2, parentId: 'category-2-1' },
            ];
            break;
          case 'customer':
            mockData = [
              { id: 'segment-1', name: 'Retail', level: 0, parentId: null },
              { id: 'segment-1-1', name: 'Department Stores', level: 1, parentId: 'segment-1' },
              { id: 'segment-1-1-1', name: 'Store A', level: 2, parentId: 'segment-1-1' },
              { id: 'segment-2', name: 'Wholesale', level: 0, parentId: null },
              { id: 'segment-2-1', name: 'Distributors', level: 1, parentId: 'segment-2' },
              { id: 'segment-2-1-1', name: 'Distributor X', level: 2, parentId: 'segment-2-1' },
            ];
            break;
          case 'campaign':
            mockData = [
              { id: 'campaign-type-1', name: 'Seasonal', level: 0, parentId: null },
              { id: 'campaign-type-1-1', name: 'Summer', level: 1, parentId: 'campaign-type-1' },
              { id: 'campaign-type-1-1-1', name: 'Beach Promo', level: 2, parentId: 'campaign-type-1-1' },
              { id: 'campaign-type-2', name: 'Product Launch', level: 0, parentId: null },
              { id: 'campaign-type-2-1', name: 'New Electronics', level: 1, parentId: 'campaign-type-2' },
            ];
            break;
          default:
            mockData = [];
        }
        
        setHierarchyData(mockData);
      } catch (error) {
        console.error('Error fetching hierarchy data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHierarchyData();
  }, [hierarchyType]);
  
  // Build tree structure from flat data
  const buildTree = (nodes: HierarchyNode[], parentId: string | null = null): HierarchyNode[] => {
    return nodes
      .filter(node => node.parentId === parentId)
      .map(node => ({
        ...node,
        children: buildTree(nodes, node.id)
      }));
  };
  
  const treeData = buildTree(hierarchyData);
  
  // Handle node selection
  const selectNode = (nodeId: string) => {
    setSelectedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };
  
  // Select all nodes
  const selectAll = () => {
    const allSelected = hierarchyData.reduce((acc, node) => {
      acc[node.id] = true;
      return acc;
    }, {} as Record<string, boolean>);
    
    setSelectedNodes(allSelected);
  };
  
  // Clear all selections
  const clearAll = () => {
    setSelectedNodes({});
  };
  
  // Get array of selected node IDs
  const getSelectedNodeIds = (): string[] => {
    return Object.entries(selectedNodes)
      .filter(([, selected]) => selected)
      .map(([id]) => id);
  };
  
  // Get array of selected node objects
  const getSelectedNodes = (): HierarchyNode[] => {
    return hierarchyData.filter(node => selectedNodes[node.id]);
  };
  
  return {
    hierarchyType,
    setHierarchyType,
    isLoading,
    hierarchyData,
    treeData,
    selectedNodes,
    selectNode,
    selectAll,
    clearAll,
    getSelectedNodeIds,
    getSelectedNodes,
  };
}