import type { ValidationMode } from "./types/diagnostic.js";

export interface LattixConfig {
  /** Default validation mode for createTree and DSL toTree (default: strict). */
  validationMode: ValidationMode;
  /** When true, invalid trees throw on createTree / toTree (default: true in strict mode). */
  throwOnValidationError: boolean;
}

const defaultConfig: LattixConfig = {
  validationMode: "strict",
  throwOnValidationError: true,
};

let activeConfig: LattixConfig = { ...defaultConfig };

/** Read the active Lattix validation configuration. */
export const getLattixConfig = (): Readonly<LattixConfig> => activeConfig;

/** Override validation behavior (e.g. tests, tolerant CI). */
export const configureLattix = (partial: Partial<LattixConfig>): void => {
  activeConfig = { ...activeConfig, ...partial };
};

/** Reset configuration to library defaults. */
export const resetLattixConfig = (): void => {
  activeConfig = { ...defaultConfig };
};
