import React, { useState, useEffect } from 'react';

interface TrailDot {
  id: number;
  x: number;
  y: number;
  size: number;
}

const CursorTrail: React.FC = () => {
  const [trail, setTrail] = useState<TrailDot[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCounter((prev) => prev + 1);

      setTrail((prevTrail) => {
        // Add new dot
        const newTrail = [
          ...prevTrail,
          {
            id: counter,
            x: mousePos.x,
            y: mousePos.y,
            size: Math.random() * 15 + 5, // Random size between 5 and 20
          },
        ];

        // Keep only the 15 most recent dots
        return newTrail.slice(-15);
      });
    }, 50);

    return () => clearInterval(interval);
  }, [mousePos, counter]);

  return (
    <>
      {trail.map((dot) => (
        <div
          key={dot.id}
          className="cursor-trail"
          style={{
            left: `${dot.x}px`,
            top: `${dot.y}px`,
            width: `${dot.size}px`,
            height: `${dot.size}px`,
          }}
        />
      ))}
    </>
  );
};

export default CursorTrail;
