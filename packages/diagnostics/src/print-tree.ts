import type { LattixNode, LattixTree } from "@lattix/core";

export interface PrintTreeOptions {
  readonly indent?: number;
  readonly showMeta?: boolean;
  readonly showProps?: boolean;
  readonly showBuilderTrace?: boolean;
}

const indentLine = (depth: number, text: string): string =>
  "  ".repeat(depth) + text;

const formatProps = (props: Record<string, unknown>): string => {
  const keys = Object.keys(props);
  if (keys.length === 0) {
    return "";
  }
  const preview = keys
    .slice(0, 4)
    .map((k) => `${k}=${JSON.stringify(props[k])}`)
    .join(", ");
  return keys.length > 4 ? `${preview}, …` : preview;
};

const formatNodeLine = (node: LattixNode, options: PrintTreeOptions): string => {
  const parts = [node.kind];
  if (node.id) {
    parts.push(`id=${node.id}`);
  }
  if (node.debugLabel) {
    parts.push(`label="${node.debugLabel}"`);
  }
  if ((options.showMeta ?? true) && node.meta?.path) {
    parts.push(`path=${node.meta.path}`);
  }
  if (options.showProps && Object.keys(node.props).length > 0) {
    parts.push(`props={${formatProps(node.props)}}`);
  }
  return parts.join(" ");
};

const printNode = (
  node: LattixNode,
  depth: number,
  options: PrintTreeOptions,
): string[] => {
  const lines = [indentLine(depth, formatNodeLine(node, options))];

  if (options.showBuilderTrace && node.meta?.builderTrace?.length) {
    for (const step of node.meta.builderTrace) {
      lines.push(indentLine(depth + 1, `trace: ${step}`));
    }
  }

  if (node.children) {
    for (const child of node.children) {
      lines.push(...printNode(child, depth + 1, options));
    }
  }

  return lines;
};

/** Enhanced human-readable semantic tree printer. */
export const printTree = (
  tree: LattixTree | LattixNode,
  options: PrintTreeOptions = {},
): string => {
  const root = "root" in tree ? tree.root : tree;
  return printNode(root, 0, options).join("\n");
};
