'use client';

import { useState, useRef, useEffect } from 'react';
import { FilterOption } from './MultiSelectFilter';

interface SingleSelectFilterProps {
  title: string;
  options: FilterOption[];
  selectedValue: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
}

export default function SingleSelectFilter({
  title,
  options,
  selectedValue,
  onChange,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search...',
  disabled = false
}: SingleSelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options based on search query
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get selected option label
  const selectedOption = options.find(opt => opt.value === selectedValue);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-dp-text-secondary mb-2">
        {title}
      </label>

      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-3 py-2 text-left bg-dp-surface-secondary
          border border-dp-frame-border rounded-md
          focus:outline-none focus:ring-2 focus:ring-dp-cfa-red/20 focus:border-dp-cfa-red
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-dp-surface-secondary/80'}
        `}
      >
        <div className="flex items-center justify-between">
          <span className={selectedValue ? 'text-dp-text-primary' : 'text-dp-text-tertiary'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <svg
            className={`w-4 h-4 text-dp-text-tertiary transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-dp-surface-primary border border-dp-frame-border rounded-md shadow-dp-heavy">
          {/* Search */}
          {options.length > 5 && (
            <div className="p-2 border-b border-dp-frame-border">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full px-3 py-1.5 text-sm bg-dp-surface-secondary border border-dp-frame-border rounded-md focus:outline-none focus:ring-2 focus:ring-dp-cfa-red/20 focus:border-dp-cfa-red"
              />
            </div>
          )}

          {/* Options */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-dp-text-tertiary">
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                  className={`
                    w-full px-3 py-2 text-left text-sm
                    ${option.value === selectedValue
                      ? 'bg-dp-cfa-red/10 text-dp-cfa-red'
                      : 'text-dp-text-primary hover:bg-dp-surface-secondary'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
