import { Screen } from "@katalix/dsl";

export const home = Screen("App Home", (screen) =>
  screen.padding(24).stack({ gap: 12 }, (stack) =>
    stack
      .text("Welcome to App")
      .size(28)
      .weight("bold")
      .text("This screen is rendered through the Katalix React renderer.")
      .color("text.muted")
      .button("Inspect app manifests", (button) => button.onPress("inspect-manifests")),
  ),
);
