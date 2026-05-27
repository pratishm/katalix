import type {
  KatalixDiagnostic,
  KatalixSourceLocation,
  ValidationMode,
  ValidationResult,
} from "@katalix/core";

export type KatalixNativeTargetKind = "expo" | "react-native";
export type KatalixNativeSafeArea = "required" | "optional" | "none";
export type KatalixNativeKeyboard = "avoid" | "resize" | "none";
export type KatalixNativeOrientation = "portrait" | "landscape" | "any";
export type KatalixNativeFocus = "initial" | "restore" | "none";

export interface KatalixNativeTarget {
  readonly kind: KatalixNativeTargetKind;
  readonly iosBundleId?: string;
  readonly androidPackage?: string;
}

export interface KatalixNativeDynamicType {
  readonly minScale?: number;
  readonly maxScale?: number;
}

export interface KatalixNativeLayoutManifest {
  readonly safeArea?: KatalixNativeSafeArea;
  readonly keyboard?: KatalixNativeKeyboard;
  readonly statusBar?: "light" | "dark" | "auto";
  readonly orientation?: KatalixNativeOrientation;
  readonly backHandling?: string;
  readonly gestures: readonly string[];
  readonly dynamicType?: KatalixNativeDynamicType;
  readonly portals: readonly string[];
  readonly toasts: readonly string[];
  readonly refreshControls: readonly string[];
  readonly bottomSheets: readonly string[];
}

export interface KatalixNativeAccessibilityManifest {
  readonly ref: string;
  readonly label?: string;
  readonly hint?: string;
  readonly role?: string;
  readonly focus?: KatalixNativeFocus;
}

export interface KatalixNativeCapabilityManifest {
  readonly id: string;
  readonly permission?: string;
  readonly expoModule?: string;
}

export interface KatalixNativeManifestMeta {
  readonly source?: KatalixSourceLocation;
  readonly path: string;
  readonly builderTrace: readonly string[];
}

export interface KatalixNativeManifest {
  readonly kind: "native";
  readonly name: string;
  readonly target: KatalixNativeTarget;
  readonly layout: KatalixNativeLayoutManifest;
  readonly accessibility: readonly KatalixNativeAccessibilityManifest[];
  readonly capabilities: readonly KatalixNativeCapabilityManifest[];
  readonly meta: KatalixNativeManifestMeta;
  readonly validation: ValidationResult;
}

export interface ToNativeManifestOptions {
  readonly mode?: ValidationMode;
  readonly throwOnError?: boolean;
}

export interface NativeCapabilityPlanEntry {
  readonly id: string;
  readonly target: KatalixNativeTargetKind;
  readonly permission?: string;
  readonly module?: string;
}

interface NativeBuilderState {
  readonly name: string;
  readonly target: KatalixNativeTarget;
  readonly layout: KatalixNativeLayoutManifest;
  readonly accessibility: readonly KatalixNativeAccessibilityManifest[];
  readonly capabilities: readonly KatalixNativeCapabilityManifest[];
  readonly builderTrace: readonly string[];
}

const EXPO_MODULES = new Set([
  "expo-camera",
  "expo-location",
  "expo-notifications",
  "expo-file-system",
  "expo-media-library",
  "expo-contacts",
  "expo-haptics",
  "expo-local-authentication",
  "expo-network",
  "expo-clipboard",
]);

const runtimeDiagnostic = (
  diagnostic: Omit<KatalixDiagnostic, "manifestKind">,
): KatalixDiagnostic => ({
  manifestKind: "native",
  ...diagnostic,
});

export class KatalixNativeValidationError extends Error {
  readonly diagnostics: readonly KatalixDiagnostic[];

  constructor(diagnostics: readonly KatalixDiagnostic[]) {
    super(diagnostics[0]?.summary ?? "Katalix native manifest validation failed.");
    this.name = "KatalixNativeValidationError";
    this.diagnostics = diagnostics;
  }
}

const emptyLayout = (): KatalixNativeLayoutManifest => ({
  gestures: [],
  portals: [],
  toasts: [],
  refreshControls: [],
  bottomSheets: [],
});

