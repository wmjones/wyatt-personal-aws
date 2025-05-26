'use client';

import { SingleSelectDropdown, type DropdownOption } from '@/components/ui';

// Re-export for backward compatibility
export type FilterOption = DropdownOption;

interface SingleSelectFilterProps {
  title: string;
  options: FilterOption[];
  selectedValue: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function SingleSelectFilter({
  title,
  options,
  selectedValue,
  onChange,
  placeholder = 'Select an option...',
  disabled = false
}: SingleSelectFilterProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-dp-text-secondary mb-2">
        {title}
      </label>

      <SingleSelectDropdown
        options={options}
        value={selectedValue || undefined}
        onChange={(value) => onChange(value || null)}
        placeholder={placeholder}
        disabled={disabled}
        searchable={options.length > 5}
        clearable={true}
        fullWidth={true}
      />
    </div>
  );
}
