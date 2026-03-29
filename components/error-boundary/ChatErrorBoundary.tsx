'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ChatErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chat error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="card p-6 text-center">
            <p className="text-gray-400 mb-4">
              Unable to load chat. Please refresh the page.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="btn-secondary"
            >
              Try Again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
