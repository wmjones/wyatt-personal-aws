'use client';

import { useState, useEffect, useRef } from 'react';
import MultiSelectFilter from '../MultiSelectFilter';
import SingleSelectFilter from '../SingleSelectFilter';
import DateRangeFilter from '../DateRangeFilter';
import { FilterSelections } from '../FilterSidebar';
import styles from './FilterPills.module.css';
import {
  useStateOptions,
  useDMAOptions,
  useDCOptions,
  useInventoryItemOptions
} from '@/app/hooks/useDropdownOptions';

interface FilterDropdownProps {
  isOpen: boolean;
  filterType: keyof FilterSelections | null;
  filterSelections: FilterSelections;
  onSelectionChange: (selections: FilterSelections) => void;
  onClose: () => void;
  anchorEl?: HTMLElement | null;
}

export default function FilterDropdown({
  isOpen,
  filterType,
  filterSelections,
  onSelectionChange,
  onClose,
  anchorEl
}: FilterDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Fetch dropdown options
  const { data: stateOptions = [] } = useStateOptions();
  const { data: dmaOptions = [] } = useDMAOptions();
  const { data: dcOptions = [] } = useDCOptions();
  const { data: inventoryOptions = [] } = useInventoryItemOptions();

  // Position dropdown below the anchor element
  useEffect(() => {
    if (isOpen && anchorEl && dropdownRef.current) {
      const rect = anchorEl.getBoundingClientRect();
      const dropdownRect = dropdownRef.current.getBoundingClientRect();

      let left = rect.left;
      let top = rect.bottom + 8;

      // Adjust if dropdown goes off screen
      if (left + dropdownRect.width > window.innerWidth) {
        left = window.innerWidth - dropdownRect.width - 16;
      }
      if (top + dropdownRect.height > window.innerHeight) {
        top = rect.top - dropdownRect.height - 8;
      }

      setPosition({ top, left });
    }
  }, [isOpen, anchorEl]);

  // Close on outside click
  useEffect(() => {
    if (isOpen) {
      const handleClickOutside = (e: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
          onClose();
        }
      };

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !filterType) return null;

  const renderFilter = () => {
    switch (filterType) {
      case 'inventoryItemId':
        return (
          <SingleSelectFilter
            title="Inventory Item"
            options={inventoryOptions}
            selectedValue={filterSelections.inventoryItemId}
            onChange={(value) => onSelectionChange({
              ...filterSelections,
              inventoryItemId: value || ''
            })}
            placeholder="Select an item"
          />
        );

      case 'states':
        return (
          <MultiSelectFilter
            title="States"
            options={stateOptions}
            selectedValues={filterSelections.states}
            onChange={(values) => onSelectionChange({
              ...filterSelections,
              states: values
            })}
            placeholder="Select states"
          />
        );

      case 'dmaIds':
        return (
          <MultiSelectFilter
            title="DMAs"
            options={dmaOptions}
            selectedValues={filterSelections.dmaIds}
            onChange={(values) => onSelectionChange({
              ...filterSelections,
              dmaIds: values
            })}
            placeholder="Select DMAs"
          />
        );

      case 'dcIds':
        return (
          <MultiSelectFilter
            title="Distribution Centers"
            options={dcOptions}
            selectedValues={filterSelections.dcIds}
            onChange={(values) => onSelectionChange({
              ...filterSelections,
              dcIds: values
            })}
            placeholder="Select DCs"
          />
        );

      case 'dateRange':
        return (
          <DateRangeFilter
            value={{
              startDate: filterSelections.dateRange.startDate
                ? new Date(filterSelections.dateRange.startDate)
                : null,
              endDate: filterSelections.dateRange.endDate
                ? new Date(filterSelections.dateRange.endDate)
                : null
            }}
            onChange={(dateRange) => onSelectionChange({
              ...filterSelections,
              dateRange: {
                startDate: dateRange.startDate
                  ? dateRange.startDate.toISOString().split('T')[0]
                  : null,
                endDate: dateRange.endDate
                  ? dateRange.endDate.toISOString().split('T')[0]
                  : null
              }
            })}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div
      ref={dropdownRef}
      className={styles.dropdown}
      role="dialog"
      aria-modal="true"
      aria-label={`Edit ${filterType} filter`}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 200
      }}
    >
      <div className={styles.dropdownContent}>
        {renderFilter()}
        <div className={styles.dropdownActions}>
          <button
            onClick={onClose}
            className={styles.applyButton}
            aria-label="Apply filter changes"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
