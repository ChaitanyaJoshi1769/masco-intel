import React, { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  type: ToastType;
  message: string;
  duration?: number;
  onClose?: () => void;
}

const getToastColors = (type: ToastType) => {
  switch (type) {
    case 'success':
      return { bg: 'var(--bg-2)', border: 'var(--ok)', icon: '✓', color: 'var(--ok)' };
    case 'error':
      return { bg: 'var(--bg-2)', border: 'var(--bad)', icon: '⚠', color: 'var(--bad)' };
    case 'warning':
      return { bg: 'var(--bg-2)', border: 'var(--warn)', icon: '!', color: 'var(--warn)' };
    case 'info':
      return { bg: 'var(--bg-2)', border: 'var(--cyan)', icon: 'ℹ', color: 'var(--cyan)' };
  }
};

export const Toast: React.FC<ToastProps> = ({
  type,
  message,
  duration = 4000,
  onClose,
}) => {
  const colors = getToastColors(type);

  useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div
      className="p-4 rounded-lg border flex items-start gap-3 shadow-lg animate-pulse"
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
      }}
    >
      <div
        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-sm font-bold"
        style={{ backgroundColor: colors.color, color: 'var(--bg-0)' }}
      >
        {colors.icon}
      </div>
      <p className="flex-1 text-sm text-ink-1">{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 text-ink-3 hover:text-ink-2 transition"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default Toast;
