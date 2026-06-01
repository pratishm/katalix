import { Storage } from "@katalix/storage";

export const storageManifest = Storage("App Storage")
  .keyValue("settings", { adapter: "localStorage" })
  .documentStore("offline-cache", { adapter: "indexeddb" }, (store) =>
    store.migration(1, "initial-cache"),
  )
  .toManifest({ platform: "web" });
