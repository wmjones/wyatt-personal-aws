'use client';

import { MultiSelectDropdown, type DropdownOption } from '@/components/ui';


interface MultiSelectFilterProps {
  title: string;
  options: DropdownOption[];
  selectedValues: string[];
  onChange: (selectedValues: string[]) => void;
  placeholder?: string;
  maxDisplayItems?: number;
  className?: string;
}

export default function MultiSelectFilter({
  title,
  options,
  selectedValues,
  onChange,
  placeholder = "Select items...",
  className = ''
}: MultiSelectFilterProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-dp-text-primary mb-2">
        {title}
      </label>

      <MultiSelectDropdown
        options={options}
        value={selectedValues}
        onChange={onChange}
        placeholder={placeholder}
        searchable={true}
        clearable={true}
        fullWidth={true}
      />
    </div>
  );
}
