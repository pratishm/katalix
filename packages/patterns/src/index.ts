import {
  createNode,
  normalizeAction,
  type LattixAnimation,
  type LattixNode,
  type LattixStyle,
} from "@lattix/core";

export interface PatternAction {
  readonly label: string;
  readonly onPress: string;
}

export interface CardPatternOptions {
  readonly title: string;
  readonly body?: string;
  readonly action?: PatternAction;
  readonly animation?: LattixAnimation;
  readonly style?: LattixStyle;
}

export interface EmptyStatePatternOptions {
  readonly title: string;
  readonly description: string;
  readonly action?: PatternAction;
  readonly animation?: LattixAnimation;
}

export interface SectionPatternOptions {
  readonly title: string;
  readonly children: readonly LattixNode[];
  readonly animation?: LattixAnimation;
}

const actionButton = (action: PatternAction): LattixNode =>
  createNode("button", {
    props: {
      label: action.label,
      onPress: normalizeAction(action.onPress),
    },
  });

export const card = ({
  title,
  body,
  action,
  animation,
  style,
}: CardPatternOptions): LattixNode => {
  const children = [
    createNode("text", { props: { content: title }, style: { fontWeight: "bold" } }),
    ...(body ? [createNode("text", { props: { content: body } })] : []),
    ...(action ? [actionButton(action)] : []),
  ];

  return createNode("box", {
    animation,
    style: {
      padding: 16,
      borderRadius: 12,
      background: "surface.canvas",
      ...style,
    },
    children: [
      createNode("stack", {
        style: { gap: 8 },
        children,
      }),
    ],
  });
};

export const emptyState = ({
  title,
  description,
  action,
  animation,
}: EmptyStatePatternOptions): LattixNode =>
  createNode("stack", {
    animation,
    style: { gap: 8, alignItems: "center" },
    children: [
      createNode("text", {
        props: { content: title },
        style: { fontWeight: "bold", textAlign: "center" },
      }),
      createNode("text", {
        props: { content: description },
        style: { color: "text.muted", textAlign: "center" },
      }),
      ...(action ? [actionButton(action)] : []),
    ],
  });

export const section = ({
  title,
  children,
  animation,
}: SectionPatternOptions): LattixNode =>
  createNode("stack", {
    animation,
    style: { gap: 12 },
    children: [
      createNode("text", {
        props: { content: title },
        style: { fontWeight: "bold", fontSize: 20 },
      }),
      ...children,
    ],
  });
