'use client';

import { useState, useRef, useEffect } from 'react';

export interface FilterOption {
  value: string;
  label: string;
}

interface MultiSelectFilterProps {
  title: string;
  options: FilterOption[];
  selectedValues: string[];
  onChange: (selectedValues: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  maxDisplayItems?: number;
  className?: string;
}

export default function MultiSelectFilter({
  title,
  options,
  selectedValues,
  onChange,
  placeholder = "Select items...",
  searchPlaceholder = "Search...",
  maxDisplayItems = 3,
  className = ''
}: MultiSelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle option selection
  const handleOptionToggle = (value: string) => {
    const newSelectedValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onChange(newSelectedValues);
  };

  // Handle select all
  const handleSelectAll = () => {
    const allValues = filteredOptions.map(option => option.value);
    const newSelectedValues = allValues.every(value => selectedValues.includes(value))
      ? selectedValues.filter(value => !allValues.includes(value)) // Deselect filtered items
      : [...new Set([...selectedValues, ...allValues])]; // Select filtered items
    onChange(newSelectedValues);
  };

  // Handle clear all
  const handleClearAll = () => {
    onChange([]);
  };

  // Get display text for selected items
  const getDisplayText = () => {
    if (selectedValues.length === 0) {
      return placeholder;
    }

    if (selectedValues.length <= maxDisplayItems) {
      return selectedValues.map(value => {
        const option = options.find(opt => opt.value === value);
        return option?.label || value;
      }).join(', ');
    }

    return `${selectedValues.length} items selected`;
  };

  // Check if all filtered options are selected
  const allFilteredSelected = filteredOptions.length > 0 &&
    filteredOptions.every(option => selectedValues.includes(option.value));

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Title */}
      <label className="block text-sm font-medium text-dp-text-primary mb-2">
        {title}
      </label>

      {/* Selected items display and trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-left bg-white border border-dp-frame-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary hover:border-dp-border-medium transition-colors"
      >
        <div className="flex items-center justify-between">
          <span className={`block truncate ${selectedValues.length === 0 ? 'text-dp-text-tertiary' : 'text-dp-text-primary'}`}>
            {getDisplayText()}
          </span>
          <svg
            className={`h-5 w-5 text-dp-text-secondary transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Selected items tags (when items are selected) */}
      {selectedValues.length > 0 && selectedValues.length <= maxDisplayItems && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedValues.map(value => {
            const option = options.find(opt => opt.value === value);
            return (
              <span
                key={value}
                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary"
              >
                {option?.label || value}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOptionToggle(value);
                  }}
                  className="ml-1 h-3 w-3 rounded-full inline-flex items-center justify-center hover:bg-primary/20"
                >
                  <svg className="h-2 w-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-dp-frame-border rounded-md shadow-lg">
          <div className="p-2">
            {/* Search input */}
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-dp-border-light rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Actions */}
          <div className="px-2 pb-2 flex justify-between text-xs">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-primary hover:text-primary-dark font-medium"
            >
              {allFilteredSelected ? 'Deselect All' : 'Select All'}
            </button>
            {selectedValues.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-dp-text-tertiary hover:text-dp-text-secondary font-medium"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Options list */}
          <div className="max-h-60 overflow-y-auto border-t border-dp-border-light">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-dp-text-tertiary">
                No options found
              </div>
            ) : (
              filteredOptions.map(option => (
                <label
                  key={option.value}
                  className="flex items-center px-3 py-2 hover:bg-dp-surface-secondary cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option.value)}
                    onChange={() => handleOptionToggle(option.value)}
                    className="h-4 w-4 text-primary rounded border-dp-border-medium focus:ring-primary focus:ring-offset-0"
                  />
                  <span className="ml-2 text-sm text-dp-text-primary">
                    {option.label}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
