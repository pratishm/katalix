/**
 * Tokens + raw values on the same screen.
 * Run: npm run example:style
 */
import { configureKatalix } from "@katalix/diagnostics";
import { Screen } from "@katalix/dsl";
import { printTree } from "@katalix/diagnostics";
import { resolveToken } from "@katalix/tokens";

configureKatalix({ validationMode: "report", throwOnValidationError: false });

const card = Screen("Card", (s) =>
  s
    .padding(20)
    .background("surface.canvas")
    .radius(14)
    .stack({ gap: "space.3" }, (stack) =>
      stack
        .text("Hello")
        .color("text.primary")
        .weight("bold")
        .size(18)
        .text("Secondary line")
        .color("text.muted"),
    ),
);

const tree = card.toTree();
console.log(printTree(tree, { showBuilderTrace: true }));

const title = tree.root.children?.[0]?.children?.[0];
if (title?.normalizedStyle?.color?.kind === "token") {
  const resolved = resolveToken(title.normalizedStyle.color.ref);
  console.log("\nResolved text.primary →", resolved);
}

console.log("\nValidation:", tree.validation.valid ? "ok" : tree.validation.diagnostics);
