import React from "react";
import type { KatalixAction, KatalixNode } from "@katalix/core";
import { normalizeAction } from "@katalix/core";
import { resolveToken } from "@katalix/tokens";
import { useKatalixAction } from "./action-context.js";
import type { KatalixNodeProps } from "./render-node.js";
import { useTokenRegistry } from "./registry-context.js";
import { resolveWebSafeAreaStyle } from "./safe-area-style.js";
import { containsHtmlMarkup, sanitizeHtml } from "./sanitize-html.js";
import { isAllowedWebViewUrl } from "./webview-url.js";

type RenderNodeComponent = React.FC<KatalixNodeProps>;

const useActionHandler = (actionProp: unknown): (() => void) | undefined => {
  const dispatch = useKatalixAction();
  if (actionProp === undefined || actionProp === null) {
    return undefined;
  }
  return () => {
    const action: KatalixAction =
      typeof actionProp === "string"
        ? normalizeAction(actionProp)
        : (actionProp as KatalixAction);
    dispatch(action);
  };
};

const useValueChangeHandler = (
  actionProp: unknown,
): ((value: string) => void) | undefined => {
  const dispatch = useKatalixAction();
  if (actionProp === undefined || actionProp === null) {
    return undefined;
  }
  return (value: string) => {
    const base: KatalixAction =
      typeof actionProp === "string"
        ? normalizeAction(actionProp)
        : (actionProp as KatalixAction);
    dispatch({
      ...base,
      payload: { ...(base.payload ?? {}), value },
    });
  };
};

/** Web catalog renderers for extended node kinds (GAP-WEB-001). */
export const createWebCatalogRenderers = (
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

  const FabRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
    const registry = useTokenRegistry();
    const label = node.props.label as string | undefined;
    const onClick = useActionHandler(node.props.onPress);
    const backgroundColor = String(
      resolveToken("brand.primary", registry) ?? "#2563eb",
    );
    const color = String(resolveToken("button.primary.color", registry) ?? "#ffffff");
    return (
      <button
        type="button"
        data-katalix-kind="fab"
        onClick={onClick}
        aria-label={label ?? "Action"}
        style={{
          position: "fixed",
          right: 24,
          bottom: "max(24px, env(safe-area-inset-bottom, 0px))",
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: "none",
          backgroundColor,
          color,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {label ?? "+"}
      </button>
    );
  };

  const LoaderRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
    const message = node.props.message as string | undefined;
    const blocking = node.props.blocking !== false;
    if (!blocking) {
      return (
        <div data-katalix-kind="loader" role="status">
          {message ?? "Loading…"}
        </div>
      );
    }
    return (
      <div
        data-katalix-kind="loader"
        role="status"
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(15, 23, 42, 0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
        }}
      >
        {message ?? "Loading…"}
      </div>
    );
  };

  const RichTextRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
    const content = node.props.content as string | undefined;
    const format = node.props.format as string | undefined;
    const trusted = node.props.trusted === true;
    const text = content ?? "";

    if (format === "plain" || (!trusted && !containsHtmlMarkup(text))) {
      return (
        <div data-katalix-kind="richText" data-katalix-format="plain">
          {text}
        </div>
      );
    }

    if (trusted) {
      return (
        <div
          data-katalix-kind="richText"
          data-katalix-format="html-trusted"
          dangerouslySetInnerHTML={{ __html: text }}
        />
      );
    }

    return (
      <div
        data-katalix-kind="richText"
        data-katalix-format="html"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(text) }}
      />
    );
  };

  const CarouselRenderer: React.FC<KatalixNodeProps> = ({ node }) => (
    <div
      data-katalix-kind="carousel"
      style={{ display: "flex", flexDirection: "row", gap: 12, overflowX: "auto" }}
    >
      <RenderChildren>{node.children}</RenderChildren>
    </div>
  );

  const WebViewRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
    const source = node.props.source as string | undefined;
    if (!source) {
      return <div data-katalix-kind="webview">[webview]</div>;
    }
    if (!isAllowedWebViewUrl(source)) {
      return (
        <div data-katalix-kind="webview" data-katalix-error="invalid-url" role="alert">
          Invalid webview URL (only http/https allowed)
        </div>
      );
    }
    return (
      <iframe
        data-katalix-kind="webview"
        src={source}
        title="katalix-webview"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        referrerPolicy="no-referrer"
        style={{ width: "100%", minHeight: 240, border: "1px solid #e5e7eb" }}
      />
    );
  };

  const SelectRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
    const label = node.props.label as string | undefined;
    const options = (node.props.options as readonly string[] | undefined) ?? [];
    const initialValue = (node.props.value as string | undefined) ?? options[0] ?? "";
    const [value, setValue] = React.useState(initialValue);
    const onChange = useValueChangeHandler(node.props.onChange);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
      const next = e.target.value;
      setValue(next);
      onChange?.(next);
    };

    return (
      <label data-katalix-kind="select" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {label ? <span>{label}</span> : null}
        <select value={value} onChange={handleChange} aria-label={label}>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    );
  };

  const RadioRenderer: React.FC<KatalixNodeProps> = ({ node }) => {
    const label = node.props.label as string | undefined;
    const selected = Boolean(node.props.selected);
    const onSelect = useActionHandler(node.props.onPress);
    return (
      <label
        data-katalix-kind="radio"
        role="radio"
        aria-checked={selected}
        aria-label={label}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (onSelect && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onSelect();
          }
        }}
        tabIndex={onSelect ? 0 : undefined}
        style={{ display: "flex", alignItems: "center", gap: 8, cursor: onSelect ? "pointer" : "default" }}
      >
        <input type="radio" readOnly checked={selected} tabIndex={-1} />
        {label ?? ""}
      </label>
    );
  };

  return {
    fab: FabRenderer,
    loader: LoaderRenderer,
    richText: RichTextRenderer,
    carousel: CarouselRenderer,
    webview: WebViewRenderer,
    select: SelectRenderer,
    radio: RadioRenderer,
  };
};
