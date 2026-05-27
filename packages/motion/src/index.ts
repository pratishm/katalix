import {
  diagnostic,
  type KatalixAnimation,
  type KatalixAnimationFrame,
  type KatalixAnimationPreset,
  type KatalixAnimationTrigger,
  type KatalixDiagnostic,
} from "@katalix/core";

export const MOTION_PRESETS = [
  "fade-in",
  "fade-out",
  "slide-up",
  "slide-down",
  "scale-in",
  "pulse",
  "shake",
] as const satisfies readonly KatalixAnimationPreset[];

export const MOTION_TRIGGERS = [
  "mount",
  "press",
  "hover",
  "visible",
  "focus",
] as const satisfies readonly KatalixAnimationTrigger[];

export interface MotionPresetOptions extends Omit<KatalixAnimation, "preset"> {}

export type MotionStyle = Record<string, string | number>;

export interface WebMotionResolution {
  readonly style: MotionStyle;
  readonly attributes: Readonly<Record<string, string>>;
  readonly initialStyle: MotionStyle;
  readonly targetStyle: MotionStyle;
}

export interface NativeMotionResolution {
  readonly metadata: {
    readonly preset?: KatalixAnimationPreset;
    readonly trigger?: KatalixAnimationTrigger;
  };
  readonly initialStyle: MotionStyle;
  readonly targetStyle: MotionStyle;
  readonly transition: {
    readonly duration: number;
    readonly delay?: number;
    readonly easing?: string;
    readonly repeat?: number | "infinite";
  };
}

const DEFAULT_DURATION = 200;
const DEFAULT_TRIGGER: KatalixAnimationTrigger = "mount";

const isKnownPreset = (value: unknown): value is KatalixAnimationPreset =>
  MOTION_PRESETS.includes(value as KatalixAnimationPreset);

const isKnownTrigger = (value: unknown): value is KatalixAnimationTrigger =>
  MOTION_TRIGGERS.includes(value as KatalixAnimationTrigger);

const isNonNegativeNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

const isValidRepeat = (value: unknown): boolean =>
  value === undefined ||
  value === "infinite" ||
  (typeof value === "number" && Number.isInteger(value) && value >= 0);

const firstAnimation = (
  animation: KatalixAnimation | readonly KatalixAnimation[],
): KatalixAnimation =>
  Array.isArray(animation)
    ? (animation[0] as KatalixAnimation)
    : (animation as KatalixAnimation);

const compactFrame = (
  frame: KatalixAnimationFrame | undefined,
): MotionStyle => {
  if (!frame) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(frame).filter(([, value]) => value !== undefined),
  ) as MotionStyle;
};

const presetFrames = (
  preset: KatalixAnimationPreset | undefined,
): { readonly from: MotionStyle; readonly to: MotionStyle } => {
  switch (preset) {
    case "fade-out":
      return { from: { opacity: 1 }, to: { opacity: 0 } };
    case "slide-up":
      return {
        from: { opacity: 0, transform: "translateY(12px)" },
        to: { opacity: 1, transform: "translateY(0)" },
      };
    case "slide-down":
      return {
        from: { opacity: 0, transform: "translateY(-12px)" },
        to: { opacity: 1, transform: "translateY(0)" },
      };
    case "scale-in":
      return {
        from: { opacity: 0, transform: "scale(0.96)" },
        to: { opacity: 1, transform: "scale(1)" },
      };
    case "pulse":
      return {
        from: { transform: "scale(1)" },
        to: { transform: "scale(1.03)" },
      };
    case "shake":
      return {
        from: { transform: "translateX(-4px)" },
        to: { transform: "translateX(4px)" },
      };
    case "fade-in":
    default:
      return { from: { opacity: 0 }, to: { opacity: 1 } };
  }
};

const nativePresetFrames = (
  preset: KatalixAnimationPreset | undefined,
): { readonly from: MotionStyle; readonly to: MotionStyle } => {
  switch (preset) {
    case "fade-out":
      return { from: { opacity: 1 }, to: { opacity: 0 } };
    case "scale-in":
      return { from: { opacity: 0, scale: 0.96 }, to: { opacity: 1, scale: 1 } };
    case "pulse":
      return { from: { scale: 1 }, to: { scale: 1.03 } };
    case "slide-up":
      return { from: { opacity: 0, translateY: 12 }, to: { opacity: 1, translateY: 0 } };
    case "slide-down":
      return { from: { opacity: 0, translateY: -12 }, to: { opacity: 1, translateY: 0 } };
    case "shake":
      return { from: { translateX: -4 }, to: { translateX: 4 } };
    case "fade-in":
    default:
      return { from: { opacity: 0 }, to: { opacity: 1 } };
  }
};

const diagnosticFor = (
  code: string,
  summary: string,
  field: string,
  received: unknown,
  expected: string,
  suggestion: string,
): KatalixDiagnostic =>
  diagnostic({
    code,
    summary,
    message: `Animation field "${field}" is invalid.`,
    field,
    received,
    expected,
    suggestion,
  });

export const motionPreset = (
  preset: KatalixAnimationPreset,
  options: MotionPresetOptions = {},
): KatalixAnimation => ({ preset, ...options });

