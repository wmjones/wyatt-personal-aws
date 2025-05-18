import React from 'react';

const RetroPattern: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[-1] bg-[#F5F5F7] pointer-events-none">
      <div className="absolute inset-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='52' height='26' viewBox='0 0 52 26' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M10 10c0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6h2c0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4v2c-3.314 0-6-2.686-6-6 0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6zm25.464-1.95l8.486 8.486-1.414 1.414-8.486-8.486 1.414-1.414z' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        opacity: 0.7
      }}></div>

      {/* Grid overlay */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'linear-gradient(to right, rgba(200, 200, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(200, 200, 255, 0.05) 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }}></div>

      {/* Corner dots */}
      <div className="absolute top-4 left-4 w-2 h-2 rounded-full bg-retro-purple opacity-70"></div>
      <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-retro-teal opacity-70"></div>
      <div className="absolute bottom-4 left-4 w-2 h-2 rounded-full bg-retro-yellow opacity-70"></div>
      <div className="absolute bottom-4 right-4 w-2 h-2 rounded-full bg-retro-pink opacity-70"></div>
    </div>
  );
};

export default RetroPattern;
