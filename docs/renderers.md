# Renderers

Lattix renderers consume the normalized semantic tree and produce platform-specific output. Renderers never depend on the fluent authoring chain — they only see `LattixNode` trees.

## `@lattix/react` — Web renderer (Phase 5)

### Overview

`@lattix/react` maps every semantic node kind to a React component that renders standard HTML elements with resolved styles. Token references are resolved at render time via the token registry.

### Installation

```bash
npm install @lattix/react
```

> Requires `react >= 18` as a peer dependency.

### Quick start

```tsx
import React from "react";
import { createRoot } from "react-dom/client";
import { Screen } from "@lattix/dsl";
import { LattixRenderer } from "@lattix/react";

const tree = Screen("Home", (s) =>
  s.padding(16)
   .background("surface.canvas")
   .stack({ gap: 12 }, (stack) =>
     stack
       .text("Welcome back").size(28).weight("bold")
       .button("Continue", (btn) => btn.onPress("continue"))
   )
).toTree();

createRoot(document.getElementById("root")!).render(
  <LattixRenderer
    tree={tree}
    onAction={(action) => console.log("action:", action)}
  />
);
```

### API

#### `<LattixRenderer>`

Top-level component that renders a semantic tree.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `tree` | `LattixTree` | Yes | Validated semantic tree from `.toTree()` or `createTree()` |
| `onAction` | `(action: LattixAction) => void` | No | Handler for declarative actions (e.g. button `onPress`) |
| `registry` | `TokenRegistry` | No | Custom token registry for style resolution (defaults to `defaultTokenRegistry`) |

#### `<RenderNode>`

Renders a single `LattixNode`. Useful for rendering subtrees or custom compositions.

```tsx
import { RenderNode } from "@lattix/react";

<RenderNode node={tree.root.children![0]} />
```

#### `resolveStyleToCSS(normalizedStyle, options?, rawStyle?)`

Resolves normalized semantic styles into a `React.CSSProperties` object.

- Uses `normalizedStyle` entries first (token refs resolved via registry).
- Falls back to `rawStyle` for properties not present in `normalizedStyle` (e.g. tokens unknown to the default registry at build time but available in a custom renderer registry).

```ts
import { resolveStyleToCSS } from "@lattix/react";

const css = resolveStyleToCSS(
  node.normalizedStyle,
  { registry: myRegistry },
  node.style,
);
```

### Node kind → HTML mapping

| Node kind | HTML element | Default layout |
|-----------|-------------|----------------|
| `screen` | `<div>` | `min-height: 100vh` |
| `stack` | `<div>` | `display: flex; flex-direction: column` |
| `row` | `<div>` | `display: flex; flex-direction: row` |
| `box` | `<div>` | — |
| `text` | `<span>` | — |
| `image` | `<img>` | — |
| `button` | `<button>` | — |
| `input` | `<input>` | — |
| `badge` | `<span>` | — |
| `divider` | `<hr>` | — |
| `spacer` | `<div>` | `flex: 1` |
| `list` | `<div role="list">` | `display: flex; flex-direction: column` |

Unknown node kinds render a `<div>` with `data-lattix-unknown="true"`.

### Data attributes

Every rendered element includes `data-lattix-kind` for debugging and testing:

```html
<div data-lattix-kind="screen" data-lattix-id="Home">
  <div data-lattix-kind="stack" style="display:flex;flex-direction:column;gap:12px">
    <span data-lattix-kind="text">Welcome back</span>
    <button data-lattix-kind="button">Continue</button>
  </div>
</div>
```

### Action handling

Actions are declarative references — the renderer resolves them at interaction time via context.

```tsx
<LattixRenderer
  tree={tree}
  onAction={(action) => {
    switch (action.id) {
      case "open-details":
        navigate("/details");
        break;
      case "submit-form":
        submitForm(action.payload);
        break;
    }
  }}
/>
```

