import React from 'react';

interface MarqueeTextProps {
  text: string;
}

const MarqueeText: React.FC<MarqueeTextProps> = ({ text }) => {
  return (
    <div className="bg-retro-yellow text-black py-1 overflow-hidden border-y-2 border-black my-8">
      <div className="whitespace-nowrap mono-text font-bold inline-block animate-[marquee_15s_linear_infinite]">
        {Array(5).fill(text).map((item, index) => (
          <span key={index} className="mx-4">{item}</span>
        ))}
      </div>
    </div>
  );
};

export default MarqueeText;
