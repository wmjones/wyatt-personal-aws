import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { cn, filterOptions, handleKeyboardNavigation, generateId } from '../utils';
import { BaseDropdownProps, DropdownOption } from '../types';

export interface BaseDropdownRenderProps {
  isOpen: boolean;
  selectedOptions: DropdownOption[];
  filteredOptions: DropdownOption[];
  searchValue: string;
  highlightedIndex: number;
  clearable: boolean;
  loading: boolean;
  disabled: boolean;
  getOptionProps: (option: DropdownOption, index: number) => {
    'data-highlighted': boolean;
    'data-selected': boolean;
    'data-disabled': boolean;
    onClick: () => void;
    onMouseEnter: () => void;
    role: string;
    'aria-selected': boolean;
    'aria-disabled': boolean;
  };
  getInputProps: () => {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    placeholder: string;
    'aria-label': string;
    'aria-expanded': boolean;
    'aria-autocomplete': 'list';
    'aria-controls': string;
    role: string;
  };
  getTriggerProps: () => {
    onClick: () => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    'aria-expanded': boolean;
    'aria-haspopup': 'listbox';
    'aria-controls': string;
    disabled: boolean;
  };
  getMenuProps: () => {
    id: string;
    role: string;
    'aria-label': string;
  };
  getClearProps: () => {
    onClick: (e: React.MouseEvent) => void;
    'aria-label': string;
  };
}

interface BaseDropdownComponentProps extends Omit<BaseDropdownProps, 'children'> {
  value: string | string[];
  onChange: (value: string | string[] | undefined) => void;
  multiple?: boolean;
  children: (props: BaseDropdownRenderProps) => React.ReactNode;
}

/**
 * BaseDropdown Component
 *
 * A headless dropdown component that provides all the logic and accessibility
 * features needed for building custom dropdown implementations.
 *
 * Features:
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Search/filter functionality
 * - Click outside detection
 * - Full ARIA compliance
 * - Single and multi-select support
 *
 * @example
 * <BaseDropdown
 *   options={options}
 *   value={value}
 *   onChange={onChange}
 * >
 *   {(props) => (
 *     // Your custom dropdown UI
 *   )}
 * </BaseDropdown>
 */
export const BaseDropdown: React.FC<BaseDropdownComponentProps> = ({
  options,
  value,
  onChange,
  multiple = false,
  placeholder = 'Select...',
  disabled = false,
  error,
  searchable = false,
  clearable = false, // Used by child components to conditionally render clear button
  loading = false,
  className,
  children,
  'data-testid': testId = 'dropdown',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuId = useMemo(() => generateId('dropdown-menu'), []);
  const triggerId = useMemo(() => generateId('dropdown-trigger'), []);

  // Convert value to array for consistent handling
  const selectedValues = useMemo(() => {
    if (multiple) {
      return Array.isArray(value) ? value : [];
    }
    return value ? [value as string] : [];
  }, [value, multiple]);

  // Get selected options
  const selectedOptions = useMemo(() => {
    return options.filter(option => selectedValues.includes(option.value));
  }, [options, selectedValues]);

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    const filtered = searchable ? filterOptions(options, searchValue) : options;
    // If not multiple, exclude already selected options from the list
    if (!multiple && selectedValues.length > 0) {
      return filtered;
    }
    return filtered;
  }, [options, searchValue, searchable, multiple, selectedValues]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchValue('');
        setHighlightedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Focus management
  useEffect(() => {
    if (isOpen && searchable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Handlers
  const toggleOpen = useCallback(() => {
    if (!disabled && !loading) {
      setIsOpen(prev => !prev);
      if (!isOpen) {
        setHighlightedIndex(0);
      } else {
        setSearchValue('');
        setHighlightedIndex(-1);
      }
    }
  }, [disabled, loading, isOpen]);

  const selectOption = useCallback((option: DropdownOption) => {
    if (option.disabled) return;

    if (multiple) {
      const newValues = selectedValues.includes(option.value)
        ? selectedValues.filter(v => v !== option.value)
        : [...selectedValues, option.value];
      onChange(newValues);
    } else {
      onChange(option.value);
      setIsOpen(false);
      setSearchValue('');
      setHighlightedIndex(-1);
    }
  }, [multiple, selectedValues, onChange]);

  const clearSelection = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(multiple ? [] : undefined);
    setSearchValue('');
  }, [multiple, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled || loading) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        if (!isOpen) {
          e.preventDefault();
          setIsOpen(true);
          setHighlightedIndex(0);
        } else if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          e.preventDefault();
          selectOption(filteredOptions[highlightedIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchValue('');
        setHighlightedIndex(-1);
        triggerRef.current?.focus();
        break;

      case 'ArrowDown':
      case 'ArrowUp':
      case 'Home':
      case 'End':
        if (!isOpen) {
          e.preventDefault();
          setIsOpen(true);
          setHighlightedIndex(0);
        } else {
          const newIndex = handleKeyboardNavigation(
            e,
            highlightedIndex,
            filteredOptions.length - 1
          );
          if (newIndex !== undefined) {
            setHighlightedIndex(newIndex);
          }
        }
        break;

      case 'Tab':
        if (isOpen) {
          setIsOpen(false);
          setSearchValue('');
          setHighlightedIndex(-1);
        }
        break;
    }
  }, [disabled, loading, isOpen, highlightedIndex, filteredOptions, selectOption]);

  // Render props
  const getOptionProps = (option: DropdownOption, index: number) => ({
    'data-highlighted': index === highlightedIndex,
    'data-selected': selectedValues.includes(option.value),
    'data-disabled': option.disabled || false,
    onClick: () => selectOption(option),
    onMouseEnter: () => setHighlightedIndex(index),
    role: 'option',
    'aria-selected': selectedValues.includes(option.value),
    'aria-disabled': option.disabled || false,
  });

  const getInputProps = () => ({
    value: searchValue,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchValue(e.target.value);
      setHighlightedIndex(0);
    },
    onKeyDown: handleKeyDown,
    placeholder: placeholder,
    'aria-label': 'Search options',
    'aria-expanded': isOpen,
    'aria-autocomplete': 'list' as const,
    'aria-controls': menuId,
    role: 'combobox',
  });

  const getTriggerProps = () => ({
    ref: triggerRef,
    id: triggerId,
    onClick: toggleOpen,
    onKeyDown: handleKeyDown,
    'aria-expanded': isOpen,
    'aria-haspopup': 'listbox' as const,
    'aria-controls': menuId,
    disabled: disabled || loading,
  });

  const getMenuProps = () => ({
    id: menuId,
    role: 'listbox',
    'aria-label': placeholder,
    'aria-multiselectable': multiple,
  });

  const getClearProps = () => ({
    onClick: clearSelection,
    'aria-label': 'Clear selection',
  });

  const renderProps: BaseDropdownRenderProps = {
    isOpen,
    selectedOptions,
    filteredOptions,
    searchValue,
    highlightedIndex,
    clearable,
    loading,
    disabled,
    getOptionProps,
    getInputProps,
    getTriggerProps,
    getMenuProps,
    getClearProps,
  };

  return (
    <div
      ref={dropdownRef}
      className={cn('relative', className)}
      data-testid={testId}
    >
      {children(renderProps)}
      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
