import {
  diagnostic,
  type LattixAnimation,
  type LattixAnimationFrame,
  type LattixAnimationPreset,
  type LattixAnimationTrigger,
  type LattixDiagnostic,
} from "@lattix/core";

export const MOTION_PRESETS = [
  "fade-in",
  "fade-out",
  "slide-up",
  "slide-down",
  "scale-in",
  "pulse",
  "shake",
] as const satisfies readonly LattixAnimationPreset[];

export const MOTION_TRIGGERS = [
  "mount",
  "press",
  "hover",
  "visible",
  "focus",
] as const satisfies readonly LattixAnimationTrigger[];

export interface MotionPresetOptions extends Omit<LattixAnimation, "preset"> {}

export type MotionStyle = Record<string, string | number>;

export interface WebMotionResolution {
  readonly style: MotionStyle;
  readonly attributes: Readonly<Record<string, string>>;
  readonly initialStyle: MotionStyle;
  readonly targetStyle: MotionStyle;
}

export interface NativeMotionResolution {
  readonly metadata: {
    readonly preset?: LattixAnimationPreset;
    readonly trigger?: LattixAnimationTrigger;
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
const DEFAULT_TRIGGER: LattixAnimationTrigger = "mount";

const isKnownPreset = (value: unknown): value is LattixAnimationPreset =>
  MOTION_PRESETS.includes(value as LattixAnimationPreset);

const isKnownTrigger = (value: unknown): value is LattixAnimationTrigger =>
  MOTION_TRIGGERS.includes(value as LattixAnimationTrigger);

const isNonNegativeNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

const isValidRepeat = (value: unknown): boolean =>
  value === undefined ||
  value === "infinite" ||
  (typeof value === "number" && Number.isInteger(value) && value >= 0);

const firstAnimation = (
  animation: LattixAnimation | readonly LattixAnimation[],
): LattixAnimation =>
  Array.isArray(animation)
    ? (animation[0] as LattixAnimation)
    : (animation as LattixAnimation);

const compactFrame = (
  frame: LattixAnimationFrame | undefined,
): MotionStyle => {
  if (!frame) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(frame).filter(([, value]) => value !== undefined),
  ) as MotionStyle;
};

const presetFrames = (
  preset: LattixAnimationPreset | undefined,
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
  preset: LattixAnimationPreset | undefined,
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
): LattixDiagnostic =>
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
  preset: LattixAnimationPreset,
  options: MotionPresetOptions = {},
): LattixAnimation => ({ preset, ...options });

export const customMotion = (
  animation: Pick<LattixAnimation, "trigger" | "from" | "to" | "transition">,
): LattixAnimation => animation;

const validateTiming = (
  field: string,
  value: unknown,
): LattixDiagnostic[] => {
  if (value === undefined || isNonNegativeNumber(value)) {
    return [];
  }
  return [
    diagnosticFor(
      field.endsWith("delay")
        ? "LATTIX_INVALID_ANIMATION_DELAY"
        : "LATTIX_INVALID_ANIMATION_DURATION",
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

const validateRepeat = (value: unknown): LattixDiagnostic[] => {
  if (isValidRepeat(value)) {
    return [];
  }
  return [
    diagnosticFor(
      "LATTIX_INVALID_ANIMATION_REPEAT",
      "Invalid animation repeat",
      "animation.repeat",
      value,
      'a non-negative integer or "infinite"',
      'Set repeat to a count such as 2 or "infinite".',
    ),
  ];
};

const validateMotionBlock = (
  item: LattixAnimation,
): readonly LattixDiagnostic[] => {
  const diagnostics: LattixDiagnostic[] = [];
  if (item.preset !== undefined && !isKnownPreset(item.preset)) {
    diagnostics.push(
      diagnosticFor(
        "LATTIX_INVALID_ANIMATION_PRESET",
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
        "LATTIX_INVALID_ANIMATION_TRIGGER",
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
  animation: LattixAnimation | readonly LattixAnimation[],
): readonly LattixDiagnostic[] => {
  const items = Array.isArray(animation) ? animation : [animation];
  return items.flatMap((item) => validateMotionBlock(item as LattixAnimation));
};

export const resolveMotionToCSS = (
  animation: LattixAnimation | readonly LattixAnimation[] | undefined,
): WebMotionResolution => {
  if (!animation) {
    return { style: {}, attributes: {}, initialStyle: {}, targetStyle: {} };
  }

  const item = firstAnimation(animation);
  const trigger = item.trigger ?? DEFAULT_TRIGGER;
  const frames = presetFrames(item.preset);
  const style: MotionStyle = {
    animationName: item.preset ? `lattix-${item.preset}` : "lattix-custom",
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
      ...(item.preset ? { "data-lattix-animation": item.preset } : {}),
      "data-lattix-animation-trigger": trigger,
    },
  };
};

export const resolveMotionToNative = (
  animation: LattixAnimation | readonly LattixAnimation[] | undefined,
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
