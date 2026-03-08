import React, { Component, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
          <div className="text-center max-w-md space-y-4">
            <h1 className="text-2xl font-bold text-foreground">Une erreur est survenue</h1>
            <p className="text-muted-foreground text-sm">{this.state.error?.message}</p>
            <button
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
              onClick={() => window.location.reload()}
            >
              Recharger l'application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
