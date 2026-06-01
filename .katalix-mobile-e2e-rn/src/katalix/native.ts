import { Native } from "@katalix/native";

export const nativeManifest = Native("Demo Mobile Native")
  .target("react-native", {
    iosBundleId: "com.katalix.demomobile",
    androidPackage: "com.katalix.demomobile",
  })
  .layout((layout) =>
    layout
      .safeArea("required")
      .keyboard("avoid")
      .statusBar("auto")
      .orientation("portrait")
      .dynamicType({ minScale: 0.85, maxScale: 1.3 })
      .refreshControl("home-refresh"),
  )
  .accessibility((accessibility) =>
    accessibility.label("home-screen").hint("Generated Katalix home screen").role("summary"),
  )
  .capability("network", { permission: "network-state" })
  .toManifest();
