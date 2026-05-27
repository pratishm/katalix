import type {
  KatalixDiagnostic,
  KatalixSourceLocation,
  ValidationMode,
  ValidationResult,
} from "@katalix/core";

export type KatalixRouteKind =
  | "screen"
  | "layout"
  | "stack"
  | "tabs"
  | "modal"
  | "sheet"
  | "group";

export type KatalixRouteParamType = "string" | "number" | "boolean";
export type KatalixNavigationPlatform = "web" | "native";
export type KatalixNavigationAdapter =
  | "react-router"
  | "tanstack-router"
  | "react-navigation";
export type KatalixRoutePresentation = "card" | "modal" | "sheet";

export interface KatalixRouteParam {
  readonly name: string;
  readonly type: KatalixRouteParamType;
  readonly required?: boolean;
}

export interface KatalixRouteLink {
  readonly id: string;
  readonly href: string;
}

export interface KatalixRouteManifest {
  readonly id: string;
  readonly kind: KatalixRouteKind;
  readonly screenRef?: string;
  readonly path?: string;
  readonly params: readonly KatalixRouteParam[];
  readonly query: readonly KatalixRouteParam[];
  readonly guards: readonly string[];
  readonly links: readonly KatalixRouteLink[];
  readonly deepLinks: readonly string[];
  readonly presentation: KatalixRoutePresentation;
  readonly children: readonly KatalixRouteManifest[];
}

export interface KatalixRouteManifestMeta {
  readonly source?: KatalixSourceLocation;
  readonly path: string;
  readonly builderTrace: readonly string[];
}

export interface KatalixNavigationManifest {
  readonly kind: "navigation";
  readonly name: string;
  readonly routes: readonly KatalixRouteManifest[];
  readonly meta: KatalixRouteManifestMeta;
  readonly validation: ValidationResult;
}

export interface ToRouteManifestOptions {
  readonly mode?: ValidationMode;
  readonly throwOnError?: boolean;
  readonly adapter?: KatalixNavigationAdapter;
  readonly platform?: KatalixNavigationPlatform;
}

export interface ReactRouterRouteContract {
  readonly id: string;
  readonly path?: string;
  readonly elementRef?: string;
  readonly children?: readonly ReactRouterRouteContract[];
}

export interface TanStackRouteContract {
  readonly id: string;
  readonly path?: string;
  readonly componentRef?: string;
  readonly children?: readonly TanStackRouteContract[];
}

export interface ReactNavigationScreenContract {
  readonly name: string;
  readonly componentRef?: string;
  readonly presentation: KatalixRoutePresentation;
  readonly children?: readonly ReactNavigationScreenContract[];
}

type MutableRoute = {
  id: string;
  kind: KatalixRouteKind;
  screenRef?: string;
  path?: string;
  params: KatalixRouteParam[];
  query: KatalixRouteParam[];
  guards: string[];
  links: KatalixRouteLink[];
  deepLinks: string[];
  presentation: KatalixRoutePresentation;
  children: KatalixRouteManifest[];
};

interface NavigationBuilderState {
  readonly name: string;
  readonly routes: readonly KatalixRouteManifest[];
  readonly builderTrace: readonly string[];
}

const PARAM_NAME_PATTERN = /^[A-Za-z_]\w*$/;
const PARAM_TYPES = new Set(["string", "number", "boolean"]);

const optionalString = <K extends string>(
  key: K,
  value: string | undefined,
): Record<K, string> | Record<string, never> =>
  value === undefined ? {} : ({ [key]: value } as Record<K, string>);

const runtimeDiagnostic = (
  diagnostic: Omit<KatalixDiagnostic, "manifestKind">,
): KatalixDiagnostic => ({
  manifestKind: "navigation",
  ...diagnostic,
});

export class KatalixNavigationValidationError extends Error {
  readonly diagnostics: readonly KatalixDiagnostic[];

  constructor(diagnostics: readonly KatalixDiagnostic[]) {
    super(diagnostics[0]?.summary ?? "Katalix navigation manifest validation failed.");
    this.name = "KatalixNavigationValidationError";
    this.diagnostics = diagnostics;
  }
}

const routeNeedsScreenRef = (route: KatalixRouteManifest) =>
  route.kind === "screen" || route.kind === "modal" || route.kind === "sheet";

