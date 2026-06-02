export {
  STYLE_PROPERTIES,
  STYLE_PROPERTY_TYPES,
  isAllowedStyleProperty,
  valueMatchesType,
  type StyleProperty,
  type StyleValueType,
} from "./schema.js";

export {
  defaultTokenRegistry,
  createTokenRegistry,
  getAuthoringTokenRegistry,
  hasToken,
  setAuthoringTokenRegistry,
  type TokenRegistry,
} from "./registry.js";

export {
  buildThemeRegistry,
  resolveThemeMode,
  type ThemeMode,
} from "./theme.js";

export { isTokenReference } from "@katalix/core";

export {
  normalizeStyle,
  normalizeTreeStyles,
  collectStyleDiagnostics,
  type NormalizeStyleOptions,
  type NormalizeStyleResult,
} from "./normalize.js";

export { resolveToken } from "./resolve.js";

export { validateNodeStyle, type ValidateNodeStyleResult } from "./validate.js";

export {
  processTreeStyles,
  processValidatedTreeStyles,
  type ProcessTreeStylesOptions,
  type ProcessTreeStylesResult,
} from "./process.js";
