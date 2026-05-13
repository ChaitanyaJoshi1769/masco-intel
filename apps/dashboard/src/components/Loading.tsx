import React from 'react';
import { Card, CardBody } from '@/components';

export const Loading: React.FC<{ message?: string }> = ({
  message = 'Loading...',
}) => (
  <div className="p-6 space-y-6">
    <Card>
      <CardBody className="flex items-center justify-center py-12">
        <div className="text-center">
          <div
            className="w-8 h-8 rounded-full border-4 border-line-2 border-t-cyan animate-spin mx-auto mb-4"
            style={{ borderTopColor: 'var(--cyan)' }}
          />
          <p className="text-sm text-ink-2">{message}</p>
        </div>
      </CardBody>
    </Card>
  </div>
);

export default Loading;
