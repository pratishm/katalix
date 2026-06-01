import type {
  KatalixDiagnostic,
  ValidationMode,
  ValidationResult,
} from "@katalix/core";
import type { TokenRegistry } from "@katalix/tokens";

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
export interface EnrichedDiagnostic extends KatalixDiagnostic {
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
  /** Custom design tokens used when normalizing styles (GAP-STYLE-001). */
  readonly registry?: TokenRegistry;
}

export type { KatalixDiagnostic, ValidationMode, ValidationResult };
