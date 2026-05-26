import type {
  LattixDiagnostic,
  ValidationMode,
  ValidationResult,
} from "@lattix/core";

export type DiagnosticSeverity = "error" | "warning";

/** Authoring context resolved from the semantic node at the diagnostic path. */
export interface DiagnosticAuthoringContext {
  readonly debugLabel?: string;
  readonly builderTrace?: readonly string[];
  readonly source?: {
    readonly file?: string;
    readonly line?: number;
    readonly column?: number;
  };
}

/** Diagnostic enriched with severity and authoring hints. */
export interface EnrichedDiagnostic extends LattixDiagnostic {
  readonly severity: DiagnosticSeverity;
  readonly authoring?: DiagnosticAuthoringContext;
}

export interface DiagnosticsValidationResult extends ValidationResult {
  readonly errors: readonly EnrichedDiagnostic[];
  readonly warnings: readonly EnrichedDiagnostic[];
  readonly diagnostics: readonly EnrichedDiagnostic[];
}

export interface ValidateDiagnosticsOptions {
  readonly mode?: ValidationMode;
  readonly assignPaths?: boolean;
}

export type { LattixDiagnostic, ValidationMode, ValidationResult };
