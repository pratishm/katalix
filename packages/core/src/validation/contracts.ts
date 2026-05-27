import type { KatalixDiagnostic } from "../types/diagnostic.js";
import type { KatalixNode } from "../types/node.js";

/** Contract that a validator plugin must satisfy. */
export interface KatalixValidator {
  readonly name: string;
  validate(node: KatalixNode, context: ValidationContext): KatalixDiagnostic[];
}

export interface ValidationContext {
  readonly seenIds: Map<string, string>;
  readonly path: string;
}

export const diagnostic = (
  partial: KatalixDiagnostic & Pick<KatalixDiagnostic, "code" | "message" | "summary">,
): KatalixDiagnostic => partial;
