import { afterEach, describe, expect, it, vi } from "vitest";
import { getAnimatedDriver, setAnimatedDriver, type AnimatedDriver } from "./animated-driver.js";

const createMockDriver = (): AnimatedDriver => {
  class Value {
    _value: number;
    constructor(initial: number) {
      this._value = initial;
    }
  }

  return {
    Value,
    timing: (value, config) => ({
      start: (onComplete) => {
        setTimeout(() => {
          value._value = config.toValue;
          onComplete?.();
        }, (config.delay ?? 0) + config.duration);
      },
    }),
    parallel: (timings) => ({
      start: (onComplete) => {
        let remaining = timings.length;
        if (remaining === 0) {
          onComplete?.();
          return;
        }
        timings.forEach((timing) =>
          timing.start(() => {
            remaining -= 1;
            if (remaining === 0) {
              onComplete?.();
            }
          }),
        );
      },
    }),
  };
};

afterEach(() => {
  setAnimatedDriver(undefined);
  vi.useRealTimers();
});

describe("animated driver", () => {
  it("runs timing transitions to target values", () => {
    vi.useFakeTimers();
    setAnimatedDriver(createMockDriver());
    const driver = getAnimatedDriver()!;
    const opacity = new driver.Value(0);

    driver.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    vi.advanceTimersByTime(300);

    expect(opacity._value).toBe(1);
  });
});
