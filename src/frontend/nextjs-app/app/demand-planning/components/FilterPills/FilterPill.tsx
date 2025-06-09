'use client';

import { memo } from 'react';
import styles from './FilterPills.module.css';

interface FilterPillProps {
  label: string;
  removable?: boolean;
  onRemove?: () => void;
  onEdit?: () => void;
  className?: string;
}

const FilterPill = memo(function FilterPill({
  label,
  removable = true,
  onRemove,
  onEdit,
  className = ''
}: FilterPillProps) {
  const isRequired = !removable;

  return (
    <div
      className={`${styles.pill} ${className}`}
      role="group"
      aria-label={`Filter: ${label}${isRequired ? ' (required)' : ''}`}
    >
      <button
        onClick={onEdit}
        className={styles.pillButton}
        aria-label={`Edit filter: ${label}`}
        aria-describedby={isRequired ? `${label}-required` : undefined}
      >
        <span className={styles.label}>{label}</span>
      </button>
      {isRequired && (
        <span id={`${label}-required`} className="sr-only">
          This filter is required and cannot be removed
        </span>
      )}
      {removable && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className={styles.removeButton}
          aria-label={`Remove filter: ${label}`}
          title={`Remove ${label} filter`}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M10 4L4 10M4 4L10 10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
});

export default FilterPill;
