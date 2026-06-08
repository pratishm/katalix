import { describe, expect, it } from "vitest";
import { buildAnimationEffectKey } from "./use-animated-node-style.js";

describe("buildAnimationEffectKey", () => {
  it("is stable for identical animation configs", () => {
    const animation = { preset: "fade-in" as const, trigger: "mount" as const };
    const a = buildAnimationEffectKey("card-1", animation);
    const b = buildAnimationEffectKey("card-1", { ...animation });
    expect(a).toBe(b);
  });

  it("changes when preset or node id changes", () => {
    const base = { preset: "fade-in" as const, trigger: "mount" as const };
    expect(buildAnimationEffectKey("a", base)).not.toBe(buildAnimationEffectKey("b", base));
    expect(buildAnimationEffectKey("a", base)).not.toBe(
      buildAnimationEffectKey("a", { ...base, preset: "slide-up" }),
    );
  });
});
