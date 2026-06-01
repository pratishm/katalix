import releaseProfiles from "../../release-profiles.json";

export const mobileReleaseProfiles = releaseProfiles;

export const storeSubmission = {
  ios: {
    target: "TestFlight",
    bundleIdentifier: "com.katalix.demomobile",
    metadataPath: "store-metadata",
  },
  android: {
    target: "Play Console",
    packageName: "com.katalix.demomobile",
    metadataPath: "store-metadata",
  },
} as const;
