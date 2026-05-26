import type { LattixDiagnostic } from "@lattix/core";
import { diagnostic as coreDiagnostic } from "@lattix/core";

export const styleDiagnostic = (
  partial: LattixDiagnostic & Pick<LattixDiagnostic, "code" | "message" | "summary">,
): LattixDiagnostic => coreDiagnostic(partial);
