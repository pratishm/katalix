import type { ValidationMode } from "./types/diagnostic.js";

export interface KatalixConfig {
  /** Default validation mode for createTree and DSL toTree (default: strict). */
  validationMode: ValidationMode;
  /** When true, invalid trees throw on createTree / toTree (default: true in strict mode). */
  throwOnValidationError: boolean;
}

const defaultConfig: KatalixConfig = {
  validationMode: "strict",
  throwOnValidationError: true,
};

let activeConfig: KatalixConfig = { ...defaultConfig };

/** Read the active Katalix validation configuration. */
export const getKatalixConfig = (): Readonly<KatalixConfig> => activeConfig;

/** Override validation behavior (e.g. tests, tolerant CI). */
export const configureKatalix = (partial: Partial<KatalixConfig>): void => {
  activeConfig = { ...activeConfig, ...partial };
};

/** Reset configuration to library defaults. */
export const resetKatalixConfig = (): void => {
  activeConfig = { ...defaultConfig };
};
