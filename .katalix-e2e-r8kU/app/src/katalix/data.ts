import { Data } from "@katalix/data";

export const dataManifest = Data("App API")
  .baseUrl("env:VITE_API_URL")
  .resource("todos", (resource) =>
    resource.query("list", "GET", "/todos", (query) =>
      query.cacheKey("todos").state("loading").state("success").errorMap("default-error"),
    ),
  )
  .toManifest();
