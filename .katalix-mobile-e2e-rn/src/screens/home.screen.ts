import { Screen } from "@katalix/dsl";

export const home = Screen("Demo Mobile Home", (screen) =>
  screen.padding(24).stack({ gap: 12 }, (stack) =>
    stack
      .text("Welcome to Demo Mobile")
      .size(28)
      .weight("bold")
      .text("This screen is rendered through the Katalix React Native renderer.")
      .color("text.muted")
      .button("Inspect native manifests", (button) => button.onPress("inspect-manifests")),
  ),
);
