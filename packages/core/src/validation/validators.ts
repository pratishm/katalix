import {
  CONTAINER_KINDS,
  isKnownNodeKind,
  LEAF_KINDS,
} from "../nodes/kinds.js";
import type { LattixAnimation } from "../types/animation.js";
import type { LattixDiagnostic } from "../types/diagnostic.js";
import type { LattixNode } from "../types/node.js";
import { diagnostic, type LattixValidator } from "./contracts.js";

const requiredTextContent: LattixValidator = {
  name: "required-text-content",
  validate(node) {
    if (node.kind !== "text") {
      return [];
    }
    const content = node.props["content"];
    if (typeof content === "string" && content.length > 0) {
      return [];
    }
    return [
      diagnostic({
        code: "LATTIX_TEXT_MISSING_CONTENT",
        summary: "Text node is missing content",
        message: `Text node at "${node.meta?.path ?? node.kind}" is missing required prop "content".`,
        nodeKind: node.kind,
        path: node.meta?.path,
        field: "content",
        received: content,
        expected: "non-empty string",
        suggestion: 'Set props.content, e.g. props: { content: "Hello" }.',
        source: node.meta?.source,
      }),
    ];
  },
};

const requiredButtonLabel: LattixValidator = {
  name: "required-button-label",
  validate(node) {
    if (node.kind !== "button") {
      return [];
    }
    const label = node.props["label"];
    if (typeof label === "string" && label.length > 0) {
      return [];
    }
    return [
      diagnostic({
        code: "LATTIX_BUTTON_MISSING_LABEL",
        summary: "Button node is missing label",
        message: `Button node at "${node.meta?.path ?? node.kind}" is missing required prop "label".`,
        nodeKind: node.kind,
        path: node.meta?.path,
        field: "label",
        received: label,
        expected: "non-empty string",
        suggestion: 'Set props.label, e.g. props: { label: "Continue" }.',
        source: node.meta?.source,
      }),
    ];
  },
};

const childPlacement: LattixValidator = {
  name: "child-placement",
  validate(node) {
    const hasChildren = (node.children?.length ?? 0) > 0;
    if (LEAF_KINDS.has(node.kind as never) && hasChildren) {
      return [
        diagnostic({
          code: "LATTIX_INVALID_CHILDREN",
          summary: "Leaf node cannot have children",
          message: `Node kind "${node.kind}" at "${node.meta?.path ?? node.kind}" does not accept children.`,
          nodeKind: node.kind,
          path: node.meta?.path,
          field: "children",
          received: node.children?.length,
          expected: "no children",
          suggestion: "Remove children or use a container kind (stack, row, box, screen).",
          source: node.meta?.source,
        }),
      ];
    }
    return [];
  },
};

const unknownKind: LattixValidator = {
  name: "unknown-kind",
  validate(node) {
    if (isKnownNodeKind(node.kind)) {
      return [];
    }
    return [
      diagnostic({
        code: "LATTIX_UNKNOWN_NODE_KIND",
        summary: "Unknown node kind",
        message: `Node at "${node.meta?.path ?? "root"}" uses unknown kind "${node.kind}".`,
        nodeKind: node.kind,
        path: node.meta?.path,
        field: "kind",
        received: node.kind,
        expected: "a known LattixNodeKind",
        suggestion: "Use a built-in kind or register a custom kind in a future patterns package.",
        source: node.meta?.source,
      }),
    ];
  },
};

const duplicateId: LattixValidator = {
  name: "duplicate-id",
  validate(node, context) {
    if (!node.id) {
      return [];
    }
    const existingPath = context.seenIds.get(node.id);
    if (existingPath) {
      return [
        diagnostic({
          code: "LATTIX_DUPLICATE_ID",
          summary: "Duplicate node id",
          message: `Duplicate id "${node.id}" at "${node.meta?.path}" (already used at "${existingPath}").`,
          nodeKind: node.kind,
          path: node.meta?.path,
          field: "id",
          received: node.id,
          expected: "unique id per tree",
          suggestion: "Assign a unique id to each node or omit ids.",
          source: node.meta?.source,
        }),
      ];
    }
    context.seenIds.set(node.id, node.meta?.path ?? node.kind);
    return [];
  },
};

const screenRoot: LattixValidator = {
  name: "screen-root",
  validate(node, context) {
    if (context.path === "" && node.kind !== "screen") {
      return [
        diagnostic({
          code: "LATTIX_INVALID_ROOT",
          summary: "Root must be a screen",
          message: `Semantic tree root must be kind "screen", received "${node.kind}".`,
          nodeKind: node.kind,
          path: node.meta?.path,
          field: "kind",
          received: node.kind,
          expected: "screen",
          suggestion: 'Wrap your UI in createNode("screen", { children: [...] }).',
          source: node.meta?.source,
        }),
      ];
    }
    return [];
  },
};

const ANIMATION_PRESETS = new Set([
  "fade-in",
  "fade-out",
  "slide-up",
  "slide-down",
  "scale-in",
  "pulse",
  "shake",
]);

const ANIMATION_TRIGGERS = new Set([
  "mount",
  "press",
  "hover",
  "visible",
  "focus",
]);

const animationBlocks = (
  animation: LattixNode["animation"],
): readonly LattixAnimation[] => {
  if (!animation) {
    return [];
  }
  return Array.isArray(animation) ? [...animation] : [animation as LattixAnimation];
};

const isNonNegativeNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

