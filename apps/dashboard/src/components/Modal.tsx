import React from 'react';
import { Button } from './primitives/Button';

interface ModalProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  confirmVariant?: 'primary' | 'accent' | 'default';
  cancelText?: string;
  isDangerous?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  description,
  children,
  onClose,
  onConfirm,
  confirmText = 'Confirm',
  confirmVariant = 'primary',
  cancelText = 'Cancel',
  isDangerous = false,
  loading = false,
  size = 'md',
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm transition-opacity"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative rounded-lg border border-line-1 shadow-lg overflow-hidden w-full ${sizeClasses[size]} transition-all`}
        style={{ backgroundColor: 'var(--bg-1)' }}
      >
        {/* Header */}
        {title && (
          <div
            className="px-6 py-4 border-b border-line-1"
            style={{ backgroundColor: 'var(--bg-2)' }}
          >
            <h2 className="text-lg font-semibold">{title}</h2>
            {description && (
              <p className="text-sm text-ink-3 mt-1">{description}</p>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {children}
        </div>

        {/* Footer */}
        {onConfirm && (
          <div
            className="px-6 py-4 border-t border-line-1 flex gap-3 justify-end"
            style={{ backgroundColor: 'var(--bg-2)' }}
          >
            <Button
              variant="default"
              onClick={onClose}
              disabled={loading}
            >
              {cancelText}
            </Button>
            <Button
              variant={isDangerous ? 'default' : confirmVariant}
              onClick={onConfirm}
              disabled={loading}
              style={
                isDangerous
                  ? { color: 'var(--bad)', borderColor: 'var(--bad)' }
                  : undefined
              }
            >
              {loading ? 'Loading...' : confirmText}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
