import {
  Navigation,
  createReactRouterRoutes,
} from "@katalix/navigation";

export const routeManifest = Navigation("App Routes")
  .routes((routes) => routes.screen("home", "HomeScreen", (route) => route.path("/")))
  .toManifest({ adapter: "react-router", platform: "web" });

export const routeAdapterContract = createReactRouterRoutes(routeManifest);
