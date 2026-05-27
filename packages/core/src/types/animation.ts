/** Preset animation names supported in the shared motion schema (expanded in @katalix/motion). */
export type KatalixAnimationPreset =
  | "fade-in"
  | "fade-out"
  | "slide-up"
  | "slide-down"
  | "scale-in"
  | "pulse"
  | "shake";

export type KatalixAnimationTrigger =
  | "mount"
  | "press"
  | "hover"
  | "visible"
  | "focus";

export type KatalixAnimationValue = string | number;

export type KatalixAnimationFrame = Readonly<
  Record<string, KatalixAnimationValue>
>;

export interface KatalixAnimationTransition {
  readonly duration?: number;
  readonly delay?: number;
  readonly easing?: string;
  readonly repeat?: number | "infinite";
}

/** Semantic animation block attached to a node (renderer-agnostic). */
export interface KatalixAnimation {
  readonly preset?: KatalixAnimationPreset;
  readonly trigger?: KatalixAnimationTrigger;
  readonly duration?: number;
  readonly delay?: number;
  readonly easing?: string;
  readonly repeat?: number | "infinite";
  readonly from?: KatalixAnimationFrame;
  readonly to?: KatalixAnimationFrame;
  readonly transition?: KatalixAnimationTransition;
}
