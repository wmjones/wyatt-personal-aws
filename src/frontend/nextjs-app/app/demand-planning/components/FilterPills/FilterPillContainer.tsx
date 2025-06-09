'use client';

import { memo } from 'react';
import FilterPill from './FilterPill';
import { FilterSelections } from '../FilterSidebar';
import { ForecastSeries } from '@/app/types/demand-planning';
import styles from './FilterPills.module.css';

interface FilterPillContainerProps {
  filterSelections: FilterSelections;
  forecastData?: ForecastSeries | null;
  onRemoveFilter: (filterType: keyof FilterSelections, value?: string) => void;
  onEditFilter: (filterType: keyof FilterSelections) => void;
  className?: string;
}

const FilterPillContainer = memo(function FilterPillContainer({
  filterSelections,
  forecastData,
  onRemoveFilter,
  onEditFilter,
  className = ''
}: FilterPillContainerProps) {
  const pills: Array<{
    id: string;
    label: string;
    type: keyof FilterSelections;
    value?: string;
    removable: boolean;
  }> = [];

  // Inventory item pill
  if (filterSelections.inventoryItemId) {
    const item = forecastData?.inventoryItems.find(
      i => i.id === filterSelections.inventoryItemId
    );
    pills.push({
      id: `inventory-${filterSelections.inventoryItemId}`,
      label: `Item: ${item?.name || filterSelections.inventoryItemId}`,
      type: 'inventoryItemId',
      removable: false // Required filter
    });
  }

  // State pills
  filterSelections.states.forEach(state => {
    pills.push({
      id: `state-${state}`,
      label: `State: ${state}`,
      type: 'states',
      value: state,
      removable: true
    });
  });

  // DMA pills (grouped)
  if (filterSelections.dmaIds.length > 0) {
    pills.push({
      id: 'dmas',
      label: `DMAs: ${filterSelections.dmaIds.length} selected`,
      type: 'dmaIds',
      removable: true
    });
  }

  // DC pills (grouped)
  if (filterSelections.dcIds.length > 0) {
    pills.push({
      id: 'dcs',
      label: `DCs: ${filterSelections.dcIds.length} selected`,
      type: 'dcIds',
      removable: true
    });
  }

  // Date range pill
  if (filterSelections.dateRange.startDate && filterSelections.dateRange.endDate) {
    const startDate = new Date(filterSelections.dateRange.startDate);
    const endDate = new Date(filterSelections.dateRange.endDate);
    const formatDate = (date: Date) => date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });

    pills.push({
      id: 'dateRange',
      label: `${formatDate(startDate)} - ${formatDate(endDate)}`,
      type: 'dateRange',
      removable: false // Required filter
    });
  }

  return (
    <div className={`${styles.container} ${className}`}>
      {pills.map(pill => (
        <FilterPill
          key={pill.id}
          label={pill.label}
          removable={pill.removable}
          onRemove={() => onRemoveFilter(pill.type, pill.value)}
          onEdit={() => onEditFilter(pill.type)}
        />
      ))}
    </div>
  );
});

export default FilterPillContainer;
