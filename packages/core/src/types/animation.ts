/** Preset animation names supported in the shared motion schema (expanded in @lattix/motion). */
export type LattixAnimationPreset =
  | "fade-in"
  | "fade-out"
  | "slide-up"
  | "slide-down"
  | "scale-in"
  | "pulse"
  | "shake";

export type LattixAnimationTrigger =
  | "mount"
  | "press"
  | "hover"
  | "visible"
  | "focus";

export type LattixAnimationValue = string | number;

export type LattixAnimationFrame = Readonly<
  Record<string, LattixAnimationValue>
>;

export interface LattixAnimationTransition {
  readonly duration?: number;
  readonly delay?: number;
  readonly easing?: string;
  readonly repeat?: number | "infinite";
}

/** Semantic animation block attached to a node (renderer-agnostic). */
export interface LattixAnimation {
  readonly preset?: LattixAnimationPreset;
  readonly trigger?: LattixAnimationTrigger;
  readonly duration?: number;
  readonly delay?: number;
  readonly easing?: string;
  readonly repeat?: number | "infinite";
  readonly from?: LattixAnimationFrame;
  readonly to?: LattixAnimationFrame;
  readonly transition?: LattixAnimationTransition;
}