The `onAction` handler receives a `LattixAction` object:

```ts
interface LattixAction {
  readonly id: string;
  readonly payload?: Record<string, unknown>;
}
```

### Custom token registries

Pass a custom registry to resolve app-specific tokens at render time:

```tsx
import { createTokenRegistry } from "@lattix/tokens";

const registry = createTokenRegistry({
  "brand.accent": "#ff6600",
  "space.xl": 32,
});

<LattixRenderer tree={tree} registry={registry} />
```

### Style resolution pipeline

1. **Author** — `node.style` contains mixed tokens + literals
2. **Normalize** — `toTree()` produces `node.normalizedStyle` with `{ kind: "token" | "literal" }` entries
3. **Resolve** — renderer calls `resolveStyleToCSS()` to map tokens → CSS values via the registry

### Motion resolution

Web rendering uses `resolveMotionToCSS()` from `@lattix/motion`. Animated nodes receive CSS animation styles and `data-lattix-animation` / `data-lattix-animation-trigger` attributes for debugging and tests. The adapter also exposes initial/target frames without making SSR output hidden by default.

### Hooks

| Hook | Returns | Purpose |
|------|---------|---------|
| `useLattixAction()` | `LattixActionHandler` | Read the current action handler from context |
| `useTokenRegistry()` | `TokenRegistry` | Read the current token registry from context |

### Server-side rendering

`@lattix/react` works with `react-dom/server` for SSR:

```tsx
import { renderToStaticMarkup } from "react-dom/server";

const html = renderToStaticMarkup(<LattixRenderer tree={tree} />);
```

See [examples/web-basic](../examples/web-basic/) for a complete SSR example.

## `@lattix/react-native` — Native renderer (Phase 6)

### Overview

`@lattix/react-native` maps every semantic node kind to a React Native component (`View`, `Text`, `Pressable`, `Image`, `TextInput`, `ScrollView`). Token references are resolved at render time to React Native `StyleSheet`-compatible values.

Motion config is resolved through `resolveMotionToNative()` from `@lattix/motion`. The renderer applies the adapter's initial style only for animated nodes; apps can use the same adapter output to drive Reanimated-compatible transitions.

### Installation

```bash
npm install @lattix/react-native
```

> Requires `react >= 18` and `react-native >= 0.71` as peer dependencies.

### Quick start

```tsx
import React from "react";
import { Screen } from "@lattix/dsl";
import { LattixNativeRenderer, setRNComponents } from "@lattix/react-native";
import { View, Text, Image, TextInput, Pressable, ScrollView } from "react-native";

// Register RN components (call once at app startup)
setRNComponents({ View, Text, Image, TextInput, Pressable, ScrollView });

const tree = Screen("Home", (s) =>
  s.padding(16)
   .background("surface.canvas")
   .stack({ gap: 12 }, (stack) =>
     stack
       .text("Welcome back").size(28).weight("bold")
       .button("Continue", (btn) => btn.onPress("continue"))
   )
).toTree();

export default function App() {
  return (
    <LattixNativeRenderer
      tree={tree}
      onAction={(action) => console.log("action:", action)}
    />
  );
}
```

### API

#### `<LattixNativeRenderer>`

Top-level component that renders a semantic tree using React Native primitives.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `tree` | `LattixTree` | Yes | Validated semantic tree from `.toTree()` or `createTree()` |
| `onAction` | `(action: LattixAction) => void` | No | Handler for declarative actions (e.g. button `onPress`) |
| `registry` | `TokenRegistry` | No | Custom token registry for style resolution (defaults to `defaultTokenRegistry`) |

#### `<RenderNodeNative>`

Renders a single `LattixNode` using React Native components.

```tsx
import { RenderNodeNative } from "@lattix/react-native";

<RenderNodeNative node={tree.root.children![0]} />
```

#### `setRNComponents(components)`

Register the React Native component implementations. Must be called before rendering.

