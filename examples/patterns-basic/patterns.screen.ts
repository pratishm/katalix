import { createNode, createTree, printTree } from "@katalix/core";
import { card, emptyState, section } from "@katalix/patterns";

const tree = createTree(
  createNode("screen", {
    children: [
      section({
        title: "Dashboard",
        children: [
          card({
            title: "Account",
            body: "Review your profile details.",
            action: { label: "Open", onPress: "open-account" },
            animation: { preset: "fade-in", trigger: "mount" },
          }),
          emptyState({
            title: "No projects yet",
            description: "Create one to get started.",
            action: { label: "Create project", onPress: "create-project" },
          }),
        ],
      }),
    ],
  }),
);

console.log(printTree(tree));
