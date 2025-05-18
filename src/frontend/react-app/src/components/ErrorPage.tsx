import React from 'react';

const ErrorPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="retro-card p-8 max-w-md w-full text-center">
        <h2 className="pixel-text text-4xl text-retro-pink mb-4">ERROR 404</h2>
        <div className="mb-4 text-center">
          <div className="mono-text text-6xl mb-2">¯\_(ツ)_/¯</div>
          <div className="zigzag my-4"></div>
        </div>
        <p className="mono-text mb-6">Oops! Looks like this page got lost in cyberspace.</p>
        <a href="/" className="retro-button inline-block">
          RETURN HOME
        </a>
      </div>

      <div className="mt-8 grid grid-cols-4 gap-2">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className={`h-2 w-full bg-${
            i === 0 ? 'retro-purple' :
            i === 1 ? 'retro-teal' :
            i === 2 ? 'retro-pink' :
            'retro-yellow'
          }`}></div>
        ))}
      </div>
    </div>
  );
};

export default ErrorPage;
