import type {
  KatalixDiagnostic,
  ValidationMode,
  ValidationResult,
} from "../types/diagnostic.js";
import type { KatalixNode, KatalixTree } from "../types/node.js";
import { assignPaths, walkNodes } from "../tree/paths.js";
import type { KatalixValidator } from "./contracts.js";
import { CORE_VALIDATORS } from "./validators.js";

export interface ValidateOptions {
  readonly mode?: ValidationMode;
  readonly validators?: readonly KatalixValidator[];
  readonly assignPaths?: boolean;
}

const runValidators = (
  root: KatalixNode,
  validators: readonly KatalixValidator[],
): KatalixDiagnostic[] => {
  const withPaths = assignPaths(root);
  const nodes = walkNodes(withPaths);
  const diagnostics: KatalixDiagnostic[] = [];
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
  tree: KatalixTree | KatalixNode,
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
    throw new KatalixValidationError(diagnostics);
  }

  return { valid, diagnostics };
};

/** Error thrown in strict validation mode. */
export class KatalixValidationError extends Error {
  readonly diagnostics: readonly KatalixDiagnostic[];

  constructor(diagnostics: readonly KatalixDiagnostic[]) {
    super(diagnostics[0]?.message ?? "Katalix validation failed");
    this.name = "KatalixValidationError";
    this.diagnostics = diagnostics;
  }
}
