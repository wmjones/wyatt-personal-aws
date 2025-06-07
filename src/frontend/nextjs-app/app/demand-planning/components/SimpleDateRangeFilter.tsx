'use client';

import DateRangeFilter from './DateRangeFilter';

interface SimpleDateRangeFilterProps {
  startDate: string | null;
  endDate: string | null;
  onChange: (dateRange: { startDate: string | null; endDate: string | null }) => void;
  className?: string;
  minDate?: string | null;
  maxDate?: string | null;
}

export default function SimpleDateRangeFilter({
  startDate,
  endDate,
  onChange,
  className,
  minDate,
  maxDate
}: SimpleDateRangeFilterProps) {
  return (
    <DateRangeFilter
      value={{
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null
      }}
      onChange={(range) => {
        onChange({
          startDate: range?.startDate instanceof Date ? range.startDate.toISOString().split('T')[0] : null,
          endDate: range?.endDate instanceof Date ? range.endDate.toISOString().split('T')[0] : null
        });
      }}
      className={className}
      minDate={minDate}
      maxDate={maxDate}
    />
  );
}
