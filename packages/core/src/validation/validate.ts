import type {
  LattixDiagnostic,
  ValidationMode,
  ValidationResult,
} from "../types/diagnostic.js";
import type { LattixNode, LattixTree } from "../types/node.js";
import { assignPaths, walkNodes } from "../tree/paths.js";
import type { LattixValidator } from "./contracts.js";
import { CORE_VALIDATORS } from "./validators.js";

export interface ValidateOptions {
  readonly mode?: ValidationMode;
  readonly validators?: readonly LattixValidator[];
  readonly assignPaths?: boolean;
}

const runValidators = (
  root: LattixNode,
  validators: readonly LattixValidator[],
): LattixDiagnostic[] => {
  const withPaths = assignPaths(root);
  const nodes = walkNodes(withPaths);
  const diagnostics: LattixDiagnostic[] = [];
  const seenIds = new Map<string, string>();

  for (const node of nodes) {
    const isRoot = node === withPaths;
    const context = {
      seenIds,
      path: isRoot ? "" : (node.meta?.path ?? ""),
    };
    for (const validator of validators) {
      diagnostics.push(...validator.validate(node, context));
    }
  }

  return diagnostics;
};

/** Validate a semantic tree and return structured diagnostics. */
export const validateTree = (
  tree: LattixTree | LattixNode,
  options: ValidateOptions = {},
): ValidationResult => {
  const {
    mode = "report",
    validators = CORE_VALIDATORS,
    assignPaths: shouldAssignPaths = true,
  } = options;

  const rawRoot = "root" in tree ? tree.root : tree;
  const root = shouldAssignPaths ? assignPaths(rawRoot) : rawRoot;

  const diagnostics = runValidators(root, validators);
  const valid = diagnostics.length === 0;

  if (mode === "strict" && !valid) {
    throw new LattixValidationError(diagnostics);
  }

  return { valid, diagnostics };
};

/** Error thrown in strict validation mode. */
export class LattixValidationError extends Error {
  readonly diagnostics: readonly LattixDiagnostic[];

  constructor(diagnostics: readonly LattixDiagnostic[]) {
    super(diagnostics[0]?.message ?? "Lattix validation failed");
    this.name = "LattixValidationError";
    this.diagnostics = diagnostics;
  }
}
