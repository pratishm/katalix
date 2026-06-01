import { Auth } from "@katalix/auth";

export const authManifest = Auth("Demo Mobile Auth")
  .storage("secure-session", { secure: true })
  .navigation((navigation) => navigation.guard("authenticated").loginRoute("login"))
  .data((data) => data.authHeader("todos", "Authorization"))
  .session("primary", "jwt", (session) =>
    session.bootstrap("silent").refresh("/auth/refresh", { strategy: "rotation" }),
  )
  .toManifest({ platform: "native" });
