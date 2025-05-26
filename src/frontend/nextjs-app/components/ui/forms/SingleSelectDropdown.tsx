import React from 'react';
import { BaseDropdown } from './BaseDropdown';
import { SingleSelectDropdownProps } from '../types';
import { cn } from '../utils';

/**
 * SingleSelectDropdown Component
 *
 * A styled single-select dropdown built on top of BaseDropdown.
 * Provides a complete UI with search, clear, and keyboard navigation.
 *
 * @example
 * <SingleSelectDropdown
 *   options={[
 *     { value: '1', label: 'Option 1' },
 *     { value: '2', label: 'Option 2' }
 *   ]}
 *   value={selectedValue}
 *   onChange={setSelectedValue}
 *   placeholder="Select an option"
 * />
 */
export const SingleSelectDropdown: React.FC<SingleSelectDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  error,
  fullWidth = false,
  searchable = true,
  clearable = true,
  loading = false,
  className,
  'data-testid': testId = 'single-select-dropdown',
}) => {
  return (
    <BaseDropdown
      options={options}
      value={value || ''}
      onChange={(newValue) => {
        if (Array.isArray(newValue)) {
          onChange(newValue[0]);
        } else {
          onChange(newValue as string | undefined);
        }
      }}
      multiple={false}
      placeholder={placeholder}
      disabled={disabled}
      error={error}
      searchable={searchable}
      clearable={clearable}
      loading={loading}
      className={cn(fullWidth && 'w-full', className)}
      data-testid={testId}
    >
      {({
        isOpen,
        selectedOptions,
        filteredOptions,
        // searchValue,
        // highlightedIndex,
        clearable,
        loading,
        disabled,
        getOptionProps,
        getInputProps,
        getTriggerProps,
        getMenuProps,
        getClearProps,
      }) => (
        <>
          {/* Trigger Button */}
          <button
            {...getTriggerProps()}
            className={cn(
              'w-full px-3 py-2 text-left',
              'border border-dp-frame-border rounded-md',
              'bg-dp-surface-primary text-dp-text-primary',
              'hover:border-dp-frame-border focus:outline-none',
              'focus:ring-2 focus:ring-dp-cfa-red focus:border-dp-cfa-red',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all duration-200',
              'flex items-center justify-between',
              error && 'border-red-500'
            )}
          >
            <span className={cn(
              'truncate',
              !selectedOptions.length && 'text-dp-text-tertiary'
            )}>
              {loading ? (
                'Loading...'
              ) : selectedOptions.length > 0 ? (
                selectedOptions[0].label
              ) : (
                placeholder
              )}
            </span>

            <div className="flex items-center gap-1">
              {clearable && selectedOptions.length > 0 && !disabled && !loading && (
                <button
                  {...getClearProps()}
                  className={cn(
                    'p-0.5 hover:bg-dp-background-secondary rounded',
                    'transition-colors duration-150'
                  )}
                  type="button"
                >
                  <svg
                    className="w-4 h-4 text-dp-text-tertiary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}

              <svg
                className={cn(
                  'w-5 h-5 text-dp-text-tertiary transition-transform duration-200',
                  isOpen && 'transform rotate-180'
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div
              className={cn(
                'absolute z-10 w-full mt-1',
                'bg-dp-surface-primary border border-dp-frame-border',
                'rounded-md shadow-lg',
                'max-h-60 overflow-hidden'
              )}
            >
              {/* Search Input */}
              {searchable && (
                <div className="p-2 border-b border-dp-frame-divider">
                  <input
                    {...getInputProps()}
                    ref={(el) => el?.focus()}
                    className={cn(
                      'w-full px-3 py-2',
                      'border border-dp-frame-border rounded-md',
                      'bg-dp-surface-primary text-dp-text-primary',
                      'placeholder-dp-text-tertiary',
                      'focus:outline-none focus:ring-2 focus:ring-dp-cfa-red',
                      'focus:border-dp-cfa-red'
                    )}
                    type="text"
                  />
                </div>
              )}

              {/* Options List */}
              <ul
                {...getMenuProps()}
                className="max-h-48 overflow-y-auto py-1"
              >
                {filteredOptions.length === 0 ? (
                  <li className="px-3 py-2 text-dp-text-tertiary text-center">
                    No options found
                  </li>
                ) : (
                  filteredOptions.map((option, index) => {
                    const optionProps = getOptionProps(option, index);
                    const isHighlighted = optionProps['data-highlighted'];
                    const isSelected = optionProps['data-selected'];
                    const isDisabled = optionProps['data-disabled'];

                    return (
                      <li
                        key={option.value}
                        {...optionProps}
                        className={cn(
                          'px-3 py-2 cursor-pointer',
                          'transition-colors duration-150',
                          isHighlighted && 'bg-dp-background-secondary',
                          isSelected && 'bg-dp-primary-light text-dp-cfa-red font-medium',
                          isDisabled && 'opacity-50 cursor-not-allowed',
                          !isDisabled && !isSelected && 'hover:bg-dp-background-secondary'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span>{option.label}</span>
                          {isSelected && (
                            <svg
                              className="w-4 h-4 text-dp-cfa-red"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          )}
        </>
      )}
    </BaseDropdown>
  );
};
