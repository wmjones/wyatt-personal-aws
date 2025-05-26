import React from 'react';
import { BaseDropdown } from './BaseDropdown';
import { MultiSelectDropdownProps } from '../types';
import { cn } from '../utils';

/**
 * MultiSelectDropdown Component
 *
 * A styled multi-select dropdown built on top of BaseDropdown.
 * Supports selecting multiple options with chips display.
 *
 * @example
 * <MultiSelectDropdown
 *   options={[
 *     { value: '1', label: 'Option 1' },
 *     { value: '2', label: 'Option 2' }
 *   ]}
 *   value={selectedValues}
 *   onChange={setSelectedValues}
 *   placeholder="Select options"
 * />
 */
export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select options',
  disabled = false,
  error,
  fullWidth = false,
  searchable = true,
  clearable = true,
  loading = false,
  maxSelections,
  className,
  'data-testid': testId = 'multi-select-dropdown',
}) => {
  const canSelectMore = !maxSelections || value.length < maxSelections;

  return (
    <BaseDropdown
      options={options}
      value={value}
      onChange={(newValue) => {
        onChange((newValue as string[]) || []);
      }}
      multiple={true}
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
              'min-h-[42px]',
              error && 'border-red-500'
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 flex flex-wrap gap-1">
                {loading ? (
                  <span className="text-dp-text-tertiary">Loading...</span>
                ) : selectedOptions.length > 0 ? (
                  selectedOptions.map((option) => (
                    <span
                      key={option.value}
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5',
                        'bg-dp-primary-light text-dp-cfa-red',
                        'rounded text-sm'
                      )}
                    >
                      {option.label}
                      {!disabled && !loading && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onChange(value.filter(v => v !== option.value));
                          }}
                          className="hover:text-dp-cfa-red-primary transition-colors"
                          aria-label={`Remove ${option.label}`}
                        >
                          <svg
                            className="w-3 h-3"
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
                    </span>
                  ))
                ) : (
                  <span className="text-dp-text-tertiary">{placeholder}</span>
                )}
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
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

              {/* Selection Info */}
              {maxSelections && (
                <div className="px-3 py-2 text-sm text-dp-text-secondary border-b border-dp-frame-divider">
                  {value.length} / {maxSelections} selected
                  {!canSelectMore && (
                    <span className="text-dp-status-warning ml-2">
                      (Maximum reached)
                    </span>
                  )}
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
                    const isDisabled = optionProps['data-disabled'] || (!isSelected && !canSelectMore);

                    return (
                      <li
                        key={option.value}
                        {...optionProps}
                        className={cn(
                          'px-3 py-2 cursor-pointer',
                          'transition-colors duration-150',
                          isHighlighted && 'bg-dp-background-secondary',
                          isSelected && 'bg-dp-primary-light',
                          isDisabled && 'opacity-50 cursor-not-allowed',
                          !isDisabled && !isSelected && 'hover:bg-dp-background-secondary'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isDisabled}
                            onChange={() => {}}
                            className={cn(
                              'w-4 h-4 rounded',
                              'text-dp-cfa-red focus:ring-dp-cfa-red',
                              'border-dp-frame-border',
                              isDisabled && 'cursor-not-allowed'
                            )}
                            aria-hidden="true"
                          />
                          <span className={cn(
                            isSelected && 'text-dp-cfa-red font-medium'
                          )}>
                            {option.label}
                          </span>
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
