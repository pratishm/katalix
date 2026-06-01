import { Storage } from "@katalix/storage";

export const storageManifest = Storage("Demo Mobile Storage")
  .keyValue("settings", { adapter: "async-storage" })
  .secureKeyValue("secure-session", { adapter: "keychain" })
  .offlineQueue("pending-mutations", { adapter: "async-storage" }, (store) =>
    store.conflictStrategy("last-write-wins"),
  )
  .toManifest({ platform: "native" });
