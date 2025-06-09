'use client';

import { useMemo } from 'react';
import { FilterSelections } from '../FilterSidebar';
import styles from './FloatingAdjustmentToolbar.module.css';

interface ImpactPreviewProps {
  adjustmentValue: number;
  filterSelections: FilterSelections;
}

export default function ImpactPreview({
  adjustmentValue,
  filterSelections
}: ImpactPreviewProps) {
  const impactSummary = useMemo(() => {
    if (adjustmentValue === 0) return null;

    const parts = [];

    // Show what's being adjusted
    if (filterSelections.states.length > 0) {
      parts.push(`${filterSelections.states.length} state(s)`);
    }
    if (filterSelections.dmaIds.length > 0) {
      parts.push(`${filterSelections.dmaIds.length} DMA(s)`);
    }
    if (filterSelections.dcIds.length > 0) {
      parts.push(`${filterSelections.dcIds.length} DC(s)`);
    }

    const scope = parts.length > 0 ? parts.join(', ') : 'all regions';

    return {
      value: adjustmentValue,
      scope,
      direction: adjustmentValue > 0 ? 'increase' : 'decrease'
    };
  }, [adjustmentValue, filterSelections]);

  if (!impactSummary) return null;

  return (
    <div
      className={styles.impactPreview}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label="Adjustment impact preview"
    >
      <span className={styles.impactLabel} id="impact-label">Impact:</span>
      <span
        className={styles.impactValue}
        aria-describedby="impact-label"
      >
        {impactSummary.value > 0 ? '+' : ''}{impactSummary.value}% {impactSummary.direction} for {impactSummary.scope}
      </span>
    </div>
  );
}