```ts
import { setRNComponents } from "@lattix/react-native";
import { View, Text, Image, TextInput, Pressable, ScrollView } from "react-native";

setRNComponents({ View, Text, Image, TextInput, Pressable, ScrollView });
```

This decouples the renderer from a direct `react-native` import, enabling testing with mock components and supporting alternative RN implementations.

#### `resolveStyleToNative(normalizedStyle, options?, rawStyle?)`

Resolves normalized semantic styles into a React Native `StyleSheet`-compatible object.

```ts
import { resolveStyleToNative } from "@lattix/react-native";

const style = resolveStyleToNative(
  node.normalizedStyle,
  { registry: myRegistry },
  node.style,
);
```

### Node kind → React Native mapping

| Node kind | RN component | Default layout |
|-----------|-------------|----------------|
| `screen` | `ScrollView` | `flexGrow: 1` (content container) |
| `stack` | `View` | `flexDirection: column` |
| `row` | `View` | `flexDirection: row` |
| `box` | `View` | — |
| `text` | `Text` | — |
| `image` | `Image` | `source: { uri }` |
| `button` | `Pressable` + `Text` | `accessibilityRole: button` |
| `input` | `TextInput` | — |
| `badge` | `View` + `Text` | — |
| `divider` | `View` | `height: 1, backgroundColor: #e5e7eb` |
| `spacer` | `View` | `flex: 1` |
| `list` | `View` | `flexDirection: column` |

Unknown node kinds render a `View` with a `Text` diagnostic message.

### Test IDs

Every rendered component includes a `testID` for testing:

- `lattix-screen-{id}`, `lattix-stack`, `lattix-row`, `lattix-box`
- `lattix-text`, `lattix-image`, `lattix-button`, `lattix-input`
- `lattix-badge`, `lattix-divider`, `lattix-spacer`, `lattix-list`
- `lattix-unknown-{kind}` for unknown node kinds

### Style differences from web

| Feature | Web (`@lattix/react`) | Native (`@lattix/react-native`) |
|---------|------------------------|----------------------------------|
| Units | CSS px/rem/etc | Unitless numbers (density-independent pixels) |
| Layout | `display: flex` explicit | Flexbox by default |
| Colors | CSS color values | Same (strings) |
| Font weight | CSS `fontWeight` | String values only (`"bold"`, `"400"`, etc.) |
| Border radius | `borderRadius` | Same |
| Gap | `gap` | Supported in RN >= 0.71 |

### Custom token registries

Same pattern as web — pass a custom registry for app-specific tokens:

```tsx
import { createTokenRegistry } from "@lattix/tokens";

const registry = createTokenRegistry({
  "brand.accent": "#ff6600",
  "space.xl": 32,
});

<LattixNativeRenderer tree={tree} registry={registry} />
```

### Hooks

| Hook | Returns | Purpose |
|------|---------|---------|
| `useLattixAction()` | `LattixActionHandler` | Read the current action handler from context |
| `useTokenRegistry()` | `TokenRegistry` | Read the current token registry from context |

See [examples/native-basic](../examples/native-basic/) for a style resolution example.

## Architecture

```
┌────────────────────┐
│  Fluent DSL        │  @lattix/dsl
│  Screen().text()   │
└────────┬───────────┘
         │ .toTree()
         ▼
┌────────────────────┐
│  Semantic Tree     │  @lattix/core
│  LattixNode[]    │
└────────┬───────────┘
         │
    ┌────┴─────┐
    ▼          ▼
┌──────────┐ ┌──────────────────┐
│ Web      │ │ Native           │
│ @lattix│ │ @lattix/       │
│ /react   │ │ react-native     │
│ HTML/CSS │ │ View/Text/etc    │
└──────────┘ └──────────────────┘
```

Both renderers depend only on `@lattix/core` and `@lattix/tokens`. They never import the fluent DSL.
