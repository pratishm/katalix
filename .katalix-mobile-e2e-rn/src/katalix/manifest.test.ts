import { describe, expect, it } from "vitest";
import { appManifest } from "./app";
import { authManifest } from "./auth";
import { dataManifest } from "./data";
import { nativeManifest } from "./native";
import { routeManifest } from "./navigation";
import { mobileReleaseProfiles, storeSubmission } from "./release";
import { storageManifest } from "./storage";

describe("generated mobile Katalix manifests", () => {
  it("are valid and native-targeted", () => {
    expect(appManifest.validation.valid).toBe(true);
    expect(routeManifest.validation.valid).toBe(true);
    expect(dataManifest.validation.valid).toBe(true);
    expect(storageManifest.validation.valid).toBe(true);
    expect(authManifest.validation.valid).toBe(true);
    expect(nativeManifest.validation.valid).toBe(true);
    expect(mobileReleaseProfiles.production.storeSubmission).toBe(true);
    expect(storeSubmission.ios.target).toBe("TestFlight");
  });
});
