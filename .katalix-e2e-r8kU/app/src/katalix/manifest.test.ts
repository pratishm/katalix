import { describe, expect, it } from "vitest";
import { appManifest } from "./app.js";
import { dataManifest } from "./data.js";
import { routeManifest } from "./navigation.js";
import { webReleaseProfiles } from "./release.js";
import { storageManifest } from "./storage.js";
import { webManifest } from "./web.js";

describe("generated web Katalix manifests", () => {
  it("are valid and adapter-selected", () => {
    expect(appManifest.validation.valid).toBe(true);
    expect(routeManifest.validation.valid).toBe(true);
    expect(dataManifest.validation.valid).toBe(true);
    expect(storageManifest.validation.valid).toBe(true);
    expect(webManifest.validation.valid).toBe(true);
    expect(webReleaseProfiles.preview.previewDeployments).toBe(true);
  });
});
