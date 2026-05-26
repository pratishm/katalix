import { configureLattix, resetLattixConfig } from "@lattix/diagnostics";
import { afterEach, describe, expect, it } from "vitest";
import { Screen, screen } from "./screen.js";

afterEach(() => {
  resetLattixConfig();
});

describe("Screen fluent DSL", () => {
  it("resolves a readable home screen to a valid semantic tree with built-in validation", () => {
    const home = Screen("Home", (s) =>
      s
        .padding(16)
        .background("surface.canvas")
        .stack({ gap: 12 }, (stack) =>
          stack
            .text("Welcome back")
            .size(28)
            .weight("bold")
            .text("Ready to continue")
            .color("text.muted")
            .button("Continue", (btn) => btn.onPress("continue").variant("primary")),
        ),
    );

    const tree = home.toTree();
    expect(tree.version).toBe(1);
    expect(tree.validation.valid).toBe(true);
    expect(tree.root.kind).toBe("screen");
    expect(tree.root.id).toBe("Home");

    const stack = tree.root.children?.[0];
    expect(stack?.kind).toBe("stack");
    expect(stack?.style?.gap).toBe(12);

    const texts = stack?.children?.filter((c) => c.kind === "text") ?? [];
    expect(texts[0]?.props.content).toBe("Welcome back");
    expect(texts[0]?.style?.fontSize).toBe(28);
    expect(texts[1]?.props.content).toBe("Ready to continue");
    expect(texts[1]?.style?.color).toBe("text.muted");

    const button = stack?.children?.find((c) => c.kind === "button");
    expect(button?.props.label).toBe("Continue");
    expect(button?.props.onPress).toEqual({ id: "continue" });
    expect(button?.props.variant).toBe("primary");
  });

  it("throws on invalid content during authoring without calling validate separately", () => {
    configureLattix({ validationMode: "strict" });
    expect(() => Screen("Home", (s) => s.text(""))).toThrow();
  });

  it("exposes debug labels and builder trace without chain state on nodes", () => {
    const built = screen("Debug", (s) =>
      s.debugLabel("root-screen").stack({ gap: 8 }, (stack) => stack.text("Hi").debugLabel("greeting")),
    );

    const node = built.toNode();
    expect(node.debugLabel).toBe("root-screen");
    expect(node.children?.[0]?.children?.[0]?.debugLabel).toBe("greeting");
    expect(node.meta?.builderTrace).toBeDefined();
    expect("chain" in node).toBe(false);
  });

  it("debug() uses built-in tree validation", () => {
    const built = Screen("Home", (s) =>
      s.stack(undefined, (stack) => stack.text("Hello")),
    );
    const debug = built.debug({ mode: "report", throwOnError: false });
    expect(debug.validation.valid).toBe(true);
    expect(debug.printed).toContain("screen");
  });

  it("authors preset animations on containers and leaves", () => {
    const tree = Screen("Motion", (s) =>
      s
        .animate("fade-in", { trigger: "mount", duration: 240 })
        .stack((stack) =>
          stack
            .animate("slide-up", { trigger: "visible", delay: 80 })
            .text("Animated")
            .animate("pulse", { trigger: "hover", repeat: "infinite" }),
        ),
    ).toTree();

    const stack = tree.root.children?.[0];
    const text = stack?.children?.[0];
    expect(tree.root.animation).toEqual({
      preset: "fade-in",
      trigger: "mount",
      duration: 240,
    });
    expect(stack?.animation).toEqual({
      preset: "slide-up",
      trigger: "visible",
      delay: 80,
    });
    expect(text?.animation).toEqual({
      preset: "pulse",
      trigger: "hover",
      repeat: "infinite",
    });
  });
});
