# Patterns

`@katalix/patterns` provides generic reusable composites built from primitive semantic nodes. Patterns are not new core node kinds; they return ordinary `screen`, `stack`, `box`, `text`, and `button` nodes so renderers do not need pattern-specific logic.

## Available Patterns

- `card(options)` creates a boxed stack with title, optional body, optional action, style, and animation.
- `emptyState(options)` creates a centered stack with title, description, and optional action.
- `section(options)` creates a screen with a titled content stack.

```ts
import { createNode, createTree } from "@katalix/core";
import { card, emptyState, section } from "@katalix/patterns";

const tree = createTree(
  createNode("screen", {
    children: [
      section({
        title: "Dashboard",
        children: [
          card({
            title: "Account",
            body: "Review your profile details.",
            action: { label: "Open", onPress: "open-account" },
            animation: { preset: "fade-in", trigger: "mount" },
          }),
          emptyState({
            title: "No projects yet",
            description: "Create one to get started.",
          }),
        ],
      }),
    ],
  }),
);
```

## Patterns vs Primitives

Use primitives when you want exact structure. Use patterns when the structure is conventional and reusable. Pattern output stays inspectable, serializable, and renderer-agnostic because it is still just a semantic tree.
