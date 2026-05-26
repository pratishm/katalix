import type {
  LattixDiagnostic,
  LattixSourceLocation,
  ValidationMode,
  ValidationResult,
} from "@lattix/core";

export type LattixNativeTargetKind = "expo" | "react-native";
export type LattixNativeSafeArea = "required" | "optional" | "none";
export type LattixNativeKeyboard = "avoid" | "resize" | "none";
export type LattixNativeOrientation = "portrait" | "landscape" | "any";
export type LattixNativeFocus = "initial" | "restore" | "none";

export interface LattixNativeTarget {
  readonly kind: LattixNativeTargetKind;
  readonly iosBundleId?: string;
  readonly androidPackage?: string;
}

export interface LattixNativeDynamicType {
  readonly minScale?: number;
  readonly maxScale?: number;
}

export interface LattixNativeLayoutManifest {
  readonly safeArea?: LattixNativeSafeArea;
  readonly keyboard?: LattixNativeKeyboard;
  readonly statusBar?: "light" | "dark" | "auto";
  readonly orientation?: LattixNativeOrientation;
  readonly backHandling?: string;
  readonly gestures: readonly string[];
  readonly dynamicType?: LattixNativeDynamicType;
  readonly portals: readonly string[];
  readonly toasts: readonly string[];
  readonly refreshControls: readonly string[];
  readonly bottomSheets: readonly string[];
}

export interface LattixNativeAccessibilityManifest {
  readonly ref: string;
  readonly label?: string;
  readonly hint?: string;
  readonly role?: string;
  readonly focus?: LattixNativeFocus;
}

export interface LattixNativeCapabilityManifest {
  readonly id: string;
  readonly permission?: string;
  readonly expoModule?: string;
}

export interface LattixNativeManifestMeta {
  readonly source?: LattixSourceLocation;
  readonly path: string;
  readonly builderTrace: readonly string[];
}

export interface LattixNativeManifest {
  readonly kind: "native";
  readonly name: string;
  readonly target: LattixNativeTarget;
  readonly layout: LattixNativeLayoutManifest;
  readonly accessibility: readonly LattixNativeAccessibilityManifest[];
  readonly capabilities: readonly LattixNativeCapabilityManifest[];
  readonly meta: LattixNativeManifestMeta;
  readonly validation: ValidationResult;
}

export interface ToNativeManifestOptions {
  readonly mode?: ValidationMode;
  readonly throwOnError?: boolean;
}

export interface NativeCapabilityPlanEntry {
  readonly id: string;
  readonly target: LattixNativeTargetKind;
  readonly permission?: string;
  readonly module?: string;
}

interface NativeBuilderState {
  readonly name: string;
  readonly target: LattixNativeTarget;
  readonly layout: LattixNativeLayoutManifest;
  readonly accessibility: readonly LattixNativeAccessibilityManifest[];
  readonly capabilities: readonly LattixNativeCapabilityManifest[];
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
  diagnostic: Omit<LattixDiagnostic, "manifestKind">,
): LattixDiagnostic => ({
  manifestKind: "native",
  ...diagnostic,
});

export class LattixNativeValidationError extends Error {
  readonly diagnostics: readonly LattixDiagnostic[];

  constructor(diagnostics: readonly LattixDiagnostic[]) {
    super(diagnostics[0]?.summary ?? "Lattix native manifest validation failed.");
    this.name = "LattixNativeValidationError";
    this.diagnostics = diagnostics;
  }
}

const emptyLayout = (): LattixNativeLayoutManifest => ({
  gestures: [],
  portals: [],
  toasts: [],
  refreshControls: [],
  bottomSheets: [],
});

