import React from "react";
import type { KatalixNode } from "@katalix/core";

interface ErrorBoundaryProps {
  readonly node: KatalixNode;
  readonly children: React.ReactNode;
}

interface ErrorBoundaryState {
  readonly hasError: boolean;
}

/** Minimal error boundary for `errorBoundary` nodes (GAP-ARCH-005 / GAP-WEB-001). */
export class KatalixErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override render(): React.ReactNode {
    if (this.state.hasError) {
      const fallback = this.props.node.props.fallback as string | undefined;
      return (
        <div data-katalix-kind="errorBoundary" data-katalix-error="true" role="alert">
          {fallback ?? "Something went wrong."}
        </div>
      );
    }
    return (
      <div data-katalix-kind="errorBoundary">{this.props.children}</div>
    );
  }
}
