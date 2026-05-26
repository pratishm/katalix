# Storage Manifests

`@lattix/storage` defines storage, database, and offline queue contracts for Lattix App Runtime. It does not implement persistence; host apps bind manifests to browser or native storage libraries.

## Authoring

```ts
import { Storage } from "@lattix/storage";

const storage = Storage("Shop Storage")
  .keyValue("settings", { adapter: "localStorage" })
  .secureKeyValue("session", { adapter: "secure-store" })
  .documentStore("products", { adapter: "indexeddb" }, (store) =>
    store.migration(1, "initial-products"),
  )
  .offlineQueue("mutations", { adapter: "indexeddb" }, (queue) =>
    queue.conflictStrategy("client-wins").optimisticMetadata("pendingWrites"),
  )
  .toManifest();
```

## Adapter Targets

Initial adapter targets include:

- web key-value: `localStorage`, `sessionStorage`
- web database/cache: `indexeddb`, `cache-storage`
- native key-value: `async-storage`, `mmkv`
- native secure storage: `secure-store`, `keychain`
- native/local SQL: `sqlite`
- host-defined adapters: `custom`

Use `createStorageAdapterPlan(manifest, { platform })` to produce plain adapter planning objects for host binding.

## Offline and Migrations

Document stores and local SQL stores should declare migrations. Offline queues should declare a conflict strategy such as `client-wins`, `server-wins`, `last-write-wins`, or `custom`, and can point to optimistic metadata used by the host app.

## Diagnostics

Storage diagnostics cover unavailable adapters, unknown adapters, insecure secure-storage declarations, missing migrations, duplicate IDs, and missing offline conflict strategies. Use report mode to collect diagnostics without throwing.
