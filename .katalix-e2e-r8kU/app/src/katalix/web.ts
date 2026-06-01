import { Web } from "@katalix/web";

export const webManifest = Web("App Web")
  .metadata((metadata) =>
    metadata
      .title("App")
      .description("Generated Katalix Vite React starter")
      .canonical("https://example.com/"),
  )
  .viewport({ width: "device-width", initialScale: 1 })
  .skipLink("main-content")
  .routeBoundary("home", { loading: "HomeLoading", error: "HomeError" })
  .rendering({ mode: "spa", framework: "vite" })
  .storage("settings", { adapter: "localStorage" })
  .toManifest();
