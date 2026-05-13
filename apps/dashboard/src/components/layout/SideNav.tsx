import React from 'react';

interface NavItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href: string;
  badge?: string | number;
}

interface SideNavProps {
  active?: string;
  items: NavItem[];
  onNavigate?: (id: string) => void;
  logo?: React.ReactNode;
}

export const SideNav: React.FC<SideNavProps> = ({
  active,
  items,
  onNavigate,
  logo,
}) => {
  return (
    <nav className="flex flex-col h-full w-56 border-r border-line-1" style={{ backgroundColor: 'var(--bg-1)' }}>
      {/* Logo/Header */}
      {logo && (
        <div className="px-4 py-4 border-b border-line-1">
          {logo}
        </div>
      )}

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-4">
        {items.map((item) => (
          <NavLink
            key={item.id}
            item={item}
            isActive={active === item.id}
            onNavigate={() => onNavigate?.(item.id)}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-line-1 p-4">
        <div className="text-xs text-ink-3">Masco Intel v3.0</div>
      </div>
    </nav>
  );
};

interface NavLinkProps {
  item: NavItem;
  isActive: boolean;
  onNavigate: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ item, isActive, onNavigate }) => {
  const baseClass = 'flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer transition-colors';
  const activeClass = isActive
    ? 'text-ink-0 bg-bg-3'
    : 'text-ink-2 hover:text-ink-1 hover:bg-bg-2';

  return (
    <a
      href={item.href}
      onClick={(e) => {
        e.preventDefault();
        onNavigate();
      }}
      className={`${baseClass} ${activeClass}`.trim()}
    >
      {item.icon && <span className="flex-shrink-0 w-5 h-5">{item.icon}</span>}
      <span className="flex-1">{item.label}</span>
      {item.badge && (
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-4)' }}>
          {item.badge}
        </span>
      )}
    </a>
  );
};
