import { App } from "@katalix/app";

export const appManifest = App("App")
  .platforms(["web"])
  .environment((env) => env.variable("VITE_API_URL", { required: true }))
  .providers((providers) =>
    providers
      .provider("router", { adapter: "react-router" })
      .provider("renderer", { adapter: "react" }),
  )
  .toManifest();