const collectRouteDiagnostics = (
  route: KatalixRouteManifest,
  path: string,
  routeIds: Set<string>,
  diagnostics: KatalixDiagnostic[],
  options: ToRouteManifestOptions,
) => {
  if (routeIds.has(route.id)) {
    diagnostics.push(
      runtimeDiagnostic({
        code: "KATALIX_DUPLICATE_ROUTE_ID",
        message: `Duplicate route id "${route.id}".`,
        summary: `Route id "${route.id}" is declared more than once.`,
        path,
        field: "routes.id",
        received: route.id,
        expected: "A unique route id.",
        suggestion: "Use a unique route id or remove the duplicate route declaration.",
      }),
    );
  }
  routeIds.add(route.id);

  if (routeNeedsScreenRef(route) && (!route.screenRef || route.screenRef.trim().length === 0)) {
    diagnostics.push(
      runtimeDiagnostic({
        code: "KATALIX_MISSING_ROUTE_SCREEN_REF",
        message: `Route "${route.id}" is missing a screen reference.`,
        summary: `Route "${route.id}" must reference a screen component or screen manifest.`,
        path: `${path}.screenRef`,
        field: "screenRef",
        received: route.screenRef ?? "",
        expected: "A non-empty screen reference.",
        suggestion: "Pass a screen reference to screen(), modal(), or sheet().",
      }),
    );
  }

  const validateParams = (
    params: readonly KatalixRouteParam[],
    field: "params" | "query",
  ) => {
    params.forEach((param, index) => {
      if (!PARAM_NAME_PATTERN.test(param.name)) {
        diagnostics.push(
          runtimeDiagnostic({
            code: "KATALIX_INVALID_ROUTE_PARAM",
            message: `Invalid route parameter "${param.name}".`,
            summary: `Route parameter "${param.name}" must be a valid identifier.`,
            path: `${path}.${field}[${index}].name`,
            field: `${field}.name`,
            received: param.name,
            expected: "A valid TypeScript-style identifier.",
            suggestion: "Rename the route parameter, for example userId.",
          }),
        );
      }

      if (!PARAM_TYPES.has(param.type)) {
        diagnostics.push(
          runtimeDiagnostic({
            code: "KATALIX_INVALID_ROUTE_PARAM_TYPE",
            message: `Invalid route parameter type "${param.type}".`,
            summary: `Route parameter "${param.name}" uses an unsupported type.`,
            path: `${path}.${field}[${index}].type`,
            field: `${field}.type`,
            received: param.type,
            expected: "string, number, or boolean.",
            suggestion: "Use a portable route parameter type.",
          }),
        );
      }
    });
  };

  validateParams(route.params, "params");
  validateParams(route.query, "query");

  if (options.adapter && options.platform) {
    const adapterPlatform =
      options.adapter === "react-navigation" ? "native" : "web";
    if (adapterPlatform !== options.platform) {
      diagnostics.push(
        runtimeDiagnostic({
          code: "KATALIX_UNSUPPORTED_ROUTE_PLATFORM",
          message: `${options.adapter} cannot target ${options.platform}.`,
          summary: `${options.adapter} is a ${adapterPlatform} navigation adapter.`,
          path,
          field: "adapter",
          received: { adapter: options.adapter, platform: options.platform },
          expected: `${options.adapter} should target ${adapterPlatform}.`,
          suggestion: "Select a compatible navigation adapter and platform.",
        }),
      );
    }
  }

  if (
    options.adapter &&
    options.adapter !== "react-navigation" &&
    route.presentation === "sheet"
  ) {
    diagnostics.push(
      runtimeDiagnostic({
        code: "KATALIX_UNSUPPORTED_ROUTE_ADAPTER_FEATURE",
        message: `${options.adapter} does not support sheet presentation.`,
        summary: `Route "${route.id}" uses a native sheet presentation unsupported by ${options.adapter}.`,
        path: `${path}.presentation`,
        field: "presentation",
        received: route.presentation,
        expected: "A portable web route presentation.",
        suggestion: "Use modal/card presentation for web routing or target react-navigation.",
      }),
    );
  }

  route.children.forEach((child, index) => {
    collectRouteDiagnostics(child, `${path}.children[${index}]`, routeIds, diagnostics, options);
  });
};

