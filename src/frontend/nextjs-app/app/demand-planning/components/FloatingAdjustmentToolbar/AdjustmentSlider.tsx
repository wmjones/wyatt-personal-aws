'use client';

import { useCallback } from 'react';
import styles from './FloatingAdjustmentToolbar.module.css';

interface AdjustmentSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export default function AdjustmentSlider({
  value,
  onChange,
  disabled = false
}: AdjustmentSliderProps) {
  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value));
  }, [onChange]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value) || 0;
    // Clamp value between -50 and +50
    const clampedValue = Math.max(-50, Math.min(50, newValue));
    onChange(clampedValue);
  }, [onChange]);

  return (
    <div className={styles.sliderContainer}>
      <input
        type="range"
        min="-50"
        max="50"
        step="0.5"
        value={value}
        onChange={handleSliderChange}
        disabled={disabled}
        className={styles.slider}
        style={{
          background: `linear-gradient(to right, #EF4444 0%, #6B7280 50%, #10B981 100%)`
        }}
        aria-label="Adjustment percentage"
      />

      <div className={styles.sliderInputContainer}>
        <input
          type="number"
          min="-50"
          max="50"
          step="0.5"
          value={value}
          onChange={handleInputChange}
          disabled={disabled}
          className={styles.sliderInput}
          aria-label="Adjustment percentage input"
        />
        <span className={styles.percentSymbol}>%</span>
      </div>

      {/* Tick marks for common values */}
      <div className={styles.tickMarks}>
        <span className={styles.tick} style={{ left: '0%' }}>-50</span>
        <span className={styles.tick} style={{ left: '25%' }}>-25</span>
        <span className={styles.tick} style={{ left: '50%' }}>0</span>
        <span className={styles.tick} style={{ left: '75%' }}>25</span>
        <span className={styles.tick} style={{ left: '100%' }}>50</span>
      </div>
    </div>
  );
}
