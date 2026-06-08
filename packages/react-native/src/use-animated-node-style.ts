import React from "react";
import type { KatalixAnimation, KatalixNode } from "@katalix/core";
import { resolveMotionToNative } from "@katalix/motion";
import { getAnimatedDriver } from "./animated-driver.js";
import { applyNativeTransformStyle, partitionAnimatedStyleKeys } from "./motion-style.js";
import { useTokenRegistry } from "./registry-context.js";
import { resolveStyleToNative } from "./resolve-style-native.js";
import type { RNImageStyle, RNTextStyle, RNViewStyle } from "./rn-types.js";

type NativeStyle = RNViewStyle | RNTextStyle | RNImageStyle;

const ANIMATED_SCALAR_KEYS = ["opacity", "scale", "translateX", "translateY"] as const;
type AnimatedScalarKey = (typeof ANIMATED_SCALAR_KEYS)[number];

const isAnimatedScalarKey = (key: string): key is AnimatedScalarKey =>
  (ANIMATED_SCALAR_KEYS as readonly string[]).includes(key);

const readNumeric = (style: Record<string, unknown>, key: AnimatedScalarKey): number | undefined => {
  const value = style[key];
  return typeof value === "number" ? value : undefined;
};

const primaryAnimation = (
  animation: KatalixAnimation | readonly KatalixAnimation[],
): KatalixAnimation => {
  if (Array.isArray(animation)) {
    return animation[0] ?? {};
  }
  return animation as KatalixAnimation;
};

/** Stable key so mount-motion effects do not restart on unrelated parent re-renders. */
export const buildAnimationEffectKey = (
  nodeId: string | undefined,
  animation: KatalixAnimation | readonly KatalixAnimation[],
): string => {
  const { preset, trigger, duration, delay } = primaryAnimation(animation);
  return `${nodeId ?? ""}:${preset}:${trigger ?? "mount"}:${duration ?? ""}:${delay ?? ""}`;
};

const stylesShallowEqual = (left: NativeStyle, right: NativeStyle): boolean => {
  const leftEntries = Object.entries(left as Record<string, unknown>);
  const rightRecord = right as Record<string, unknown>;
  if (leftEntries.length !== Object.keys(rightRecord).length) {
    return false;
  }
  return leftEntries.every(([key, value]) => {
    const other = rightRecord[key];
    if (Array.isArray(value) && Array.isArray(other)) {
      return JSON.stringify(value) === JSON.stringify(other);
    }
    return value === other;
  });
};

/** Apply mount-trigger motion with RN Animated when available (GAP-MOTION-001). */
export const useAnimatedNodeStyle = (node: KatalixNode): NativeStyle => {
  const registry = useTokenRegistry();
  const staticStyle = React.useMemo(
    () => resolveStyleToNative(node.normalizedStyle, { registry }, node.style),
    [registry, node.normalizedStyle, node.style],
  );

  if (!node.animation) {
    return staticStyle;
  }

  const animationKey = React.useMemo(
    () => buildAnimationEffectKey(node.id, node.animation!),
    [node.id, node.animation],
  );

  const motion = React.useMemo(
    () => resolveMotionToNative(node.animation!),
    [animationKey],
  );

  const initialStyle = React.useMemo(
    () =>
      applyNativeTransformStyle({
        ...staticStyle,
        ...motion.initialStyle,
      }),
    [staticStyle, motion.initialStyle],
  );

  const targetStyle = React.useMemo(
    () =>
      applyNativeTransformStyle({
        ...staticStyle,
        ...motion.targetStyle,
      }),
    [staticStyle, motion.targetStyle],
  );

  const animated = getAnimatedDriver();

  const animatedScalars = React.useMemo(() => {
    return ANIMATED_SCALAR_KEYS.filter((key) => {
      const from = readNumeric(motion.initialStyle, key);
      const to = readNumeric(motion.targetStyle, key);
      return from !== undefined || to !== undefined;
    });
  }, [motion.initialStyle, motion.targetStyle]);

  const animatedScalarsKey = animatedScalars.join(",");

  const { opacity: opacityKeys, transform: transformKeys } = React.useMemo(
    () => partitionAnimatedStyleKeys(animatedScalars),
    [animatedScalarsKey],
  );

  const animatedValues = React.useRef<Partial<Record<AnimatedScalarKey, { _value: number }>>>({});
  const lastAnimationKeyRef = React.useRef(animationKey);
  if (lastAnimationKeyRef.current !== animationKey) {
    animatedValues.current = {};
    lastAnimationKeyRef.current = animationKey;
  }

  for (const key of animatedScalars) {
    if (!animatedValues.current[key]) {
      const from =
        readNumeric(motion.initialStyle, key) ??
        readNumeric(staticStyle as Record<string, unknown>, key) ??
        (key === "opacity" ? 1 : key === "scale" ? 1 : 0);
      if (animated) {
        animatedValues.current[key] = new animated.Value(from);
      }
    }
  }

  const [fallbackStyle, setFallbackStyle] = React.useState<NativeStyle>(initialStyle);

  React.useEffect(() => {
    if (animatedScalars.length === 0) {
      return;
    }

    if (!animated) {
      setFallbackStyle((current) =>
        stylesShallowEqual(current, initialStyle) ? current : initialStyle,
      );
      const delay = motion.transition.delay ?? 0;
      const timer = setTimeout(() => {
        setFallbackStyle((current) =>
          stylesShallowEqual(current, targetStyle) ? current : targetStyle,
        );
      }, delay + 16);
      return () => clearTimeout(timer);
    }

    const timings = animatedScalars.map((key) => {
      const toValue =
        readNumeric(motion.targetStyle, key) ??
        readNumeric(motion.initialStyle, key) ??
        readNumeric(staticStyle as Record<string, unknown>, key) ??
        (key === "opacity" ? 1 : key === "scale" ? 1 : 0);
      const value = animatedValues.current[key];
      if (!value) {
        throw new Error(`Missing animated value for "${key}"`);
      }
      return animated.timing(value, {
        toValue,
        duration: motion.transition.duration,
        delay: motion.transition.delay,
        useNativeDriver: true,
      });
    });

    animated.parallel(timings).start();
  }, [
    animated,
    animatedScalarsKey,
    animationKey,
    motion.transition.delay,
    motion.transition.duration,
  ]);

  if (animatedScalars.length === 0) {
    return initialStyle;
  }

  if (!animated) {
    return fallbackStyle;
  }

  const animatedStyle: Record<string, unknown> = { ...staticStyle };
  for (const key of opacityKeys) {
    const value = animatedValues.current[key as AnimatedScalarKey];
    if (value) {
      animatedStyle.opacity = value;
    }
  }

  const transform: Array<Record<string, { _value: number }>> = [];
  for (const key of transformKeys) {
    const value = animatedValues.current[key];
    if (value) {
      transform.push({ [key]: value });
    }
  }
  if (transform.length > 0) {
    animatedStyle.transform = transform;
  }

  for (const [key, value] of Object.entries(targetStyle as Record<string, unknown>)) {
    if (!isAnimatedScalarKey(key) && key !== "transform") {
      animatedStyle[key] = value;
    }
  }

  return animatedStyle as NativeStyle;
};
