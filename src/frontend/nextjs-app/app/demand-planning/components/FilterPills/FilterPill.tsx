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
  return (
    <button
      onClick={onEdit}
      className={`${styles.pill} ${className}`}
      aria-label={`Edit filter: ${label}`}
    >
      <span className={styles.label}>{label}</span>
      {removable && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className={styles.removeButton}
          aria-label={`Remove filter: ${label}`}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M10 4L4 10M4 4L10 10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </button>
  );
});

export default FilterPill;
