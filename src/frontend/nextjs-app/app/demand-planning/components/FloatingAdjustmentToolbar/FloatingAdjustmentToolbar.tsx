'use client';

import { useState, useEffect } from 'react';
import { animated, useSpring, config } from '@react-spring/web';
import { FilterSelections } from '../FilterSidebar';
import AdjustmentSlider from './AdjustmentSlider';
import PresetButtons from './PresetButtons';
import ImpactPreview from './ImpactPreview';
import styles from './FloatingAdjustmentToolbar.module.css';

interface FloatingAdjustmentToolbarProps {
  isVisible: boolean;
  onAdjustmentChange: (value: number) => void;
  onSaveAdjustment: (value: number, filterContext: FilterSelections) => Promise<void>;
  filterSelections: FilterSelections;
  className?: string;
}

export default function FloatingAdjustmentToolbar({
  isVisible,
  onAdjustmentChange,
  onSaveAdjustment,
  filterSelections,
  className = ''
}: FloatingAdjustmentToolbarProps) {
  const [adjustmentValue, setAdjustmentValue] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isInitialMount, setIsInitialMount] = useState(true);

  // Reset value when toolbar becomes invisible
  useEffect(() => {
    if (!isVisible) {
      setAdjustmentValue(0);
      onAdjustmentChange(0);
    } else {
      setIsInitialMount(false);
    }
  }, [isVisible, onAdjustmentChange]);

  // Toolbar entrance animation
  const toolbarSpring = useSpring({
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateX(-50%) translateY(0px)' : 'translateX(-50%) translateY(-20px)',
    config: config.gentle,
    immediate: isInitialMount
  });

  // Expand/collapse animation
  const expandSpring = useSpring({
    height: isExpanded ? 'auto' : '48px',
    opacity: isExpanded ? 1 : 0.95,
    config: { tension: 200, friction: 25 }
  });

  // Value change animation
  const valueSpring = useSpring({
    value: adjustmentValue,
    config: { tension: 280, friction: 20 }
  });

  const handleValueChange = (value: number) => {
    setAdjustmentValue(value);
    onAdjustmentChange(value);
  };

  const handleSave = async () => {
    if (adjustmentValue === 0 || isSaving) return;

    setIsSaving(true);
    try {
      await onSaveAdjustment(adjustmentValue, filterSelections);
      setAdjustmentValue(0);
      onAdjustmentChange(0);
    } catch (error) {
      console.error('Failed to save adjustment:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isVisible) return null;

  return (
    <animated.div
      className={`${styles.toolbar} ${className}`}
      style={{
        ...toolbarSpring,
        ...expandSpring
      }}
      role="toolbar"
      aria-label="Forecast adjustment toolbar"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Collapsed state - minimal view */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className={styles.expandButton}
          aria-label="Expand adjustment toolbar"
          aria-expanded="false"
          aria-controls="adjustment-controls"
        >
          <span className={styles.adjustmentLabel}>Adjust Forecast</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 6l4 4 4-4" />
          </svg>
        </button>
      )}

      {/* Expanded state - full controls */}
      {isExpanded && (
        <>
          <div className={styles.toolbarHeader}>
            <animated.span className={styles.adjustmentValue}>
              {valueSpring.value.to(val => {
                const rounded = Math.round(val * 10) / 10;
                return `${rounded > 0 ? '+' : ''}${rounded}%`;
              })}
            </animated.span>
            <button
              onClick={() => setIsExpanded(false)}
              className={styles.collapseButton}
              aria-label="Collapse adjustment toolbar"
              aria-expanded="true"
              aria-controls="adjustment-controls"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4 10l4-4 4 4" />
              </svg>
            </button>
          </div>

          <div className={styles.controlsContainer} id="adjustment-controls" role="region" aria-label="Adjustment controls">
            <AdjustmentSlider
              value={adjustmentValue}
              onChange={handleValueChange}
              disabled={isSaving}
            />

            <PresetButtons
              onPresetClick={handleValueChange}
              disabled={isSaving}
            />
          </div>

          <ImpactPreview
            adjustmentValue={adjustmentValue}
            filterSelections={filterSelections}
          />

          <button
            onClick={handleSave}
            disabled={adjustmentValue === 0 || isSaving}
            className={styles.saveButton}
            aria-label={isSaving ? 'Saving adjustment' : 'Save adjustment'}
            aria-busy={isSaving}
            aria-disabled={adjustmentValue === 0 || isSaving}
          >
            {isSaving ? (
              <>
                <span className={styles.spinner} />
                Saving...
              </>
            ) : (
              'Save Adjustment'
            )}
          </button>
        </>
      )}
    </animated.div>
  );
}
