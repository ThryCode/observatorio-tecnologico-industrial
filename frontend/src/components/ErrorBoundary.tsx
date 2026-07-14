import { Component, type ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-8">
              <p className="text-sm text-destructive">Ocurrio un error inesperado.</p>
              <p className="text-xs text-muted-foreground">{this.state.error?.message}</p>
            </CardContent>
          </Card>
        )
      );
    }

    return this.props.children;
  }
}
