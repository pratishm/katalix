/** Append an operation name to the builder trace (dev diagnostics). */
export const pushTrace = (
  trace: readonly string[],
  operation: string,
): readonly string[] => [...trace, operation];
