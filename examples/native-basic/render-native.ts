/**
 * React Native renderer example — demonstrates semantic tree → native style resolution.
 * Run: npm run example:native
 *
 * This example builds a fluent DSL screen and resolves its styles to
 * React Native-compatible values, showing the full pipeline without
 * requiring a device or simulator.
 */
import { configureLattix } from "@lattix/diagnostics";
import { Screen } from "@lattix/dsl";
import { printTree } from "@lattix/diagnostics";
import { resolveStyleToNative } from "@lattix/react-native";

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
console.log("=== Semantic tree ===\n");
console.log(printTree(tree, { showBuilderTrace: true }));

console.log("\n=== Resolved native styles ===\n");

const screenStyle = resolveStyleToNative(tree.root.normalizedStyle, {}, tree.root.style);
console.log("Screen:", JSON.stringify(screenStyle, null, 2));

const stack = tree.root.children?.[0];
if (stack) {
  const stackStyle = resolveStyleToNative(stack.normalizedStyle, {}, stack.style);
  console.log("Stack:", JSON.stringify(stackStyle, null, 2));

  const title = stack.children?.[0];
  if (title) {
    const titleStyle = resolveStyleToNative(title.normalizedStyle, {}, title.style);
    console.log("Title text:", JSON.stringify(titleStyle, null, 2));
  }
}

console.log("\n=== Validation ===");
console.log("Valid:", tree.validation.valid);
console.log("Diagnostics:", tree.validation.diagnostics.length, "issues");
