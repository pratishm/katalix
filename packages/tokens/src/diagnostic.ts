import type { KatalixDiagnostic } from "@katalix/core";
import { diagnostic as coreDiagnostic } from "@katalix/core";

export const styleDiagnostic = (
  partial: KatalixDiagnostic & Pick<KatalixDiagnostic, "code" | "message" | "summary">,
): KatalixDiagnostic => coreDiagnostic(partial);
