import React from 'react';

interface RetroHeaderProps {
  title: string;
  subtitle?: string;
}

const RetroHeader: React.FC<RetroHeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="text-center mb-12 relative">
      <h1 className="pixel-text text-4xl md:text-6xl font-bold text-retro-purple mb-4 text-shadow animate-bounce-slow">
        {title}
      </h1>
      {subtitle && (
        <p className="retro-text text-2xl md:text-3xl text-retro-teal">
          {subtitle}
          <span className="inline-block ml-1 animate-blink">_</span>
        </p>
      )}
      <div className="max-w-sm mx-auto my-6 h-2 bg-gradient-to-r from-retro-pink via-retro-purple to-retro-teal"></div>
    </div>
  );
};

export default RetroHeader;
