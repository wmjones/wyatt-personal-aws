'use client';

import { useState } from 'react';
import { HierarchyType, HierarchyNode } from '@/app/types/demand-planning';

interface HierarchySidebarProps {
  onSelectionChange: (selections: { type: HierarchyType; nodeIds: string[] }) => void;
}

export default function HierarchySidebar({ onSelectionChange }: HierarchySidebarProps) {
  const [activeType, setActiveType] = useState<HierarchyType>('geography');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNodes, setSelectedNodes] = useState<Record<string, boolean>>({});

  // Demo hierarchy data
  const hierarchyTypes: { id: HierarchyType; label: string }[] = [
    { id: 'geography', label: 'Geography' },
    { id: 'product', label: 'Product' },
    { id: 'customer', label: 'Customer' },
    { id: 'campaign', label: 'Campaign' },
  ];

  // Demo geography nodes
  const demoNodes: HierarchyNode[] = [
    { id: 'region-1', name: 'East', level: 0, parentId: null },
    { id: 'region-1-1', name: 'Northeast', level: 1, parentId: 'region-1' },
    { id: 'region-1-1-1', name: 'NY', level: 2, parentId: 'region-1-1' },
    { id: 'region-1-1-2', name: 'MA', level: 2, parentId: 'region-1-1' },
    { id: 'region-1-1-3', name: 'CT', level: 2, parentId: 'region-1-1' },
    { id: 'region-1-2', name: 'Southeast', level: 1, parentId: 'region-1' },
    { id: 'region-1-2-1', name: 'FL', level: 2, parentId: 'region-1-2' },
    { id: 'region-1-2-2', name: 'GA', level: 2, parentId: 'region-1-2' },
    { id: 'region-2', name: 'West', level: 0, parentId: null },
    { id: 'region-2-1', name: 'Southwest', level: 1, parentId: 'region-2' },
    { id: 'region-2-1-1', name: 'CA', level: 2, parentId: 'region-2-1' },
    { id: 'region-2-1-2', name: 'AZ', level: 2, parentId: 'region-2-1' },
  ];

  // Build tree structure
  const buildTree = (nodes: HierarchyNode[], parentId: string | null = null): HierarchyNode[] => {
    return nodes
      .filter(node => node.parentId === parentId)
      .map(node => ({
        ...node,
        children: buildTree(nodes, node.id)
      }));
  };

  const treeData = buildTree(demoNodes);

  // Handle node selection
  const handleNodeSelect = (nodeId: string) => {
    const newSelectedNodes = { ...selectedNodes, [nodeId]: !selectedNodes[nodeId] };
    setSelectedNodes(newSelectedNodes);

    // Call the callback with the updated selection
    onSelectionChange({
      type: activeType,
      nodeIds: Object.entries(newSelectedNodes)
        .filter(([, selected]) => selected)
        .map(([id]) => id)
    });
  };

  // Clear all selections
  const clearSelections = () => {
    setSelectedNodes({});
    onSelectionChange({ type: activeType, nodeIds: [] });
  };

  // Filter nodes based on search term
  const filteredNodes = searchTerm
    ? demoNodes.filter(node =>
        node.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Render a node and its children
  const renderNode = (node: HierarchyNode, level = 0) => {
    const isSelected = !!selectedNodes[node.id];
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="select-none">
        <div
          className={`flex items-center py-1 ${
            isSelected ? 'text-dp-text-primary font-medium' : 'text-dp-text-secondary'
          }`}
          style={{ paddingLeft: `${(level * 16) + 8}px` }}
        >
          <input
            type="checkbox"
            id={`node-${node.id}`}
            checked={isSelected}
            onChange={() => handleNodeSelect(node.id)}
            className="mr-2 h-4 w-4 rounded border-dp-border-medium text-dp-cfa-red focus:ring-dp-cfa-red"
          />
          <label htmlFor={`node-${node.id}`} className="cursor-pointer text-sm">
            {node.name}
          </label>
        </div>

        {hasChildren && (
          <div className="ml-2">
            {node.children?.map(childNode => renderNode(childNode, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Get selected node names for display
  const getSelectedNodeNames = () => {
    return demoNodes
      .filter(node => selectedNodes[node.id])
      .map(node => node.name);
  };

  return (
    <aside className="bg-dp-surface-primary border-r border-dp-border-light w-[var(--dp-sidebar-width)] h-full flex flex-col">
      <div className="p-4 border-b border-dp-border-light">
        <h2 className="font-medium mb-2 text-dp-text-primary">Hierarchy</h2>

        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="dp-input pl-8 text-sm"
          />
          <svg
            className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-dp-text-secondary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <div className="mb-4">
          <label className="block text-sm text-dp-text-secondary mb-1">Type:</label>
          <select
            className="dp-select text-sm"
            value={activeType}
            onChange={(e) => setActiveType(e.target.value as HierarchyType)}
          >
            {hierarchyTypes.map(type => (
              <option key={type.id} value={type.id}>{type.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {searchTerm ? (
          // Search results
          filteredNodes.length > 0 ? (
            <div className="p-2">
              <div className="text-xs text-dp-text-secondary mb-2">
                Search results for &quot;{searchTerm}&quot;
              </div>
              {filteredNodes.map(node => (
                <div key={node.id} className="py-1">
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={!!selectedNodes[node.id]}
                      onChange={() => handleNodeSelect(node.id)}
                      className="mr-2 h-4 w-4 rounded border-dp-border-medium text-dp-cfa-red focus:ring-dp-cfa-red"
                    />
                    {node.name}
                  </label>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-sm text-dp-text-secondary">
              No results found for &quot;{searchTerm}&quot;
            </div>
          )
        ) : (
          // Tree view
          <div className="p-2">
            {treeData.map(node => renderNode(node))}
          </div>
        )}
      </div>

      {Object.values(selectedNodes).some(v => v) && (
        <div className="p-4 border-t border-dp-border-light">
          <div className="mb-2">
            <div className="text-xs text-dp-text-secondary mb-1">Selected:</div>
            <div className="flex flex-wrap gap-2">
              {getSelectedNodeNames().map(name => (
                <span key={name} className="dp-tag text-xs">
                  {name}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={clearSelections}
            className="text-dp-text-secondary text-xs hover:text-dp-text-primary transition-colors"
          >
            Clear All
          </button>
        </div>
      )}
    </aside>
  );
}
