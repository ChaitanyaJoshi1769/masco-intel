import React from 'react';
import { Button, Card, CardBody } from '@/components';

interface ErrorProps {
  error: Error | null;
  onRetry?: () => void;
  title?: string;
}

export const Error: React.FC<ErrorProps> = ({
  error,
  onRetry,
  title = 'Something went wrong',
}) => (
  <div className="p-6 space-y-6">
    <Card>
      <CardBody className="py-12">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold mb-2 text-bad">{title}</h3>
          {error && (
            <p className="text-sm text-ink-2 mb-6">{error.message}</p>
          )}
          {onRetry && (
            <Button variant="primary" onClick={onRetry}>
              Try Again
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  </div>
);

export default Error;
