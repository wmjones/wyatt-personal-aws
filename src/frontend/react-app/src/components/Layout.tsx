import React, { ReactNode } from 'react';
import RetroHeader from './RetroHeader';
import RetroFooter from './RetroFooter';
import RetroPattern from './RetroPattern';
import CursorTrail from './CursorTrail';
import LoginBox from './LoginBox';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="relative min-h-screen">
      <CursorTrail />
      <RetroPattern />

      <div className="container mx-auto px-4 py-12">
        <LoginBox />
        <RetroHeader
          title="D3 VISUALIZATION DASHBOARD"
          subtitle="Interactive Data Visualization"
        />

        <main>{children}</main>

        <RetroFooter />
      </div>
    </div>
  );
};

export default Layout;
