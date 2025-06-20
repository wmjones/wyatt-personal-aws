'use client';

import { SingleSelectDropdown, type DropdownOption } from '@/components/ui';


interface SingleSelectFilterProps {
  title: string;
  options: DropdownOption[];
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
  // Debug logging
  console.log('SingleSelectFilter - selectedValue:', selectedValue);
  console.log('SingleSelectFilter - options:', options);

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