export const customMotion = (
  animation: Pick<KatalixAnimation, "trigger" | "from" | "to" | "transition">,
): KatalixAnimation => animation;

const validateTiming = (
  field: string,
  value: unknown,
): KatalixDiagnostic[] => {
  if (value === undefined || isNonNegativeNumber(value)) {
    return [];
  }
  return [
    diagnosticFor(
      field.endsWith("delay")
        ? "KATALIX_INVALID_ANIMATION_DELAY"
        : "KATALIX_INVALID_ANIMATION_DURATION",
      field.endsWith("delay")
        ? "Invalid animation delay"
        : "Invalid animation duration",
      field,
      value,
      "non-negative number of milliseconds",
      field.endsWith("delay")
        ? "Set delay to a non-negative millisecond value."
        : "Set duration to a non-negative millisecond value.",
    ),
  ];
};

const validateRepeat = (value: unknown): KatalixDiagnostic[] => {
  if (isValidRepeat(value)) {
    return [];
  }
  return [
    diagnosticFor(
      "KATALIX_INVALID_ANIMATION_REPEAT",
      "Invalid animation repeat",
      "animation.repeat",
      value,
      'a non-negative integer or "infinite"',
      'Set repeat to a count such as 2 or "infinite".',
    ),
  ];
};

const validateMotionBlock = (
  item: KatalixAnimation,
): readonly KatalixDiagnostic[] => {
  const diagnostics: KatalixDiagnostic[] = [];
  if (item.preset !== undefined && !isKnownPreset(item.preset)) {
    diagnostics.push(
      diagnosticFor(
        "KATALIX_INVALID_ANIMATION_PRESET",
        "Unsupported animation preset",
        "animation.preset",
        item.preset,
        MOTION_PRESETS.join(", "),
        'Use a supported preset such as "fade-in".',
      ),
    );
  }

  if (item.trigger !== undefined && !isKnownTrigger(item.trigger)) {
    diagnostics.push(
      diagnosticFor(
        "KATALIX_INVALID_ANIMATION_TRIGGER",
        "Unsupported animation trigger",
        "animation.trigger",
        item.trigger,
        MOTION_TRIGGERS.join(", "),
        'Use a supported trigger such as "mount".',
      ),
    );
  }

  diagnostics.push(
    ...validateTiming("animation.duration", item.duration),
    ...validateTiming("animation.delay", item.delay),
    ...validateRepeat(item.repeat),
  );
  return diagnostics;
};

export const validateMotion = (
  animation: KatalixAnimation | readonly KatalixAnimation[],
): readonly KatalixDiagnostic[] => {
  const items = Array.isArray(animation) ? animation : [animation];
  return items.flatMap((item) => validateMotionBlock(item as KatalixAnimation));
};

export const resolveMotionToCSS = (
  animation: KatalixAnimation | readonly KatalixAnimation[] | undefined,
): WebMotionResolution => {
  if (!animation) {
    return { style: {}, attributes: {}, initialStyle: {}, targetStyle: {} };
  }

  const item = firstAnimation(animation);
  const trigger = item.trigger ?? DEFAULT_TRIGGER;
  const frames = presetFrames(item.preset);
  const style: MotionStyle = {
    animationName: item.preset ? `katalix-${item.preset}` : "katalix-custom",
    animationDuration: `${item.transition?.duration ?? item.duration ?? DEFAULT_DURATION}ms`,
    animationFillMode: "both",
    animationTimingFunction: item.transition?.easing ?? item.easing ?? "ease-out",
  };

  const delay = item.transition?.delay ?? item.delay;
  if (delay !== undefined) {
    style.animationDelay = `${delay}ms`;
  }

  const repeat = item.transition?.repeat ?? item.repeat;
  if (repeat !== undefined) {
    style.animationIterationCount = repeat;
  }

  return {
    style,
    initialStyle: compactFrame(item.from ?? frames.from),
    targetStyle: compactFrame(item.to ?? frames.to),
    attributes: {
      ...(item.preset ? { "data-katalix-animation": item.preset } : {}),
      "data-katalix-animation-trigger": trigger,
    },
  };
};

export const resolveMotionToNative = (
  animation: KatalixAnimation | readonly KatalixAnimation[] | undefined,
): NativeMotionResolution => {
  if (!animation) {
    return {
      metadata: {},
      initialStyle: {},
      targetStyle: {},
      transition: { duration: 0 },
    };
  }

  const item = firstAnimation(animation);
  const frames = nativePresetFrames(item.preset);
  const delay = item.transition?.delay ?? item.delay;
  const easing = item.transition?.easing ?? item.easing;
  const repeat = item.transition?.repeat ?? item.repeat;
  return {
    metadata: {
      ...(item.preset ? { preset: item.preset } : {}),
      trigger: item.trigger ?? DEFAULT_TRIGGER,
    },
    initialStyle: compactFrame(item.from ?? frames.from),
    targetStyle: compactFrame(item.to ?? frames.to),
    transition: {
      duration: item.transition?.duration ?? item.duration ?? DEFAULT_DURATION,
      ...(delay === undefined ? {} : { delay }),
      ...(easing === undefined ? {} : { easing }),
      ...(repeat === undefined ? {} : { repeat }),
    },
  };
};
