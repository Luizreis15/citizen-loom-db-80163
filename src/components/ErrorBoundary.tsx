import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="max-w-md w-full bg-destructive/10 border border-destructive rounded-lg p-6">
            <h1 className="text-2xl font-bold text-destructive mb-4">
              Erro na Aplicação
            </h1>
            <p className="text-sm mb-4">
              {this.state.error?.message || "Ocorreu um erro desconhecido"}
            </p>
            <pre className="text-xs bg-muted p-3 rounded overflow-auto">
              {this.state.error?.stack}
            </pre>
            <button
              onClick={() => window.location.href = "/"}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Recarregar Aplicação
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
