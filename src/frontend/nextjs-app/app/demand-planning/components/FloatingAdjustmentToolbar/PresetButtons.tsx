'use client';

import { useState } from 'react';
import { animated, useSpring } from '@react-spring/web';
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
  const [clickedButton, setClickedButton] = useState<number | null>(null);

  const handleClick = (value: number) => {
    setClickedButton(value);
    onPresetClick(value);
    // Reset animation state after animation completes
    setTimeout(() => setClickedButton(null), 300);
  };

  return (
    <div className={styles.presetButtons}>
      {PRESETS.map((preset) => (
        <AnimatedPresetButton
          key={preset.value}
          preset={preset}
          onClick={() => handleClick(preset.value)}
          disabled={disabled}
          isClicked={clickedButton === preset.value}
        />
      ))}
    </div>
  );
}

interface AnimatedPresetButtonProps {
  preset: { label: string; value: number };
  onClick: () => void;
  disabled: boolean;
  isClicked: boolean;
}

function AnimatedPresetButton({ preset, onClick, disabled, isClicked }: AnimatedPresetButtonProps) {
  const buttonSpring = useSpring({
    transform: isClicked ? 'scale(0.92)' : 'scale(1)',
    backgroundColor: isClicked ? '#2563EB' : '#FFFFFF',
    color: isClicked ? '#FFFFFF' : '#374151',
    config: { tension: 300, friction: 20 }
  });

  return (
    <animated.button
      onClick={onClick}
      disabled={disabled}
      className={styles.presetButton}
      style={buttonSpring}
      aria-label={`Set adjustment to ${preset.label}`}
    >
      {preset.label}
    </animated.button>
  );
}
