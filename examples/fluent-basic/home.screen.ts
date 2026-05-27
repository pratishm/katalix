/**
 * Example fluent screen definition (Phase 2).
 * Run after build: npx tsx examples/fluent-basic/home.screen.ts
 */
import { Screen } from "@katalix/dsl";

export const home = Screen("Home", (s) =>
  s
    .padding(16)
    .background("surface.canvas")
    .stack({ gap: 12 }, (stack) =>
      stack
        .text("Welcome back")
        .size(28)
        .weight("bold")
        .text("Your workspace is ready")
        .color("text.muted")
        .button("Open", (btn) => btn.onPress("open-details").variant("primary")),
    ),
);

const { valid, diagnostics } = home.validate();
if (!valid) {
  console.error(diagnostics);
  process.exit(1);
}

console.log(home.debug().printed);