export const validateNativeManifest = (
  manifest: KatalixNativeManifest,
): ValidationResult => {
  const diagnostics: KatalixDiagnostic[] = [];
  const capabilityIds = new Set<string>();

  if (manifest.name.trim().length === 0) {
    diagnostics.push(
      runtimeDiagnostic({
        code: "KATALIX_INVALID_NATIVE_NAME",
        message: "Native manifest name is required.",
        summary: "Native manifest name is required.",
        path: "native.name",
        field: "name",
        received: manifest.name,
        expected: "A non-empty native manifest name.",
        suggestion: 'Pass a non-empty name to Native("Name").',
      }),
    );
  }

  if (!manifest.target.iosBundleId) {
    diagnostics.push(
      runtimeDiagnostic({
        code: "KATALIX_MISSING_NATIVE_PLATFORM_CONFIG",
        message: "Native iOS bundle id is missing.",
        summary: "Native targets should declare platform identifiers.",
        path: "native.target.iosBundleId",
        field: "target.iosBundleId",
        received: undefined,
        expected: "An iOS bundle id.",
        suggestion: "Pass iosBundleId to target().",
      }),
    );
  }

  if (!manifest.target.androidPackage) {
    diagnostics.push(
      runtimeDiagnostic({
        code: "KATALIX_MISSING_NATIVE_PLATFORM_CONFIG",
        message: "Native Android package is missing.",
        summary: "Native targets should declare platform identifiers.",
        path: "native.target.androidPackage",
        field: "target.androidPackage",
        received: undefined,
        expected: "An Android package name.",
        suggestion: "Pass androidPackage to target().",
      }),
    );
  }

  manifest.capabilities.forEach((capability, index) => {
    const path = `native.capabilities[${index}]`;
    if (capabilityIds.has(capability.id)) {
      diagnostics.push(
        runtimeDiagnostic({
          code: "KATALIX_DUPLICATE_NATIVE_CAPABILITY",
          message: `Duplicate native capability "${capability.id}".`,
          summary: "Native capability IDs must be unique.",
          path,
          field: "capabilities.id",
          received: capability.id,
          expected: "A unique capability id.",
          suggestion: "Use a unique capability id or remove the duplicate declaration.",
        }),
      );
    }
    capabilityIds.add(capability.id);

    if (!capability.permission) {
      diagnostics.push(
        runtimeDiagnostic({
          code: "KATALIX_MISSING_NATIVE_PERMISSION",
          message: `Capability "${capability.id}" is missing a permission declaration.`,
          summary: "Native capabilities should declare the permission they require.",
          path: `${path}.permission`,
          field: "permission",
          received: undefined,
          expected: "A permission reference.",
          suggestion: "Declare a permission for this capability.",
        }),
      );
    }

    if (manifest.target.kind === "react-native" && capability.expoModule) {
      diagnostics.push(
        runtimeDiagnostic({
          code: "KATALIX_EXPO_ONLY_NATIVE_MODULE",
          message: `${capability.expoModule} is Expo-specific.`,
          summary: "Plain React Native targets cannot assume Expo modules.",
          path: `${path}.expoModule`,
          field: "expoModule",
          received: capability.expoModule,
          expected: "A plain React Native module boundary or no Expo module.",
          suggestion: "Use an Expo target or bind a plain React Native module in host code.",
        }),
      );
    }

    if (capability.expoModule && !EXPO_MODULES.has(capability.expoModule)) {
      diagnostics.push(
        runtimeDiagnostic({
          code: "KATALIX_UNAVAILABLE_NATIVE_MODULE",
          message: `${capability.expoModule} is not an initial Katalix native module target.`,
          summary: "Native manifests should only reference supported initial module targets.",
          path: `${path}.expoModule`,
          field: "expoModule",
          received: capability.expoModule,
          expected: "expo-camera, expo-location, or expo-notifications.",
          suggestion: "Use a supported module or represent this as a host-defined capability.",
        }),
      );
    }
  });

  if (manifest.target.kind === "react-native" && manifest.layout.bottomSheets.length > 0) {
    diagnostics.push(
      runtimeDiagnostic({
        code: "KATALIX_UNSUPPORTED_NATIVE_UX_COMBINATION",
        message: "Bottom sheets need an explicit host binding for plain React Native.",
        summary: "Plain React Native has no built-in bottom sheet primitive.",
        path: "native.layout.bottomSheets",
        field: "layout.bottomSheets",
        received: manifest.layout.bottomSheets,
        expected: "Expo target or host-bound bottom sheet implementation.",
        suggestion: "Use an Expo target or bind a plain React Native bottom sheet library.",
      }),
    );
  }

  return {
    valid: diagnostics.length === 0,
    diagnostics,
  };
};

const withValidation = (
  manifest: Omit<KatalixNativeManifest, "validation">,
  options: ToNativeManifestOptions = {},
): KatalixNativeManifest => {
  const completeManifest = {
    ...manifest,
    validation: { valid: true, diagnostics: [] },
  } satisfies KatalixNativeManifest;
  const validation = validateNativeManifest(completeManifest);
  const validatedManifest = { ...completeManifest, validation };
  const mode = options.mode ?? "strict";
  const throwOnError = options.throwOnError ?? mode === "strict";

  if (!validation.valid && throwOnError) {
    throw new KatalixNativeValidationError(validation.diagnostics);
  }

  return validatedManifest;
};

export class KatalixNativeLayoutBuilder {
  private layout: KatalixNativeLayoutManifest = emptyLayout();

  safeArea(value: KatalixNativeSafeArea): this {
    this.layout = { ...this.layout, safeArea: value };
    return this;
  }

  keyboard(value: KatalixNativeKeyboard): this {
    this.layout = { ...this.layout, keyboard: value };
    return this;
  }

  statusBar(value: "light" | "dark" | "auto"): this {
    this.layout = { ...this.layout, statusBar: value };
    return this;
  }

  orientation(value: KatalixNativeOrientation): this {
    this.layout = { ...this.layout, orientation: value };
    return this;
  }

