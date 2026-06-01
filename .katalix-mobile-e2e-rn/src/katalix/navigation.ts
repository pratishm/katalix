import { Navigation, createReactNavigationScreens } from "@katalix/navigation";

export const routeManifest = Navigation("Demo Mobile Routes")
  .routes((routes) =>
    routes.stack("root", (root) =>
      root.screen("home", "HomeScreen").screen("login", "LoginScreen"),
    ),
  )
  .toManifest({ adapter: "react-navigation", platform: "native" });

export const nativeScreens = createReactNavigationScreens(routeManifest);
