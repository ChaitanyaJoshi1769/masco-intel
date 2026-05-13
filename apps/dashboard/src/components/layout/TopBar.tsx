import React from 'react';

interface TopBarProps {
  crumbs?: string[];
  rightExtras?: React.ReactNode;
  liveIndicator?: boolean;
  className?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  crumbs = [],
  rightExtras,
  liveIndicator = false,
  className = '',
}) => {
  const now = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <header
      className={`flex items-center justify-between px-6 py-4 border-b border-line-1 ${className}`.trim()}
      style={{ backgroundColor: 'var(--bg-1)' }}
    >
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm">
        {crumbs.map((crumb, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="text-ink-3">/</span>}
            <span className={i === crumbs.length - 1 ? 'text-ink-0' : 'text-ink-2'}>
              {crumb}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        {rightExtras}

        {/* Timestamp + Live Indicator */}
        <div className="flex items-center gap-2 text-xs text-ink-3 font-mono">
          {liveIndicator && (
            <span
              className="hq-dot hq-pulse"
              style={{ color: 'var(--cyan)' }}
              title="Live data"
            />
          )}
          <span>{now}</span>
        </div>
      </div>
    </header>
  );
};
