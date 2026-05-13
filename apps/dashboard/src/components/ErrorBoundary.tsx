import React, { ReactNode, ErrorInfo } from 'react';
import { Card, CardBody, CardHeader, Button } from '@/components';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: 'var(--bg-0)' }}>
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="text-3xl">⚠️</div>
                <div>
                  <h1 className="text-lg font-bold text-bad">Something went wrong</h1>
                  <p className="text-xs text-ink-3 mt-1">An unexpected error occurred</p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              <div
                className="p-4 rounded-lg text-xs font-mono overflow-auto max-h-32"
                style={{ backgroundColor: 'var(--bg-2)' }}
              >
                <p style={{ color: 'var(--bad)' }}>
                  {this.state.error?.toString() || 'Unknown error'}
                </p>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="text-xs text-ink-3">
                  <summary className="cursor-pointer font-semibold">Details</summary>
                  <pre className="mt-2 p-2 bg-bg-2 rounded overflow-auto max-h-48 whitespace-pre-wrap break-words">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <div className="space-y-2">
                <Button
                  variant="accent"
                  className="w-full"
                  onClick={this.handleReset}
                >
                  Try Again
                </Button>
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => {
                    window.location.href = '/';
                  }}
                >
                  Back to Home
                </Button>
              </div>

              <p className="text-xs text-ink-3 text-center">
                If the problem persists, please contact support.
              </p>
            </CardBody>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
