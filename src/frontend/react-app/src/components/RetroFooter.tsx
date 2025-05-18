import React from 'react';

const RetroFooter: React.FC = () => {
  return (
    <footer className="mt-20 text-center">
      <div className="zigzag mb-8"></div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div>
          <h4 className="retro-text text-xl text-retro-teal mb-4">NAVIGATION</h4>
          <ul className="space-y-2 mono-text">
            <li><a href="/" className="hover:text-retro-purple">Home</a></li>
            <li><a href="/demo" className="hover:text-retro-purple">Demo</a></li>
            <li><a href="/about" className="hover:text-retro-purple">About</a></li>
          </ul>
        </div>

        <div>
          <h4 className="retro-text text-xl text-retro-teal mb-4">RESOURCES</h4>
          <ul className="space-y-2 mono-text">
            <li><a href="https://d3js.org/" target="_blank" rel="noopener noreferrer" className="hover:text-retro-purple">D3.js</a></li>
            <li><a href="https://reactjs.org/" target="_blank" rel="noopener noreferrer" className="hover:text-retro-purple">React</a></li>
            <li><a href="https://aws.amazon.com/" target="_blank" rel="noopener noreferrer" className="hover:text-retro-purple">AWS</a></li>
          </ul>
        </div>

        <div>
          <h4 className="retro-text text-xl text-retro-teal mb-4">CONNECT</h4>
          <p className="mono-text mb-2">Join our retro visualization community!</p>
          <div className="flex justify-center space-x-4">
            <a href="mailto:contact@example.com" aria-label="Email" className="text-retro-purple hover:text-retro-pink text-xl">
              <span>📧</span>
            </a>
            <a href="https://example.com/chat" aria-label="Chat" className="text-retro-purple hover:text-retro-pink text-xl">
              <span>💬</span>
            </a>
            <a href="tel:+12345678900" aria-label="Phone" className="text-retro-purple hover:text-retro-pink text-xl">
              <span>📱</span>
            </a>
          </div>
        </div>
      </div>

      <p className="mono-text text-sm">
        D3 Visualization Dashboard - © {new Date().getFullYear()} - Deployed via CI/CD Pipeline
      </p>
      <p className="mono-text text-xs mt-2 text-gray-500">
        <span className="animate-blink">►</span> Best viewed with Netscape Navigator <span className="animate-blink">◄</span>
      </p>
    </footer>
  );
};

export default RetroFooter;
