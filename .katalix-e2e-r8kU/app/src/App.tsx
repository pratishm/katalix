import React from "react";
import { KatalixRenderer } from "@katalix/react";
import { home } from "./screens/home.screen.js";
import { appManifest } from "./katalix/app.js";
import { dataManifest } from "./katalix/data.js";
import { diagnosticsSummary } from "./katalix/diagnostics.js";
import { routeManifest } from "./katalix/navigation.js";
import { storageManifest } from "./katalix/storage.js";
import { webManifest } from "./katalix/web.js";

const tree = home.toTree();

export const App = () => (
  <main id="main-content">
    <KatalixRenderer tree={tree} onAction={(action) => console.log("action:", action)} />
    <pre data-testid="katalix-diagnostics">
      {diagnosticsSummary([appManifest, routeManifest, dataManifest, storageManifest, webManifest])}
    </pre>
  </main>
);
