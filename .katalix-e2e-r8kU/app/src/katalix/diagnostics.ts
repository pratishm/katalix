type ManifestWithValidation = {
  readonly validation: {
    readonly valid: boolean;
    readonly diagnostics: readonly unknown[];
  };
};

export const diagnosticsSummary = (manifests: readonly ManifestWithValidation[]) => {
  const invalid = manifests.filter((manifest) => !manifest.validation.valid);

  if (invalid.length === 0) {
    return "All generated Katalix manifests are valid.";
  }

  return JSON.stringify(
    invalid.flatMap((manifest) => manifest.validation.diagnostics),
    null,
    2,
  );
};
