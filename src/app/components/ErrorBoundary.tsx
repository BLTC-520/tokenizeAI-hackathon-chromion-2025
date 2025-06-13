'use client';

import React, { Component, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { handleError } from '../utils/errorHandling';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log error using our error handling system
    handleError(error, {
      component: this.props.componentName || 'ErrorBoundary',
      action: 'component_render',
      details: errorInfo
    });

    this.setState({
      error,
      errorInfo
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-400 via-blue-500 to-purple-600 flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full border border-white/20 text-center"
          >
            <div className="text-6xl mb-6">💥</div>
            <h2 className="text-2xl font-bold text-white mb-4">Oops! Something went wrong</h2>
            <p className="text-white/80 mb-6">
              We encountered an unexpected error. Don't worry, your data is safe.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-white/60 text-sm cursor-pointer mb-2">
                  Technical Details (Dev Mode)
                </summary>
                <div className="bg-black/20 rounded-lg p-3 text-xs text-white/80 overflow-auto max-h-32">
                  <div className="font-bold mb-1">{this.state.error.name}:</div>
                  <div className="mb-2">{this.state.error.message}</div>
                  {this.state.error.stack && (
                    <pre className="whitespace-pre-wrap text-xs">{this.state.error.stack}</pre>
                  )}
                </div>
              </details>
            )}

            <div className="flex gap-4">
              <button
                onClick={this.handleRetry}
                className="flex-1 bg-white/20 hover:bg-white/30 text-white py-3 px-6 rounded-xl font-medium transition-all border border-white/30"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-3 px-6 rounded-xl font-medium transition-all"
              >
                Reload Page
              </button>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => (
    <ErrorBoundary componentName={componentName || Component.displayName || Component.name}>
      <Component {...props} ref={ref} />
    </ErrorBoundary>
  ));

  WrappedComponent.displayName = `withErrorBoundary(${componentName || Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Hook for handling errors in functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const captureError = React.useCallback((error: Error, context?: { action?: string; details?: any }) => {
    handleError(error, {
      component: 'useErrorHandler',
      action: context?.action || 'manual_error',
      ...context
    });
    setError(error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  // Throw error to be caught by error boundary
  if (error) {
    throw error;
  }

  return { captureError, clearError };
}

export default ErrorBoundary;