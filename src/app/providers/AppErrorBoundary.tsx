import type { ReactNode } from 'react';
import { Component } from 'react';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class AppErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: unknown): void {
    console.error('Unhandled frontend error', error);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <main
          style={{
            minHeight: '100dvh',
            display: 'grid',
            placeItems: 'center',
            padding: 24,
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'grid', gap: 12 }}>
            <h1 style={{ fontSize: 24 }}>Something went wrong</h1>
            <p style={{ color: 'var(--color-foreground-secondary)' }}>
              Please reload the app.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                border: 'none',
                borderRadius: 12,
                padding: '10px 14px',
                cursor: 'pointer',
                background: 'var(--color-accent-primary)',
                color: 'var(--color-foreground-on-accent)',
                fontWeight: 600,
              }}
            >
              Reload
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
