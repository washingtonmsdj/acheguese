import React, { Component, ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { logger } from "@/shared/utils/logger";

interface Props {
  children: ReactNode;
  widgetName?: string;
}

interface State {
  hasError: boolean;
}

/**
 * Error Boundary específico para widgets da sidebar
 * Falha silenciosamente sem quebrar toda a sidebar
 */
export class WidgetErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log silencioso - não quebra a UI
    logger.error(`Widget error (${this.props.widgetName}):`, error, {
      component: this.props.widgetName || "UnknownWidget",
    });

    // Rastrear erro
    if (typeof window !== "undefined") {
      import("@/shared/utils/errorTracking").then(({ trackError }) => {
        trackError(error, {
          component: this.props.widgetName || "UnknownWidget",
          action: "render",
          metadata: {
            componentStack: errorInfo.componentStack,
          },
        });
      });
    }
  }

  render() {
    if (this.state.hasError) {
      // Fallback minimalista que não quebra o layout
      return (
        <div className="bg-white/5 rounded-lg p-3 border border-white/10 flex items-center justify-center min-h-[100px]">
          <div className="text-center">
            <AlertCircle className="w-5 h-5 text-gray-500 mx-auto mb-2" />
            <p className="text-[0.6rem] text-gray-500">Não foi possível load</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
