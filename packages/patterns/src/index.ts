import {
  createNode,
  normalizeAction,
  type KatalixAnimation,
  type KatalixNode,
  type KatalixStyle,
} from "@katalix/core";

export interface PatternAction {
  readonly label: string;
  readonly onPress: string;
}

export interface CardPatternOptions {
  readonly title: string;
  readonly body?: string;
  readonly action?: PatternAction;
  readonly animation?: KatalixAnimation;
  readonly style?: KatalixStyle;
}

export interface EmptyStatePatternOptions {
  readonly title: string;
  readonly description: string;
  readonly action?: PatternAction;
  readonly animation?: KatalixAnimation;
}

export interface SectionPatternOptions {
  readonly title: string;
  readonly children: readonly KatalixNode[];
  readonly animation?: KatalixAnimation;
}

const actionButton = (action: PatternAction): KatalixNode =>
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
}: CardPatternOptions): KatalixNode => {
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
}: EmptyStatePatternOptions): KatalixNode =>
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
}: SectionPatternOptions): KatalixNode =>
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