  backHandling(value: string): this {
    this.layout = { ...this.layout, backHandling: value };
    return this;
  }

  gesture(id: string): this {
    this.layout = { ...this.layout, gestures: [...this.layout.gestures, id] };
    return this;
  }

  dynamicType(value: KatalixNativeDynamicType): this {
    this.layout = { ...this.layout, dynamicType: value };
    return this;
  }

  portal(id: string): this {
    this.layout = { ...this.layout, portals: [...this.layout.portals, id] };
    return this;
  }

  toast(id: string): this {
    this.layout = { ...this.layout, toasts: [...this.layout.toasts, id] };
    return this;
  }

  refreshControl(id: string): this {
    this.layout = {
      ...this.layout,
      refreshControls: [...this.layout.refreshControls, id],
    };
    return this;
  }

  bottomSheet(id: string): this {
    this.layout = { ...this.layout, bottomSheets: [...this.layout.bottomSheets, id] };
    return this;
  }

  toManifest(): KatalixNativeLayoutManifest {
    return { ...this.layout };
  }
}

export class KatalixNativeAccessibilityBuilder {
  private readonly entries: KatalixNativeAccessibilityManifest[] = [];
  private current: KatalixNativeAccessibilityManifest | undefined;

  label(ref: string): this {
    this.current = { ref, label: ref };
    this.entries.push(this.current);
    return this;
  }

  hint(hint: string): this {
    this.updateCurrent({ hint });
    return this;
  }

  role(role: string): this {
    this.updateCurrent({ role });
    return this;
  }

  focus(focus: KatalixNativeFocus): this {
    this.updateCurrent({ focus });
    return this;
  }

  toManifest(): readonly KatalixNativeAccessibilityManifest[] {
    return [...this.entries];
  }

  private updateCurrent(update: Partial<KatalixNativeAccessibilityManifest>) {
    if (!this.current) {
      return;
    }
    this.current = { ...this.current, ...update };
    this.entries[this.entries.length - 1] = this.current;
  }
}

export class KatalixNativeBuilder {
  private state: NativeBuilderState;

  constructor(name: string) {
    this.state = {
      name,
      target: { kind: "expo" },
      layout: emptyLayout(),
      accessibility: [],
      capabilities: [],
      builderTrace: [`Native("${name}")`],
    };
  }

  target(kind: KatalixNativeTargetKind, options: Omit<KatalixNativeTarget, "kind"> = {}): this {
    this.state = {
      ...this.state,
      target: { kind, ...options },
      builderTrace: [...this.state.builderTrace, "target"],
    };
    return this;
  }

  layout(author: (layout: KatalixNativeLayoutBuilder) => KatalixNativeLayoutBuilder): this {
    const builder = author(new KatalixNativeLayoutBuilder());
    this.state = {
      ...this.state,
      layout: builder.toManifest(),
      builderTrace: [...this.state.builderTrace, "layout"],
    };
    return this;
  }

  accessibility(
    author: (accessibility: KatalixNativeAccessibilityBuilder) => KatalixNativeAccessibilityBuilder,
  ): this {
    const builder = author(new KatalixNativeAccessibilityBuilder());
    this.state = {
      ...this.state,
      accessibility: builder.toManifest(),
      builderTrace: [...this.state.builderTrace, "accessibility"],
    };
    return this;
  }

  capability(id: string, options: Omit<KatalixNativeCapabilityManifest, "id"> = {}): this {
    this.state = {
      ...this.state,
      capabilities: [...this.state.capabilities, { id, ...options }],
      builderTrace: [...this.state.builderTrace, "capability"],
    };
    return this;
  }

  toManifest(options?: ToNativeManifestOptions): KatalixNativeManifest {
    return withValidation(
      {
        kind: "native",
        name: this.state.name,
        target: this.state.target,
        layout: this.state.layout,
        accessibility: [...this.state.accessibility],
        capabilities: [...this.state.capabilities],
        meta: {
          path: "native",
          builderTrace: [...this.state.builderTrace],
        },
      },
      options,
    );
  }

  validate(options?: ToNativeManifestOptions): ValidationResult {
    return this.toManifest({ ...options, throwOnError: false }).validation;
  }

  debug(options?: ToNativeManifestOptions) {
    const manifest = this.toManifest({ ...options, throwOnError: false });
    return {
      manifest,
      validation: manifest.validation,
      printed: printNativeManifest(manifest),
    };
  }
}

export const Native = (name: string) => new KatalixNativeBuilder(name);

export const createNativeCapabilityPlan = (
  manifest: KatalixNativeManifest,
): readonly NativeCapabilityPlanEntry[] =>
  manifest.capabilities.map((capability) => ({
    id: capability.id,
    target: manifest.target.kind,
    permission: capability.permission,
    module: capability.expoModule,
  }));

export const printNativeManifest = (manifest: KatalixNativeManifest) =>
  [
    `native name=${manifest.name} target=${manifest.target.kind}`,
    ...manifest.capabilities.map(
      (capability) => `  capability id=${capability.id}`,
    ),
  ].join("\n");
