/**
 * Intentionally invalid screens — diagnostics are automatic on toTree().
 * Run: npm run example:debug
 */
import { configureKatalix } from "@katalix/diagnostics";
import { Screen } from "@katalix/dsl";
import { explainNode, printDiagnostics } from "@katalix/diagnostics";

configureKatalix({ validationMode: "report", throwOnValidationError: false });

const missingContent = Screen("Broken", (s) =>
  s.stack({ gap: 8 }, (stack) =>
    stack.text("").debugLabel("empty-greeting").text("Also fine"),
  ),
);

const tree = missingContent.toTree();
const { diagnostics } = tree.validation;

console.log("=== Diagnostics (from tree.validation) ===\n");
console.log(printDiagnostics(diagnostics));

const badPath = diagnostics[0]?.path;
if (badPath) {
  console.log("\n=== explainNode (reads node.meta.diagnostics) ===\n");
  console.log(explainNode(tree, badPath).formatted);
}

process.exit(tree.validation.valid ? 0 : 1);
