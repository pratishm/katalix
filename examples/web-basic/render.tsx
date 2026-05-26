/**
 * Web renderer example — renders a fluent DSL screen to HTML via @lattix/react.
 * Run: npm run example:web
 *
 * This example uses react-dom/server to produce static HTML, demonstrating
 * how the semantic tree flows through the renderer pipeline.
 */
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { configureLattix } from "@lattix/diagnostics";
import { Screen } from "@lattix/dsl";
import { LattixRenderer } from "@lattix/react";
import type { LattixAction } from "@lattix/core";

configureLattix({ validationMode: "strict", throwOnValidationError: true });

const home = Screen("Home", (s) =>
  s
    .padding(16)
    .background("surface.canvas")
    .stack({ gap: 12 }, (stack) =>
      stack
        .text("Welcome back")
        .size(28)
        .weight("bold")
        .color("text.primary")
        .text("Your workspace is ready")
        .color("text.muted")
        .button("Open details", (btn) => btn.onPress("open-details").variant("primary"))
        .button("Settings", (btn) => btn.onPress("open-settings")),
    ),
);

const tree = home.toTree();

const onAction = (action: LattixAction) => {
  console.log("Action dispatched:", action);
};

const html = renderToStaticMarkup(
  <LattixRenderer tree={tree} onAction={onAction} />,
);

console.log("=== Rendered HTML ===\n");
console.log(html);
console.log("\n=== Validation ===");
console.log("Valid:", tree.validation.valid);
console.log("Diagnostics:", tree.validation.diagnostics.length, "issues");