export const validateRouteManifest = (
  manifest: KatalixNavigationManifest,
  options: ToRouteManifestOptions = {},
): ValidationResult => {
  const diagnostics: KatalixDiagnostic[] = [];
  const routeIds = new Set<string>();

  if (manifest.name.trim().length === 0) {
    diagnostics.push(
      runtimeDiagnostic({
        code: "KATALIX_INVALID_NAVIGATION_NAME",
        message: "Navigation manifest name is required.",
        summary: "Navigation manifest name is required.",
        path: "navigation.name",
        field: "name",
        received: manifest.name,
        expected: "A non-empty navigation manifest name.",
        suggestion: 'Pass a non-empty name to Navigation("Name").',
      }),
    );
  }

  manifest.routes.forEach((route, index) => {
    collectRouteDiagnostics(route, `navigation.routes[${index}]`, routeIds, diagnostics, options);
  });

  return {
    valid: diagnostics.length === 0,
    diagnostics,
  };
};

const withValidation = (
  manifest: Omit<KatalixNavigationManifest, "validation">,
  options: ToRouteManifestOptions = {},
): KatalixNavigationManifest => {
  const completeManifest = {
    ...manifest,
    validation: { valid: true, diagnostics: [] },
  } satisfies KatalixNavigationManifest;
  const validation = validateRouteManifest(completeManifest, options);
  const validatedManifest = { ...completeManifest, validation };
  const mode = options.mode ?? "strict";
  const throwOnError = options.throwOnError ?? mode === "strict";

  if (!validation.valid && throwOnError) {
    throw new KatalixNavigationValidationError(validation.diagnostics);
  }

  return validatedManifest;
};

const toManifestRoute = (route: MutableRoute): KatalixRouteManifest => ({
  id: route.id,
  kind: route.kind,
  ...optionalString("screenRef", route.screenRef),
  ...optionalString("path", route.path),
  params: [...route.params],
  query: [...route.query],
  guards: [...route.guards],
  links: [...route.links],
  deepLinks: [...route.deepLinks],
  presentation: route.presentation,
  children: [...route.children],
});

class RouteCollectionBuilder {
  protected readonly routes: KatalixRouteManifest[] = [];

  screen(
    id: string,
    screenRef: string,
    author?: (route: KatalixRouteBuilder) => KatalixRouteBuilder,
  ): this {
    return this.addRoute("screen", id, screenRef, "card", author);
  }

  layout(id: string, author?: (route: KatalixRouteBuilder) => KatalixRouteBuilder): this {
    return this.addRoute("layout", id, undefined, "card", author);
  }

  stack(id: string, author?: (route: KatalixRouteBuilder) => KatalixRouteBuilder): this {
    return this.addRoute("stack", id, undefined, "card", author);
  }

  tabs(id: string, author?: (route: KatalixRouteBuilder) => KatalixRouteBuilder): this {
    return this.addRoute("tabs", id, undefined, "card", author);
  }

  modal(
    id: string,
    screenRef: string,
    author?: (route: KatalixRouteBuilder) => KatalixRouteBuilder,
  ): this {
    return this.addRoute("modal", id, screenRef, "modal", author);
  }

  sheet(
    id: string,
    screenRef: string,
    author?: (route: KatalixRouteBuilder) => KatalixRouteBuilder,
  ): this {
    return this.addRoute("sheet", id, screenRef, "sheet", author);
  }

  group(id: string, author?: (route: KatalixRouteBuilder) => KatalixRouteBuilder): this {
    return this.addRoute("group", id, undefined, "card", author);
  }

  toManifest(): readonly KatalixRouteManifest[] {
    return [...this.routes];
  }

  private addRoute(
    kind: KatalixRouteKind,
    id: string,
    screenRef: string | undefined,
    presentation: KatalixRoutePresentation,
    author?: (route: KatalixRouteBuilder) => KatalixRouteBuilder,
  ): this {
    const builder = new KatalixRouteBuilder(kind, id, screenRef, presentation);
    const route = author ? author(builder).toManifestRoute() : builder.toManifestRoute();
    this.routes.push(route);
    return this;
  }
}

export class KatalixRoutesBuilder extends RouteCollectionBuilder {}

export class KatalixRouteBuilder extends RouteCollectionBuilder {
  private readonly route: MutableRoute;

  constructor(
    kind: KatalixRouteKind,
    id: string,
    screenRef: string | undefined,
    presentation: KatalixRoutePresentation,
  ) {
    super();
    this.route = {
      id,
      kind,
      ...optionalString("screenRef", screenRef),
      params: [],
      query: [],
      guards: [],
      links: [],
      deepLinks: [],
      presentation,
      children: [],
    };
  }

  path(path: string): this {
    this.route.path = path;
    return this;
  }

  param(name: string, options: Omit<KatalixRouteParam, "name">): this {
    this.route.params.push({ name, ...options });
    return this;
  }

