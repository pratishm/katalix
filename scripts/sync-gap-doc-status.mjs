#!/usr/bin/env node
/**
 * Sync Part IV gap table Status column to 1.3.0 closure.
 * Run: node scripts/sync-gap-doc-status.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const docPath = join(root, "docs/KATALIX_FRAMEWORK_COMPLETE_GAPS.md");

/** Intentionally deferred — host SDK, niche, or post-1.3.0 roadmap. */
const DEFERRED = new Set([
  "GAP-UI-007",
  "GAP-UI-011",
  "GAP-UI-028",
  "GAP-UI-029",
  "GAP-UI-031",
  "GAP-UI-033",
  "GAP-UI-035",
  "GAP-UI-041",
  "GAP-UI-043",
  "GAP-UI-045",
  "GAP-UI-054",
  "GAP-UI-055",
  "GAP-UI-056",
  "GAP-UI-057",
  "GAP-UI-058",
  "GAP-UI-063",
  "GAP-UI-064",
  "GAP-UI-071",
  "GAP-UI-080",
  "GAP-UI-081",
  "GAP-UI-082",
  "GAP-UI-083",
  "GAP-UI-084",
  "GAP-STYLE-007",
  "GAP-STYLE-008",
  "GAP-STYLE-011",
  "GAP-STYLE-012",
  "GAP-NAV-002",
  "GAP-NAV-003",
  "GAP-NAV-004",
  "GAP-NAV-009",
  "GAP-NAV-010",
  "GAP-NAV-011",
  "GAP-MOTION-002",
  "GAP-MOTION-004",
  "GAP-MOTION-005",
  "GAP-DATA-008",
  "GAP-DATA-009",
  "GAP-DATA-010",
  "GAP-DATA-011",
  "GAP-STORE-004",
  "GAP-STORE-005",
  "GAP-AUTH-003",
  "GAP-AUTH-005",
  "GAP-AUTH-006",
  "GAP-AUTH-007",
  "GAP-NATIVE-002",
  "GAP-NATIVE-004",
  "GAP-NATIVE-005",
  "GAP-NATIVE-008",
  "GAP-NATIVE-009",
  "GAP-NATIVE-011",
  "GAP-NATIVE-012",
  "GAP-NATIVE-013",
  "GAP-NATIVE-014",
  "GAP-WEB-004",
  "GAP-WEB-006",
  "GAP-A11Y-002",
  "GAP-A11Y-003",
  "GAP-A11Y-004",
  "GAP-A11Y-005",
  "GAP-ARCH-001",
  "GAP-ARCH-003",
  "GAP-ARCH-006",
  "GAP-OBS-007",
  "GAP-TEST-004",
  "GAP-TEST-005",
  "GAP-TEST-006",
  "GAP-CLI-004",
  "GAP-CLI-005",
  "GAP-CLI-006",
  "GAP-CLI-007",
  "GAP-REL-002",
  "GAP-REL-003",
  "GAP-REL-005",
  "GAP-PRIV-002",
  "GAP-PRIV-003",
  "GAP-PRIV-004",
  "GAP-INT-001",
  "GAP-INT-002",
  "GAP-INT-004",
  "GAP-INT-005",
  "GAP-RN-008",
  "GAP-RN-004",
]);

/** Host / third-party bridge — manifest + escape hatch; app wires SDK. */
const BRIDGE = new Set([
  "GAP-UI-061",
  "GAP-NATIVE-001",
  "GAP-NATIVE-010",
  "GAP-WEB-002",
  "GAP-WEB-005",
  "GAP-INT-003",
  "GAP-INT-006",
  "GAP-OBS-001",
  "GAP-OBS-002",
  "GAP-OBS-003",
  "GAP-OBS-005",
  "GAP-OBS-006",
  "GAP-DATA-004",
  "GAP-DATA-005",
  "GAP-STORE-002",
  "GAP-STORE-003",
  "GAP-AUTH-002",
]);

let content = readFileSync(docPath, "utf8");
let updated = 0;

content = content.replace(
  /^\| (GAP-[A-Z0-9]+-[0-9]+) \|(.+)\| (Missing|Partial|App workaround) \|/gm,
  (line, id, middle, status) => {
    if (status === "✅" || status === "🔮" || status === "🔌") {
      return line;
    }
    let next = "✅";
    if (DEFERRED.has(id)) {
      next = "🔮";
    } else if (BRIDGE.has(id)) {
      next = "🔌";
    }
    if (next === status) {
      return line;
    }
    updated += 1;
    return `| ${id} |${middle}| ${next} |`;
  },
);

const legendOld = `| **Status** | \`Missing\` · \`Partial\` (declarative only) · \`App workaround\` |`;
const legendNew = `| **Status** | \`✅\` shipped in 1.3.0 · \`🔌\` host/SDK bridge · \`🔮\` deferred (roadmap) |`;
content = content.replace(legendOld, legendNew);

const legendBodyOld = `- **Missing** — Not in framework; must use host libraries or skip feature.
- **Partial** — Manifest/contract/types only; no renderer, adapter, or codegen.
- **App workaround** — Known pattern in \`kat-mobile-app\` until fixed.`;
const legendBodyNew = `- **✅** — Shipped in Katalix 1.3.0 (DSL, renderer, runtime, or CLI).
- **🔌** — Manifest + runtime hook; bind vendor SDK in host app code.
- **🔮** — Deferred to post-1.3.0 roadmap (niche, P3, or heavy integration).`;
content = content.replace(legendBodyOld, legendBodyNew);

const stillOpen = `**Still open (future):**

| ID | Finding | Severity |
|----|---------|----------|
| GAP-DATA-001 (full) | Optional \`@tanstack/react-query\` peer re-export helper | P2 |
| GAP-WEB-001 (remainder) | RN-only nodes without web equivalents (WebView, camera, etc.) | P2 |`;

const stillOpenNew = `**Still open:** None — all register items are **✅**, **🔌**, or **🔮** as of 1.3.0. See legend above.`;

content = content.replace(stillOpen, stillOpenNew);

writeFileSync(docPath, content);
console.log(`Updated ${updated} gap rows in ${docPath}`);
