# Animations

Lattix animations are renderer-agnostic semantic data attached to nodes. The fluent DSL stores animation config on `node.animation`; renderers consume that normalized field and map it to platform behavior.

## Presets

Phase 7 supports these presets:

- `fade-in`
- `fade-out`
- `slide-up`
- `slide-down`
- `scale-in`
- `pulse`
- `shake`

```ts
import { Screen } from "@lattix/dsl";

const tree = Screen("Motion", (s) =>
  s
    .animate("fade-in", { trigger: "mount", duration: 240 })
    .text("Hover me")
    .animate("pulse", { trigger: "hover", repeat: "infinite" }),
).toTree();
```

## Triggers

Supported triggers are `mount`, `press`, `hover`, `visible`, and `focus`. Renderers may support only a subset of interaction behavior, but unsupported config is never silently ignored during validation.

## Advanced Motion

Phase 8 adds custom motion config for supported renderers:

```ts
import { customMotion } from "@lattix/motion";

const motion = customMotion({
  trigger: "press",
  from: { opacity: 0.8, scale: 0.98 },
  to: { opacity: 1, scale: 1 },
  transition: { duration: 180, easing: "ease-out" },
});
```

## Renderer Adapters

`@lattix/motion` exposes adapters:

- `resolveMotionToCSS(animation)` for web renderers. It returns CSS animation style, `data-lattix-animation` attributes, and explicit `initialStyle` / `targetStyle` frames for apps that want to wire custom keyframes or a motion library.
- `resolveMotionToNative(animation)` for React Native style-compatible initial and target states.

The React web renderer applies CSS animation metadata directly without forcing the element into its initial hidden state. The React Native renderer applies the initial style only when `node.animation` exists and exposes Reanimated-compatible data through the shared adapter for apps that want to drive native animations themselves.
