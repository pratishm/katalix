import React from "react";
import type { KatalixNode } from "@katalix/core";
import type { KatalixNodeProps } from "./render-node.js";

/** Recursively render children — forward-declared from render-node. */
type RenderNodeComponent = React.FC<KatalixNodeProps>;

import { useTokenRegistry } from "./registry-context.js";

export const createWebExtraRenderers = (
  RenderNode: RenderNodeComponent,
): Readonly<Record<string, React.FC<KatalixNodeProps>>> => {
  const RenderChildren: React.FC<{ children?: readonly KatalixNode[] }> = ({
    children,
  }) => {
    if (!children || children.length === 0) {
      return null;
    }
    return (
      <>
        {children.map((child, i) => (
          <RenderNode key={child.id ?? `${child.kind}-${i}`} node={child} />
        ))}
      </>
    );
  };

  const ModalRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
    const visible = node.props.visible !== false;
    if (!visible) {
      return null;
    }
    return (
      <div
        data-katalix-kind="modal"
        role="dialog"
        aria-modal="true"
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(15, 23, 42, 0.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}
      >
        <div
          data-katalix-modal-content="true"
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 12,
            padding: 24,
            maxWidth: "90vw",
            maxHeight: "90vh",
            overflow: "auto",
          }}
        >
          <RenderChildren>{node.children}</RenderChildren>
        </div>
      </div>
    );
  };

  const ToastRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
    const message = node.props.message as string | undefined;
    const variant = node.props.variant as string | undefined;
    const registry = useTokenRegistry();
    const background =
      variant === "error"
        ? "#fee2e2"
        : String(registry["surface.elevated"] ?? "#ecfdf5");
    return (
      <div
        data-katalix-kind="toast"
        role="status"
        style={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          padding: "12px 16px",
          borderRadius: 8,
          backgroundColor: background,
          boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
          zIndex: 1100,
        }}
      >
        {message ?? ""}
      </div>
    );
  };

  const SkeletonRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
    const width = (node.props.width as string | number | undefined) ?? "100%";
    const height = (node.props.height as string | number | undefined) ?? 16;
    const registry = useTokenRegistry();
    const background = String(registry["border.subtle"] ?? "#e5e7eb");
    return (
      <div
        data-katalix-kind="skeleton"
        aria-hidden="true"
        style={{
          width,
          height,
          backgroundColor: background,
          borderRadius: 4,
          opacity: 0.7,
          animation: "katalix-skeleton-pulse 1.2s ease-in-out infinite",
        }}
      />
    );
  };

  const AvatarRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
    const source = node.props.source as string | undefined;
    const initials = node.props.initials as string | undefined;
    if (source) {
      return (
        <img
          data-katalix-kind="avatar"
          src={source}
          alt={initials ?? "avatar"}
          style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }}
        />
      );
    }
    return (
      <div
        data-katalix-kind="avatar"
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          backgroundColor: "#94a3b8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontWeight: 600,
        }}
      >
        {initials ?? "?"}
      </div>
    );
  };

  const SearchBarRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
    const placeholder = node.props.placeholder as string | undefined;
    return (
      <input
        data-katalix-kind="searchBar"
        type="search"
        placeholder={placeholder}
        style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db" }}
      />
    );
  };

  const FieldRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
    const label = node.props.label as string | undefined;
    return (
      <label data-katalix-kind="field" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {label ? <span>{label}</span> : null}
        <RenderChildren>{node.children}</RenderChildren>
      </label>
    );
  };

  return {
    modal: ModalRenderer,
    toast: ToastRenderer,
    skeleton: SkeletonRenderer,
    avatar: AvatarRenderer,
    searchBar: SearchBarRenderer,
    field: FieldRenderer,
  };
};
