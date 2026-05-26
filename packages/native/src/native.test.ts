import { describe, expect, it } from "vitest";
import {
  Native,
  createNativeCapabilityPlan,
  printNativeManifest,
  validateNativeManifest,
} from "./index.js";

describe("Native runtime DSL", () => {
  it("resolves native UX and capability authoring into a normalized manifest", () => {
    const manifest = Native("Shop Native")
      .target("expo", { iosBundleId: "com.shop.app", androidPackage: "com.shop.app" })
      .layout((layout) =>
        layout
          .safeArea("required")
          .keyboard("avoid")
          .statusBar("dark")
          .orientation("portrait")
          .backHandling("confirm-exit")
          .gesture("swipe-back")
          .dynamicType({ minScale: 0.9, maxScale: 1.3 })
          .portal("modal-root")
          .toast("global")
          .refreshControl("pull-to-refresh")
          .bottomSheet("product-sheet"),
      )
      .accessibility((a11y) =>
        a11y.label("checkout-button").hint("Submits the order").role("button").focus("initial"),
      )
      .capability("camera", { permission: "camera", expoModule: "expo-camera" })
      .capability("location", { permission: "location", expoModule: "expo-location" })
      .toManifest();

    expect(manifest.kind).toBe("native");
    expect(manifest.name).toBe("Shop Native");
    expect(manifest.target).toEqual({
      kind: "expo",
      iosBundleId: "com.shop.app",
      androidPackage: "com.shop.app",
    });
    expect(manifest.layout).toMatchObject({
      safeArea: "required",
      keyboard: "avoid",
      statusBar: "dark",
      orientation: "portrait",
      backHandling: "confirm-exit",
      gestures: ["swipe-back"],
      portals: ["modal-root"],
      toasts: ["global"],
      refreshControls: ["pull-to-refresh"],
      bottomSheets: ["product-sheet"],
    });
    expect(manifest.accessibility).toEqual([
      {
        ref: "checkout-button",
        label: "checkout-button",
        hint: "Submits the order",
        role: "button",
        focus: "initial",
      },
    ]);
    expect(manifest.capabilities).toEqual([
      { id: "camera", permission: "camera", expoModule: "expo-camera" },
      { id: "location", permission: "location", expoModule: "expo-location" },
    ]);
    expect(manifest.validation.valid).toBe(true);
    expect(manifest.meta.builderTrace).toContain('Native("Shop Native")');
  });

  it("projects native manifests into dependency-free capability plans", () => {
    const manifest = Native("Shop Native")
      .target("react-native", { iosBundleId: "com.shop.app", androidPackage: "com.shop.app" })
      .capability("clipboard", { permission: "clipboard" })
      .toManifest();

    expect(createNativeCapabilityPlan(manifest)).toEqual([
      {
        id: "clipboard",
        target: "react-native",
        permission: "clipboard",
        module: undefined,
      },
    ]);
  });

  it("accepts declared Expo module targets for documented native capabilities", () => {
    const manifest = Native("Shop Native")
      .target("expo", { iosBundleId: "com.shop.app", androidPackage: "com.shop.app" })
      .capability("haptics", { permission: "haptics", expoModule: "expo-haptics" })
      .capability("contacts", { permission: "contacts", expoModule: "expo-contacts" })
      .toManifest();

    expect(manifest.validation.valid).toBe(true);
  });

  it("reports missing platform config, missing permissions, unavailable modules, unsupported combinations, and Expo-only gaps", () => {
    const manifest = Native("Shop Native")
      .target("react-native")
      .capability("camera", { expoModule: "expo-camera" })
      .capability("custom", { permission: "custom", expoModule: "expo-unknown" })
      .layout((layout) => layout.bottomSheet("product-sheet"))
      .toManifest({ mode: "report", throwOnError: false });

    expect(manifest.validation.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "LATTIX_MISSING_NATIVE_PLATFORM_CONFIG",
          path: "native.target.iosBundleId",
        }),
        expect.objectContaining({
          code: "LATTIX_MISSING_NATIVE_PERMISSION",
          path: "native.capabilities[0].permission",
        }),
        expect.objectContaining({
          code: "LATTIX_EXPO_ONLY_NATIVE_MODULE",
          path: "native.capabilities[0].expoModule",
          received: "expo-camera",
        }),
        expect.objectContaining({
          code: "LATTIX_UNAVAILABLE_NATIVE_MODULE",
          path: "native.capabilities[1].expoModule",
          received: "expo-unknown",
        }),
        expect.objectContaining({
          code: "LATTIX_UNSUPPORTED_NATIVE_UX_COMBINATION",
          path: "native.layout.bottomSheets",
        }),
      ]),
    );
  });
});

describe("native manifest utilities", () => {
  it("validates and prints native manifests without fluent builder state", () => {
    const manifest = Native("Shop Native")
      .target("expo", { iosBundleId: "com.shop.app", androidPackage: "com.shop.app" })
      .capability("camera", { permission: "camera", expoModule: "expo-camera" })
      .toManifest();

    expect(validateNativeManifest(manifest).valid).toBe(true);
    expect(printNativeManifest(manifest)).toContain("native name=Shop Native");
    expect("state" in manifest).toBe(false);
  });
});
