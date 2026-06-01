import { App } from "@katalix/app";

export const appManifest = App("Demo Mobile")
  .platforms(["native"])
  .environment((env) => env.variable("KATALIX_API_URL", { required: true }))
  .providers((providers) =>
    providers
      .provider("navigation", { adapter: "react-navigation" })
      .provider("renderer", { adapter: "react-native" }),
  )
  .toManifest();
