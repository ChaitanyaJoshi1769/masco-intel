import React from 'react';
import '../../../src/tokens.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'md', icon, children, className = '', ...props }, ref) => {
    const baseClass = 'hq-btn';
    const variantClass = variant === 'primary' ? 'hq-btn-primary' : variant === 'accent' ? 'hq-btn-accent' : '';

    const sizeClasses = {
      sm: 'text-xs px-2 py-1',
      md: 'text-sm',
      lg: 'text-base px-3 py-2',
    };

    return (
      <button
        ref={ref}
        className={`${baseClass} ${variantClass} ${sizeClasses[size]} ${className}`.trim()}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
