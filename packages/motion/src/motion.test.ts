import { describe, expect, it } from "vitest";
import {
  customMotion,
  motionPreset,
  resolveMotionToCSS,
  resolveMotionToNative,
  validateMotion,
} from "./index.js";

describe("motionPreset", () => {
  it("creates a semantic preset animation block", () => {
    expect(motionPreset("fade-in", { trigger: "mount", duration: 240 })).toEqual({
      preset: "fade-in",
      trigger: "mount",
      duration: 240,
    });
  });
});

describe("validateMotion", () => {
  it("returns diagnostics for unsupported presets, triggers, and timing values", () => {
    const diagnostics = validateMotion({
      preset: "spin" as "fade-in",
      trigger: "scroll" as "mount",
      duration: -1,
      delay: -1,
    });

    expect(diagnostics.map((d) => d.code)).toEqual(
      expect.arrayContaining([
        "KATALIX_INVALID_ANIMATION_PRESET",
        "KATALIX_INVALID_ANIMATION_TRIGGER",
        "KATALIX_INVALID_ANIMATION_DURATION",
        "KATALIX_INVALID_ANIMATION_DELAY",
      ]),
    );
  });
});

describe("resolveMotionToCSS", () => {
  it("maps mount presets to CSS animation props and data attributes", () => {
    const resolved = resolveMotionToCSS(
      motionPreset("fade-in", { trigger: "mount", duration: 300, delay: 50 }),
    );

    expect(resolved.attributes).toEqual({
      "data-katalix-animation": "fade-in",
      "data-katalix-animation-trigger": "mount",
    });
    expect(resolved.style).toMatchObject({
      animationName: "katalix-fade-in",
      animationDuration: "300ms",
      animationDelay: "50ms",
    });
    expect(resolved.initialStyle).toEqual({ opacity: 0 });
    expect(resolved.targetStyle).toEqual({ opacity: 1 });
  });

  it("resolves custom motion to explicit initial and target CSS styles", () => {
    const resolved = resolveMotionToCSS(
      customMotion({
        trigger: "press",
        from: { opacity: 0.8, transform: "scale(0.98)" },
        to: { opacity: 1, transform: "scale(1)" },
        transition: { duration: 180 },
      }),
    );

    expect(resolved.style).toMatchObject({
      animationName: "katalix-custom",
      animationDuration: "180ms",
    });
    expect(resolved.initialStyle).toEqual({ opacity: 0.8, transform: "scale(0.98)" });
    expect(resolved.targetStyle).toEqual({ opacity: 1, transform: "scale(1)" });
  });
});

describe("resolveMotionToNative", () => {
  it("returns empty styles when no animation is defined", () => {
    expect(resolveMotionToNative(undefined)).toEqual({
      metadata: {},
      initialStyle: {},
      targetStyle: {},
      transition: { duration: 0 },
    });
  });

  it("maps mount presets to initial and target native styles", () => {
    const resolved = resolveMotionToNative(
      motionPreset("fade-in", { trigger: "mount", duration: 300 }),
    );

    expect(resolved).toMatchObject({
      metadata: { preset: "fade-in", trigger: "mount" },
      initialStyle: { opacity: 0 },
      targetStyle: { opacity: 1 },
      transition: { duration: 300 },
    });
  });
});

describe("customMotion", () => {
  it("creates an advanced custom animation config", () => {
    expect(
      customMotion({
        trigger: "press",
        from: { opacity: 0.8, scale: 0.98 },
        to: { opacity: 1, scale: 1 },
        transition: { duration: 180, easing: "ease-out" },
      }),
    ).toEqual({
      trigger: "press",
      from: { opacity: 0.8, scale: 0.98 },
      to: { opacity: 1, scale: 1 },
      transition: { duration: 180, easing: "ease-out" },
    });
  });
});
