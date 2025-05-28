'use client';

import { useState, useRef, useEffect } from 'react';
import { DateRange, RangeKeyDict } from 'react-date-range';
import { format } from 'date-fns';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import './date-range-custom.css';

export interface DateRangeSelection {
  startDate: Date | null;
  endDate: Date | null;
}

interface DateRangeFilterProps {
  value: DateRangeSelection;
  onChange: (value: DateRangeSelection) => void;
  className?: string;
}

export default function DateRangeFilter({ value, onChange, className = '' }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectionRange = {
    startDate: value.startDate || new Date(),
    endDate: value.endDate || new Date(),
    key: 'selection',
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (ranges: RangeKeyDict) => {
    const selection = ranges.selection;
    if (selection) {
      onChange({
        startDate: selection.startDate || null,
        endDate: selection.endDate || null,
      });
    }
  };

  const formatDateRange = () => {
    if (!value.startDate || !value.endDate) {
      return 'Select date range...';
    }
    return `${format(value.startDate, 'MMM d, yyyy')} - ${format(value.endDate, 'MMM d, yyyy')}`;
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-dp-text-primary">Date Range</h4>

        {/* Date range display button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 text-left bg-white border border-dp-frame-border rounded-md hover:border-dp-border-medium focus:outline-none focus:ring-2 focus:ring-dp-cfa-red focus:ring-offset-2 transition-colors"
        >
          <span className={value.startDate && value.endDate ? 'text-dp-text-primary' : 'text-dp-text-tertiary'}>
            {formatDateRange()}
          </span>
        </button>
      </div>

      {/* Date picker dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white border border-dp-frame-border rounded-lg shadow-dp-large">
          <DateRange
            ranges={[selectionRange]}
            onChange={handleSelect}
            months={2}
            direction="horizontal"
            moveRangeOnFirstSelection={false}
            className="rounded-lg"
          />
          <div className="p-3 border-t border-dp-frame-border flex justify-end gap-2">
            <button
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 text-sm text-dp-text-secondary hover:text-dp-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 text-sm bg-dp-cfa-red text-white rounded-md hover:bg-opacity-90 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
