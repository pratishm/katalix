import React from "react";
import type { KatalixNode } from "@katalix/core";
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

/** Apply mount-trigger motion with RN Animated when available (GAP-MOTION-001). */
export const useAnimatedNodeStyle = (node: KatalixNode): NativeStyle => {
  const registry = useTokenRegistry();
  const staticStyle = resolveStyleToNative(node.normalizedStyle, { registry }, node.style);
  const motion = resolveMotionToNative(node.animation);
  const initialStyle = applyNativeTransformStyle({
    ...staticStyle,
    ...motion.initialStyle,
  });
  const targetStyle = applyNativeTransformStyle({
    ...staticStyle,
    ...motion.targetStyle,
  });
  const animated = getAnimatedDriver();

  const animatedScalars = React.useMemo(() => {
    if (!node.animation) {
      return [] as AnimatedScalarKey[];
    }
    return ANIMATED_SCALAR_KEYS.filter((key) => {
      const from = readNumeric(motion.initialStyle, key);
      const to = readNumeric(motion.targetStyle, key);
      return from !== undefined || to !== undefined;
    });
  }, [node.animation, motion.initialStyle, motion.targetStyle]);

  const { opacity: opacityKeys, transform: transformKeys } = React.useMemo(
    () => partitionAnimatedStyleKeys(animatedScalars),
    [animatedScalars],
  );

  const animatedValues = React.useRef<Partial<Record<AnimatedScalarKey, { _value: number }>>>({});
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
    if (!node.animation || animatedScalars.length === 0) {
      setFallbackStyle(initialStyle);
      return;
    }

    if (!animated) {
      setFallbackStyle(initialStyle);
      const delay = motion.transition.delay ?? 0;
      const timer = setTimeout(() => setFallbackStyle(targetStyle), delay + 16);
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
    animatedScalars,
    initialStyle,
    motion.initialStyle,
    motion.targetStyle,
    motion.transition.delay,
    motion.transition.duration,
    node.animation,
    node.id,
    staticStyle,
    targetStyle,
  ]);

  if (!node.animation || animatedScalars.length === 0) {
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