export const validateNativeManifest = (
  manifest: LattixNativeManifest,
): ValidationResult => {
  const diagnostics: LattixDiagnostic[] = [];
  const capabilityIds = new Set<string>();

  if (manifest.name.trim().length === 0) {
    diagnostics.push(
      runtimeDiagnostic({
        code: "LATTIX_INVALID_NATIVE_NAME",
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
        code: "LATTIX_MISSING_NATIVE_PLATFORM_CONFIG",
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
        code: "LATTIX_MISSING_NATIVE_PLATFORM_CONFIG",
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
          code: "LATTIX_DUPLICATE_NATIVE_CAPABILITY",
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
          code: "LATTIX_MISSING_NATIVE_PERMISSION",
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
          code: "LATTIX_EXPO_ONLY_NATIVE_MODULE",
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
          code: "LATTIX_UNAVAILABLE_NATIVE_MODULE",
          message: `${capability.expoModule} is not an initial Lattix native module target.`,
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
        code: "LATTIX_UNSUPPORTED_NATIVE_UX_COMBINATION",
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
  manifest: Omit<LattixNativeManifest, "validation">,
  options: ToNativeManifestOptions = {},
): LattixNativeManifest => {
  const completeManifest = {
    ...manifest,
    validation: { valid: true, diagnostics: [] },
  } satisfies LattixNativeManifest;
  const validation = validateNativeManifest(completeManifest);
  const validatedManifest = { ...completeManifest, validation };
  const mode = options.mode ?? "strict";
  const throwOnError = options.throwOnError ?? mode === "strict";

  if (!validation.valid && throwOnError) {
    throw new LattixNativeValidationError(validation.diagnostics);
  }

  return validatedManifest;
};

export class LattixNativeLayoutBuilder {
  private layout: LattixNativeLayoutManifest = emptyLayout();

  safeArea(value: LattixNativeSafeArea): this {
    this.layout = { ...this.layout, safeArea: value };
    return this;
  }

  keyboard(value: LattixNativeKeyboard): this {
    this.layout = { ...this.layout, keyboard: value };
    return this;
  }

  statusBar(value: "light" | "dark" | "auto"): this {
    this.layout = { ...this.layout, statusBar: value };
    return this;
  }

  orientation(value: LattixNativeOrientation): this {
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

  dynamicType(value: LattixNativeDynamicType): this {
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

  toManifest(): LattixNativeLayoutManifest {
    return { ...this.layout };
  }
}

export class LattixNativeAccessibilityBuilder {
  private readonly entries: LattixNativeAccessibilityManifest[] = [];
  private current: LattixNativeAccessibilityManifest | undefined;

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

  focus(focus: LattixNativeFocus): this {
    this.updateCurrent({ focus });
    return this;
  }

  toManifest(): readonly LattixNativeAccessibilityManifest[] {
    return [...this.entries];
  }

  private updateCurrent(update: Partial<LattixNativeAccessibilityManifest>) {
    if (!this.current) {
      return;
    }
    this.current = { ...this.current, ...update };
    this.entries[this.entries.length - 1] = this.current;
  }
}

export class LattixNativeBuilder {
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

  target(kind: LattixNativeTargetKind, options: Omit<LattixNativeTarget, "kind"> = {}): this {
    this.state = {
      ...this.state,
      target: { kind, ...options },
      builderTrace: [...this.state.builderTrace, "target"],
    };
    return this;
  }

  layout(author: (layout: LattixNativeLayoutBuilder) => LattixNativeLayoutBuilder): this {
    const builder = author(new LattixNativeLayoutBuilder());
    this.state = {
      ...this.state,
      layout: builder.toManifest(),
      builderTrace: [...this.state.builderTrace, "layout"],
    };
    return this;
  }

  accessibility(
    author: (accessibility: LattixNativeAccessibilityBuilder) => LattixNativeAccessibilityBuilder,
  ): this {
    const builder = author(new LattixNativeAccessibilityBuilder());
    this.state = {
      ...this.state,
      accessibility: builder.toManifest(),
      builderTrace: [...this.state.builderTrace, "accessibility"],
    };
    return this;
  }

  capability(id: string, options: Omit<LattixNativeCapabilityManifest, "id"> = {}): this {
    this.state = {
      ...this.state,
      capabilities: [...this.state.capabilities, { id, ...options }],
      builderTrace: [...this.state.builderTrace, "capability"],
    };
    return this;
  }

  toManifest(options?: ToNativeManifestOptions): LattixNativeManifest {
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

export const Native = (name: string) => new LattixNativeBuilder(name);

export const createNativeCapabilityPlan = (
  manifest: LattixNativeManifest,
): readonly NativeCapabilityPlanEntry[] =>
  manifest.capabilities.map((capability) => ({
    id: capability.id,
    target: manifest.target.kind,
    permission: capability.permission,
    module: capability.expoModule,
  }));

export const printNativeManifest = (manifest: LattixNativeManifest) =>
  [
    `native name=${manifest.name} target=${manifest.target.kind}`,
    ...manifest.capabilities.map(
      (capability) => `  capability id=${capability.id}`,
    ),
  ].join("\n");
