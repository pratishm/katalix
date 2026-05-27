import { Screen } from "@katalix/dsl";
import { resolveMotionToCSS, resolveMotionToNative } from "@katalix/motion";

const tree = Screen("Motion", (s) =>
  s
    .animate("fade-in", { trigger: "mount", duration: 240 })
    .stack({ gap: 12 }, (stack) =>
      stack
        .text("Motion presets")
        .animate("slide-up", { trigger: "visible", delay: 80 })
        .button("Pulse")
        .animate("pulse", { trigger: "press", repeat: 2 }),
    ),
).toTree();

const animatedText = tree.root.children?.[0]?.children?.[0];

console.log(JSON.stringify(tree.root.animation, null, 2));
console.log(JSON.stringify(resolveMotionToCSS(animatedText?.animation), null, 2));
console.log(JSON.stringify(resolveMotionToNative(animatedText?.animation), null, 2));
