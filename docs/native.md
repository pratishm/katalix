# Native Runtime Manifests

`@katalix/native` defines native UX and capability contracts for Katalix App Runtime. It supports both Expo and plain React Native targets without making either a hard dependency.

## Authoring

```ts
import { Native } from "@katalix/native";

const native = Native("Shop Native")
  .target("expo", { iosBundleId: "com.shop.app", androidPackage: "com.shop.app" })
  .layout((layout) =>
    layout
      .safeArea("required")
      .keyboard("avoid")
      .statusBar("dark")
      .orientation("portrait")
      .backHandling("confirm-exit")
      .gesture("swipe-back")
      .bottomSheet("product-sheet"),
  )
  .capability("camera", { permission: "camera", expoModule: "expo-camera" })
  .toManifest();
```

## Scope

Native manifests cover:

- safe areas, keyboard avoidance, status bar, orientation, back handling, gestures, dynamic type, portals, toasts, refresh controls, and bottom sheets,
- accessibility declarations for labels, hints, roles, focus behavior, and dynamic text scaling,
- camera, location, notifications, files, media library, contacts, haptics, biometrics, network state, clipboard, and permission flows as capability declarations.

## Expo vs Plain React Native

Expo can reference known Expo modules such as `expo-camera`, `expo-location`, and `expo-notifications`. Plain React Native targets receive diagnostics when manifests assume Expo-only modules. Host apps still bind capabilities to actual modules.

## Diagnostics

Diagnostics cover missing platform IDs, missing permissions, duplicate capabilities, unavailable modules, unsupported platform combinations, and Expo-only features used with plain React Native.
