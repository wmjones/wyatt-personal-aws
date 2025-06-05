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
  minDate?: Date | string | null;
  maxDate?: Date | string | null;
}

export default function DateRangeFilter({
  value,
  onChange,
  className = '',
  minDate,
  maxDate
}: DateRangeFilterProps) {
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
      {/* Date range display button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-left bg-white border border-dp-frame-border rounded-md hover:border-dp-border-medium focus:outline-none focus:ring-2 focus:ring-dp-cfa-red focus:ring-offset-2 transition-colors flex items-center justify-between"
      >
        <span className={value.startDate && value.endDate ? 'text-gray-900' : 'text-gray-400'}>
          {formatDateRange()}
        </span>
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

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
            minDate={minDate ? (typeof minDate === 'string' ? new Date(minDate) : minDate) : undefined}
            maxDate={maxDate ? (typeof maxDate === 'string' ? new Date(maxDate) : maxDate) : undefined}
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
