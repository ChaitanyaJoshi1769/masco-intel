import React from 'react';

type ChipVariant = 'default' | 'cyan' | 'violet' | 'ok' | 'warn' | 'bad';

interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: ChipVariant;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Chip = React.forwardRef<HTMLSpanElement, ChipProps>(
  ({ variant = 'default', icon, children, className = '', ...props }, ref) => {
    const variantClass = variant !== 'default' ? `hq-chip-${variant}` : '';

    return (
      <span
        ref={ref}
        className={`hq-chip ${variantClass} ${className}`.trim()}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </span>
    );
  }
);

Chip.displayName = 'Chip';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: ChipVariant;
  children: React.ReactNode;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', children, className = '', ...props }, ref) => {
    const variantClass = variant !== 'default' ? `hq-chip-${variant}` : '';

    return (
      <span
        ref={ref}
        className={`hq-chip rounded-full px-2 py-1 ${variantClass} ${className}`.trim()}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
