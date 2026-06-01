import { Data } from "@katalix/data";

export const dataManifest = Data("Demo Mobile API")
  .baseUrl("env:KATALIX_API_URL")
  .auth("primary")
  .resource("todos", (resource) =>
    resource.query("list", "GET", "/todos", (query) =>
      query
        .authRequired()
        .cacheKey("todos")
        .state("loading")
        .state("success")
        .errorMap("default-error"),
    ),
  )
  .toManifest();
