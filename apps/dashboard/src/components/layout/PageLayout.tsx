import React from 'react';
import { SideNav } from './SideNav';
import { TopBar } from './TopBar';

interface NavItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href: string;
  badge?: string | number;
}

interface PageLayoutProps {
  active?: string;
  navItems: NavItem[];
  onNavigate?: (id: string) => void;
  logo?: React.ReactNode;
  crumbs?: string[];
  rightExtras?: React.ReactNode;
  liveIndicator?: boolean;
  children: React.ReactNode;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  active,
  navItems,
  onNavigate,
  logo,
  crumbs,
  rightExtras,
  liveIndicator,
  children,
}) => {
  return (
    <div className="flex h-screen bg-bg-0">
      {/* Sidebar */}
      <SideNav
        active={active}
        items={navItems}
        onNavigate={onNavigate}
        logo={logo}
      />

      {/* Main Content */}
      <div className="flex flex-col flex-1">
        {/* Top Bar */}
        <TopBar
          crumbs={crumbs}
          rightExtras={rightExtras}
          liveIndicator={liveIndicator}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