const isValidRepeat = (value: unknown): boolean =>
  value === undefined ||
  value === "infinite" ||
  (Number.isInteger(value) && typeof value === "number" && value >= 0);

const animationDiagnostic = (
  node: LattixNode,
  field: string,
  code: string,
  summary: string,
  received: unknown,
  expected: string,
  suggestion: string,
): LattixDiagnostic =>
  diagnostic({
    code,
    summary,
    message: `Animation field "${field}" on "${node.kind}" at "${node.meta?.path ?? node.kind}" is invalid.`,
    nodeKind: node.kind,
    path: node.meta?.path,
    field,
    received,
    expected,
    suggestion,
    source: node.meta?.source,
  });

const validateAnimationTiming = (
  node: LattixNode,
  field: string,
  value: unknown,
  suggestion: string,
): LattixDiagnostic[] => {
  if (value === undefined || isNonNegativeNumber(value)) {
    return [];
  }
  return [
    animationDiagnostic(
      node,
      field,
      field.endsWith("delay")
        ? "LATTIX_INVALID_ANIMATION_DELAY"
        : "LATTIX_INVALID_ANIMATION_DURATION",
      field.endsWith("delay")
        ? "Invalid animation delay"
        : "Invalid animation duration",
      value,
      "non-negative number of milliseconds",
      suggestion,
    ),
  ];
};

const validateAnimationRepeat = (
  node: LattixNode,
  field: string,
  value: unknown,
): LattixDiagnostic[] => {
  if (isValidRepeat(value)) {
    return [];
  }
  return [
    animationDiagnostic(
      node,
      field,
      "LATTIX_INVALID_ANIMATION_REPEAT",
      "Invalid animation repeat",
      value,
      'a non-negative integer or "infinite"',
      field.includes("transition")
        ? 'Set transition.repeat to a count such as 2 or to "infinite".'
        : 'Set repeat to a count such as 2 or to "infinite".',
    ),
  ];
};

const validateAnimationBlock = (
  node: LattixNode,
  animation: LattixAnimation,
): LattixDiagnostic[] => {
  const diagnostics: LattixDiagnostic[] = [];

  if (
    animation.preset !== undefined &&
    !ANIMATION_PRESETS.has(animation.preset)
  ) {
    diagnostics.push(
      animationDiagnostic(
        node,
        "animation.preset",
        "LATTIX_INVALID_ANIMATION_PRESET",
        "Unsupported animation preset",
        animation.preset,
        "one of fade-in, fade-out, slide-up, slide-down, scale-in, pulse, shake",
        'Use a supported preset, e.g. { preset: "fade-in", trigger: "mount" }.',
      ),
    );
  }

  if (
    animation.trigger !== undefined &&
    !ANIMATION_TRIGGERS.has(animation.trigger)
  ) {
    diagnostics.push(
      animationDiagnostic(
        node,
        "animation.trigger",
        "LATTIX_INVALID_ANIMATION_TRIGGER",
        "Unsupported animation trigger",
        animation.trigger,
        "one of mount, press, hover, visible, focus",
        'Use a supported trigger, e.g. { trigger: "mount" }.',
      ),
    );
  }

  diagnostics.push(
    ...validateAnimationTiming(
      node,
      "animation.duration",
      animation.duration,
      "Set duration to a non-negative millisecond value.",
    ),
    ...validateAnimationTiming(
      node,
      "animation.delay",
      animation.delay,
      "Set delay to a non-negative millisecond value.",
    ),
    ...validateAnimationRepeat(node, "animation.repeat", animation.repeat),
    ...validateAnimationTiming(
      node,
      "animation.transition.duration",
      animation.transition?.duration,
      "Set transition.duration to a non-negative millisecond value.",
    ),
    ...validateAnimationTiming(
      node,
      "animation.transition.delay",
      animation.transition?.delay,
      "Set transition.delay to a non-negative millisecond value.",
    ),
    ...validateAnimationRepeat(
      node,
      "animation.transition.repeat",
      animation.transition?.repeat,
    ),
  );

  return diagnostics;
};

const animationConfig: LattixValidator = {
  name: "animation-config",
  validate: (node) =>
    animationBlocks(node.animation).flatMap((animation) =>
      validateAnimationBlock(node, animation),
    ),
};

const emptyContainer: LattixValidator = {
  name: "empty-container",
  validate(node) {
    if (!CONTAINER_KINDS.has(node.kind as never)) {
      return [];
    }
    if (node.kind === "button") {
      return [];
    }
    const childCount = node.children?.length ?? 0;
    if (childCount === 0 && node.kind !== "spacer") {
      return [
        diagnostic({
          code: "LATTIX_EMPTY_CONTAINER",
          summary: "Container has no children",
          message: `Container "${node.kind}" at "${node.meta?.path ?? node.kind}" has no children.`,
          nodeKind: node.kind,
          path: node.meta?.path,
          field: "children",
          received: 0,
          expected: "at least one child",
          suggestion: "Add child nodes or use a leaf kind if empty.",
          source: node.meta?.source,
        }),
      ];
    }
    return [];
  },
};

/** Built-in validators shipped with @lattix/core (Phase 1 baseline). */
export const CORE_VALIDATORS: readonly LattixValidator[] = [
  screenRoot,
  unknownKind,
  duplicateId,
  childPlacement,
  animationConfig,
  requiredTextContent,
  requiredButtonLabel,
  emptyContainer,
];
