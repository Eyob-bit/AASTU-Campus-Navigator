import { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center mb-4">
            <AlertTriangle size={28} className="text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            {this.props.fallbackTitle || "Something went wrong"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-4 max-w-md">
            {this.props.fallbackDescription || "An unexpected error occurred. Please try again."}
          </p>
          {this.state.error && (
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-4 font-mono bg-gray-50 dark:bg-slate-900 px-4 py-2 rounded-lg max-w-full overflow-auto">
              {this.state.error.message}
            </p>
          )}
          <Button variant="primary" size="sm" onClick={this.handleReset}>
            <RefreshCw size={14} className="mr-1.5" />
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