  queryParam(name: string, options: Omit<KatalixRouteParam, "name">): this {
    this.route.query.push({ name, ...options });
    return this;
  }

  guard(id: string): this {
    this.route.guards.push(id);
    return this;
  }

  link(id: string, href: string): this {
    this.route.links.push({ id, href });
    return this;
  }

  deepLink(uri: string): this {
    this.route.deepLinks.push(uri);
    return this;
  }

  toManifestRoute(): KatalixRouteManifest {
    return toManifestRoute({
      ...this.route,
      children: [...this.toManifest()],
    });
  }
}

export class KatalixNavigationBuilder {
  private state: NavigationBuilderState;

  constructor(name: string) {
    this.state = {
      name,
      routes: [],
      builderTrace: [`Navigation("${name}")`],
    };
  }

  routes(author: (routes: KatalixRoutesBuilder) => KatalixRoutesBuilder): this {
    const builder = author(new KatalixRoutesBuilder());
    this.state = {
      ...this.state,
      routes: builder.toManifest(),
      builderTrace: [...this.state.builderTrace, "routes"],
    };
    return this;
  }

  toManifest(options?: ToRouteManifestOptions): KatalixNavigationManifest {
    return withValidation(
      {
        kind: "navigation",
        name: this.state.name,
        routes: [...this.state.routes],
        meta: {
          path: "navigation",
          builderTrace: [...this.state.builderTrace],
        },
      },
      options,
    );
  }

  validate(options?: ToRouteManifestOptions): ValidationResult {
    return this.toManifest({ ...options, throwOnError: false }).validation;
  }

  debug(options?: ToRouteManifestOptions) {
    const manifest = this.toManifest({ ...options, throwOnError: false });
    return {
      manifest,
      validation: manifest.validation,
      printed: printRouteManifest(manifest),
    };
  }
}

export const Navigation = (name: string) => new KatalixNavigationBuilder(name);

const withChildren = <T extends { readonly children?: readonly T[] }>(
  route: Omit<T, "children">,
  children: readonly T[],
): T => ({
  ...route,
  ...(children.length > 0 ? { children } : {}),
}) as T;

export const createReactRouterRoutes = (
  manifest: KatalixNavigationManifest,
): readonly ReactRouterRouteContract[] =>
  manifest.routes.map(toReactRouterRoute);

const toReactRouterRoute = (route: KatalixRouteManifest): ReactRouterRouteContract =>
  withChildren<ReactRouterRouteContract>(
    {
      id: route.id,
      ...optionalString("path", route.path),
      ...(route.screenRef ? { elementRef: route.screenRef } : {}),
    },
    route.children.map(toReactRouterRoute),
  );

export const createTanStackRouteTree = (
  manifest: KatalixNavigationManifest,
): readonly TanStackRouteContract[] =>
  manifest.routes.map(toTanStackRoute);

const toTanStackRoute = (route: KatalixRouteManifest): TanStackRouteContract =>
  withChildren<TanStackRouteContract>(
    {
      id: route.id,
      ...optionalString("path", route.path),
      ...(route.screenRef ? { componentRef: route.screenRef } : {}),
    },
    route.children.map(toTanStackRoute),
  );

export const createReactNavigationScreens = (
  manifest: KatalixNavigationManifest,
): readonly ReactNavigationScreenContract[] =>
  manifest.routes.map(toReactNavigationScreen);

const toReactNavigationScreen = (
  route: KatalixRouteManifest,
): ReactNavigationScreenContract =>
  withChildren<ReactNavigationScreenContract>(
    {
      name: route.id,
      ...(route.screenRef ? { componentRef: route.screenRef } : {}),
      presentation: route.presentation,
    },
    route.children.map(toReactNavigationScreen),
  );

const printRoute = (route: KatalixRouteManifest, depth: number): readonly string[] => {
  const indent = "  ".repeat(depth);
  const parts = [`${indent}${route.kind} id=${route.id}`];
  if (route.path !== undefined) {
    parts.push(`path=${route.path}`);
  }
  if (route.screenRef) {
    parts.push(`screen=${route.screenRef}`);
  }

  return [
    parts.join(" "),
    ...route.children.flatMap((child) => printRoute(child, depth + 1)),
  ];
};

export const printRouteManifest = (manifest: KatalixNavigationManifest) =>
  [
    `navigation name=${manifest.name} routes=${manifest.routes.length}`,
    ...manifest.routes.flatMap((route) => printRoute(route, 1)),
  ].join("\n");
