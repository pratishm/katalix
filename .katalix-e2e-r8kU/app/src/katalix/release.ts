export const webReleaseProfiles = {
  development: {
    environment: ".env.development",
    sourceMaps: true,
    cacheHeaders: "public/_headers",
    previewDeployments: false,
    rollback: "Re-deploy the previous static artifact from hosting history.",
  },
  preview: {
    environment: ".env.preview",
    sourceMaps: true,
    cacheHeaders: "public/_headers",
    previewDeployments: true,
    rollback: "Promote the prior preview artifact or restore the previous CDN version.",
  },
  production: {
    environment: ".env.production",
    sourceMaps: false,
    cacheHeaders: "public/_headers",
    previewDeployments: false,
    rollback: "Pin the CDN to the last known-good artifact and invalidate changed paths.",
  },
} as const;

export type WebReleaseChannel = keyof typeof webReleaseProfiles;
