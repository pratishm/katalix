import type { LattixDiagnostic } from "../types/diagnostic.js";
import type { LattixNode } from "../types/node.js";

/** Contract that a validator plugin must satisfy. */
export interface LattixValidator {
  readonly name: string;
  validate(node: LattixNode, context: ValidationContext): LattixDiagnostic[];
}

export interface ValidationContext {
  readonly seenIds: Map<string, string>;
  readonly path: string;
}

export const diagnostic = (
  partial: LattixDiagnostic & Pick<LattixDiagnostic, "code" | "message" | "summary">,
): LattixDiagnostic => partial;
