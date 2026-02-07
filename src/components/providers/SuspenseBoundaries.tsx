import React, { ReactNode } from 'react';

export function NavbarSuspenseFallback() {
  return (
    <div className="h-20 bg-white border-b border-slate-200/60 animate-pulse" />
  );
}

export function DailyPollSuspenseFallback() {
  return (
    <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-8 animate-pulse">
      <div className="h-6 w-48 bg-slate-200 rounded mb-4" />
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-12 bg-slate-200 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function AICoachSuspenseFallback() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-slate-200 rounded" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-slate-200 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function SmartImageSuspenseFallback() {
  return (
    <div className="bg-slate-100 animate-pulse w-full h-full" />
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class SuspenseErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Suspense boundary error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <p className="font-semibold">Failed to load content</p>
            <p className="text-sm mt-1">Please refresh the page</p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
