import React from "react";
import type { KatalixNode } from "@katalix/core";
import { resolveMotionToNative } from "@katalix/motion";
import { getAnimatedDriver } from "./animated-driver.js";
import { useTokenRegistry } from "./registry-context.js";
import { resolveStyleToNative } from "./resolve-style-native.js";
import type { RNImageStyle, RNTextStyle, RNViewStyle } from "./rn-types.js";

type NativeStyle = RNViewStyle | RNTextStyle | RNImageStyle;

const ANIMATED_KEYS = ["opacity", "scale", "translateX", "translateY"] as const;
type AnimatedKey = (typeof ANIMATED_KEYS)[number];

const isAnimatedKey = (key: string): key is AnimatedKey =>
  (ANIMATED_KEYS as readonly string[]).includes(key);

const readNumeric = (style: Record<string, unknown>, key: AnimatedKey): number | undefined => {
  const value = style[key];
  return typeof value === "number" ? value : undefined;
};

/** Apply mount-trigger motion with RN Animated when available (GAP-MOTION-001). */
export const useAnimatedNodeStyle = (node: KatalixNode): NativeStyle => {
  const registry = useTokenRegistry();
  const staticStyle = resolveStyleToNative(node.normalizedStyle, { registry }, node.style);
  const motion = resolveMotionToNative(node.animation);
  const initialStyle = { ...staticStyle, ...motion.initialStyle } as NativeStyle;
  const targetStyle = { ...staticStyle, ...motion.targetStyle } as NativeStyle;
  const animated = getAnimatedDriver();

  const animatedKeys = React.useMemo(() => {
    if (!node.animation) {
      return [] as AnimatedKey[];
    }
    return ANIMATED_KEYS.filter((key) => {
      const from = readNumeric(motion.initialStyle, key);
      const to = readNumeric(motion.targetStyle, key);
      return from !== undefined || to !== undefined;
    });
  }, [node.animation, motion.initialStyle, motion.targetStyle]);

  const animatedValues = React.useRef<Partial<Record<AnimatedKey, { _value: number }>>>({});
  for (const key of animatedKeys) {
    if (!animatedValues.current[key]) {
      const from =
        readNumeric(motion.initialStyle, key) ??
        readNumeric(staticStyle as Record<string, unknown>, key) ??
        (key === "opacity" ? 1 : 0);
      if (animated) {
        animatedValues.current[key] = new animated.Value(from);
      }
    }
  }

  const [fallbackStyle, setFallbackStyle] = React.useState<NativeStyle>(initialStyle);

  React.useEffect(() => {
    if (!node.animation || animatedKeys.length === 0) {
      setFallbackStyle(initialStyle);
      return;
    }

    if (!animated) {
      setFallbackStyle(initialStyle);
      const delay = motion.transition.delay ?? 0;
      const timer = setTimeout(() => setFallbackStyle(targetStyle), delay + 16);
      return () => clearTimeout(timer);
    }

    const timings = animatedKeys.map((key) => {
      const toValue =
        readNumeric(motion.targetStyle, key) ??
        readNumeric(motion.initialStyle, key) ??
        readNumeric(staticStyle as Record<string, unknown>, key) ??
        (key === "opacity" ? 1 : 0);
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
    animatedKeys,
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

  if (!node.animation || animatedKeys.length === 0) {
    return initialStyle;
  }

  if (!animated) {
    return fallbackStyle;
  }

  const animatedStyle: Record<string, unknown> = { ...staticStyle };
  for (const key of animatedKeys) {
    const value = animatedValues.current[key];
    if (value) {
      animatedStyle[key] = value;
    }
  }
  for (const [key, value] of Object.entries(targetStyle as Record<string, unknown>)) {
    if (!isAnimatedKey(key)) {
      animatedStyle[key] = value;
    }
  }

  return animatedStyle as NativeStyle;
};
