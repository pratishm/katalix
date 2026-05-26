import type { LattixSourceLocation } from "./source.js";

/** Structured diagnostic emitted by validation and introspection utilities. */
export interface LattixDiagnostic {
  readonly code: string;
  readonly message: string;
  readonly summary: string;
  readonly nodeKind?: string;
  readonly manifestKind?: string;
  readonly path?: string;
  readonly field?: string;
  readonly received?: unknown;
  readonly expected?: string;
  readonly suggestion?: string;
  readonly source?: LattixSourceLocation;
}

export type ValidationMode = "strict" | "report" | "tolerant";

export interface ValidationResult {
  readonly valid: boolean;
  readonly diagnostics: readonly LattixDiagnostic[];
}
