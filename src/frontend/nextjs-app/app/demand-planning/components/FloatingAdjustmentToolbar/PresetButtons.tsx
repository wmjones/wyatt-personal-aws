'use client';

import styles from './FloatingAdjustmentToolbar.module.css';

interface PresetButtonsProps {
  onPresetClick: (value: number) => void;
  disabled?: boolean;
}

const PRESETS = [
  { label: '-10%', value: -10 },
  { label: '-5%', value: -5 },
  { label: '+5%', value: 5 },
  { label: '+10%', value: 10 },
];

export default function PresetButtons({
  onPresetClick,
  disabled = false
}: PresetButtonsProps) {
  return (
    <div className={styles.presetButtons}>
      {PRESETS.map((preset) => (
        <button
          key={preset.value}
          onClick={() => onPresetClick(preset.value)}
          disabled={disabled}
          className={styles.presetButton}
          aria-label={`Set adjustment to ${preset.label}`}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
