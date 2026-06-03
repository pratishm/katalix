import type { RNImageStyle, RNTextStyle, RNViewStyle } from "./rn-types.js";

type NativeStyle = RNViewStyle | RNTextStyle | RNImageStyle;

const TRANSFORM_KEYS = ["scale", "translateX", "translateY"] as const;
type TransformKey = (typeof TRANSFORM_KEYS)[number];

const isTransformKey = (key: string): key is TransformKey =>
  (TRANSFORM_KEYS as readonly string[]).includes(key);

/** Map motion scale/translate props to RN `transform` arrays (GAP-MOTION-001). */
export const applyNativeTransformStyle = (
  style: Record<string, unknown>,
): NativeStyle => {
  const transform: Array<Record<string, number>> = [];
  const rest: Record<string, unknown> = { ...style };

  for (const key of TRANSFORM_KEYS) {
    const value = rest[key];
    if (typeof value === "number") {
      transform.push({ [key]: value });
      delete rest[key];
    }
  }

  if (transform.length > 0) {
    return { ...rest, transform } as NativeStyle;
  }

  return rest as NativeStyle;
};

/** Split animated scalar props into opacity vs transform drivers. */
export const partitionAnimatedStyleKeys = (
  keys: readonly string[],
): { readonly opacity: readonly string[]; readonly transform: readonly TransformKey[] } => ({
  opacity: keys.filter((key) => key === "opacity"),
  transform: keys.filter(isTransformKey),
});

export { TRANSFORM_KEYS, type TransformKey };
