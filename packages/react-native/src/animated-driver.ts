export interface AnimatedNumeric {
  readonly _value: number;
}

export interface AnimatedTimingConfig {
  readonly toValue: number;
  readonly duration: number;
  readonly delay?: number;
  readonly useNativeDriver?: boolean;
}

export interface AnimatedTiming {
  start(onComplete?: () => void): void;
}

export interface AnimatedDriver {
  Value: new (initial: number) => AnimatedNumeric;
  timing(value: AnimatedNumeric, config: AnimatedTimingConfig): AnimatedTiming;
  parallel(timings: readonly AnimatedTiming[]): { start(onComplete?: () => void): void };
}

let injectedDriver: AnimatedDriver | null | undefined;

/** Inject Animated driver for tests (call with `null` to force fallback). */
export const setAnimatedDriver = (driver: AnimatedDriver | null | undefined): void => {
  injectedDriver = driver;
};

/** Resolve React Native Animated when available; undefined means use fallback motion. */
export const getAnimatedDriver = (): AnimatedDriver | undefined => {
  if (injectedDriver !== undefined) {
    return injectedDriver ?? undefined;
  }

  try {
    const rn = require("react-native") as { Animated?: AnimatedDriver };
    injectedDriver = rn.Animated ?? null;
    return injectedDriver ?? undefined;
  } catch {
    injectedDriver = null;
    return undefined;
  }
};
