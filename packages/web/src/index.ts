import type {
  KatalixDiagnostic,
  KatalixSourceLocation,
  ValidationMode,
  ValidationResult,
} from "@katalix/core";

export type KatalixWebRenderingMode = "spa" | "ssr" | "ssg";
export type KatalixWebFramework = "vite" | "next" | "remix";

export interface KatalixWebMetaTag {
  readonly name: string;
  readonly content: string;
}

export interface KatalixWebOpenGraphTag {
  readonly property: string;
  readonly content: string;
}

export interface KatalixWebMetadataManifest {
  readonly title?: string;
  readonly description?: string;
  readonly canonical?: string;
  readonly openGraph: readonly KatalixWebOpenGraphTag[];
  readonly favicons: readonly string[];
  readonly themeColor?: string;
  readonly meta: readonly KatalixWebMetaTag[];
}

export interface KatalixWebViewport {
  readonly width: string;
  readonly initialScale: number;
}

export interface KatalixWebBreakpoint {
  readonly name: string;
  readonly minWidth: number;
}

export interface KatalixWebRouteBoundary {
  readonly routeRef: string;
  readonly loading?: string;
  readonly error?: string;
}

export interface KatalixWebPwaManifest {
  readonly manifestPath: string;
  readonly serviceWorker?: string;
}

export interface KatalixWebRenderingManifest {
  readonly mode: KatalixWebRenderingMode;
  readonly framework: string;
}

export interface KatalixWebExternalLink {
  readonly id: string;
  readonly href: string;
  readonly rel?: string;
}

export interface KatalixWebStorageDeclaration {
  readonly id: string;
  readonly adapter: string;
  readonly sensitive?: boolean;
}

export interface KatalixWebUnsafeHtml {
  readonly id: string;
  readonly html: string;
}

export interface KatalixWebManifestMeta {
  readonly source?: KatalixSourceLocation;
  readonly path: string;
  readonly builderTrace: readonly string[];
}

export interface KatalixWebManifest {
  readonly kind: "web";
  readonly name: string;
  readonly metadata: KatalixWebMetadataManifest;
  readonly viewport?: KatalixWebViewport;
  readonly breakpoints: readonly KatalixWebBreakpoint[];
  readonly cssReset?: string;
  readonly focusTraps: readonly string[];
  readonly skipLinks: readonly string[];
  readonly routeBoundaries: readonly KatalixWebRouteBoundary[];
  readonly capabilities: readonly string[];
  readonly pwa?: KatalixWebPwaManifest;
  readonly rendering: KatalixWebRenderingManifest;
  readonly externalLinks: readonly KatalixWebExternalLink[];
  readonly storage: readonly KatalixWebStorageDeclaration[];
  readonly unsafeHtml: readonly KatalixWebUnsafeHtml[];
  readonly meta: KatalixWebManifestMeta;
  readonly validation: ValidationResult;
}

export interface ToWebManifestOptions {
  readonly mode?: ValidationMode;
  readonly throwOnError?: boolean;
}

export interface DocumentHeadPlan {
  readonly title?: string;
  readonly meta: readonly KatalixWebMetaTag[];
  readonly links: readonly { readonly rel: string; readonly href: string }[];
  readonly openGraph: readonly KatalixWebOpenGraphTag[];
  readonly themeColor?: string;
}

export interface WebAdapterPlan {
  readonly name: string;
  readonly framework: string;
  readonly renderingMode: KatalixWebRenderingMode;
  readonly capabilities: readonly string[];
  readonly pwa?: KatalixWebPwaManifest;
}

interface WebBuilderState {
  readonly name: string;
  readonly metadata: KatalixWebMetadataManifest;
  readonly viewport?: KatalixWebViewport;
  readonly breakpoints: readonly KatalixWebBreakpoint[];
  readonly cssReset?: string;
  readonly focusTraps: readonly string[];
  readonly skipLinks: readonly string[];
  readonly routeBoundaries: readonly KatalixWebRouteBoundary[];
  readonly capabilities: readonly string[];
  readonly pwa?: KatalixWebPwaManifest;
  readonly rendering: KatalixWebRenderingManifest;
  readonly externalLinks: readonly KatalixWebExternalLink[];
  readonly storage: readonly KatalixWebStorageDeclaration[];
  readonly unsafeHtml: readonly KatalixWebUnsafeHtml[];
  readonly builderTrace: readonly string[];
}

const runtimeDiagnostic = (
  diagnostic: Omit<KatalixDiagnostic, "manifestKind">,
): KatalixDiagnostic => ({
  manifestKind: "web",
  ...diagnostic,
});

const emptyMetadata = (): KatalixWebMetadataManifest => ({
  openGraph: [],
  favicons: [],
  meta: [],
});

export class KatalixWebValidationError extends Error {
  readonly diagnostics: readonly KatalixDiagnostic[];

  constructor(diagnostics: readonly KatalixDiagnostic[]) {
    super(diagnostics[0]?.summary ?? "Katalix web manifest validation failed.");
    this.name = "KatalixWebValidationError";
    this.diagnostics = diagnostics;
  }
}

export const validateWebManifest = (
  manifest: KatalixWebManifest,
): ValidationResult => {
  const diagnostics: KatalixDiagnostic[] = [];

  if (manifest.name.trim().length === 0) {
    diagnostics.push(
      runtimeDiagnostic({
        code: "KATALIX_INVALID_WEB_NAME",
        message: "Web manifest name is required.",
        summary: "Web manifest name is required.",
        path: "web.name",
        field: "name",
        received: manifest.name,
        expected: "A non-empty web manifest name.",
        suggestion: 'Pass a non-empty name to Web("Name").',
      }),
    );
  }

  if (manifest.metadata.canonical?.startsWith("http://")) {
    diagnostics.push(
      runtimeDiagnostic({
        code: "KATALIX_MIXED_CONTENT_ASSUMPTION",
        message: "Canonical URL uses http.",
        summary: "Production web metadata should not assume insecure HTTP.",
        path: "web.metadata.canonical",
        field: "metadata.canonical",
        received: manifest.metadata.canonical,
        expected: "An https canonical URL.",
        suggestion: "Use an https canonical URL.",
      }),
    );
  }

  manifest.externalLinks.forEach((link, index) => {
    if (link.href.startsWith("http") && !link.rel?.includes("noopener")) {
      diagnostics.push(
        runtimeDiagnostic({
          code: "KATALIX_UNSAFE_WEB_EXTERNAL_LINK",
          message: `External link "${link.id}" is missing rel=noopener.`,
          summary: "External links should declare safe rel attributes.",
          path: `web.externalLinks[${index}].rel`,
          field: "externalLinks.rel",
          received: link.rel,
          expected: "noopener and noreferrer for external links.",
          suggestion: "Add rel='noopener noreferrer' to the external link declaration.",
        }),
      );
    }
  });

  manifest.storage.forEach((storage, index) => {
    if (storage.sensitive && storage.adapter === "localStorage") {
      diagnostics.push(
        runtimeDiagnostic({
          code: "KATALIX_INSECURE_WEB_STORAGE",
          message: `Sensitive web storage "${storage.id}" uses localStorage.`,
          summary: "Sensitive browser data should not be stored in localStorage.",
          path: `web.storage[${index}].adapter`,
          field: "storage.adapter",
          received: storage.adapter,
          expected: "A secure server/session-backed storage strategy.",
          suggestion: "Use a safer storage strategy or mark the data as non-sensitive.",
        }),
      );
    }
  });

  manifest.unsafeHtml.forEach((entry, index) => {
    diagnostics.push(
      runtimeDiagnostic({
        code: "KATALIX_UNSAFE_INLINE_HTML",
        message: `Inline HTML "${entry.id}" requires explicit host sanitization.`,
        summary: "Inline HTML is a security-sensitive web capability.",
        path: `web.unsafeHtml[${index}]`,
        field: "unsafeHtml",
        received: entry.id,
        expected: "Sanitized host-owned HTML or no inline HTML.",
        suggestion: "Avoid inline HTML or sanitize it in host code.",
      }),
    );
  });

  if (manifest.rendering.mode !== "spa" || manifest.rendering.framework !== "vite") {
    diagnostics.push(
      runtimeDiagnostic({
        code: "KATALIX_UNSUPPORTED_WEB_RENDERING_TARGET",
        message: `${manifest.rendering.framework} ${manifest.rendering.mode} is a future web adapter target.`,
        summary: "Initial Katalix web runtime contracts target Vite SPA first.",
        path: "web.rendering.framework",
        field: "rendering.framework",
        received: manifest.rendering,
        expected: "Vite SPA for the initial runtime boundary.",
        suggestion: "Use Vite SPA now; keep SSR/SSG, Next.js, and Remix as future adapter boundaries.",
      }),
    );
  }

  return {
    valid: diagnostics.length === 0,
    diagnostics,
  };
};

const withValidation = (
  manifest: Omit<KatalixWebManifest, "validation">,
  options: ToWebManifestOptions = {},
): KatalixWebManifest => {
  const completeManifest = {
    ...manifest,
    validation: { valid: true, diagnostics: [] },
  } satisfies KatalixWebManifest;
  const validation = validateWebManifest(completeManifest);
  const validatedManifest = { ...completeManifest, validation };
  const mode = options.mode ?? "strict";
  const throwOnError = options.throwOnError ?? mode === "strict";

  if (!validation.valid && throwOnError) {
    throw new KatalixWebValidationError(validation.diagnostics);
  }

  return validatedManifest;
};

export class KatalixWebMetadataBuilder {
  private metadata = emptyMetadata();

  title(title: string): this {
    this.metadata = { ...this.metadata, title };
    return this;
  }

  description(description: string): this {
    this.metadata = { ...this.metadata, description };
    return this;
  }

  canonical(canonical: string): this {
    this.metadata = { ...this.metadata, canonical };
    return this;
  }

  openGraph(property: string, content: string): this {
    this.metadata = {
      ...this.metadata,
      openGraph: [...this.metadata.openGraph, { property, content }],
    };
    return this;
  }

  favicon(href: string): this {
    this.metadata = { ...this.metadata, favicons: [...this.metadata.favicons, href] };
    return this;
  }

  themeColor(themeColor: string): this {
    this.metadata = { ...this.metadata, themeColor };
    return this;
  }

  meta(name: string, content: string): this {
    this.metadata = {
      ...this.metadata,
      meta: [...this.metadata.meta, { name, content }],
    };
    return this;
  }

  toManifest(): KatalixWebMetadataManifest {
    return { ...this.metadata };
  }
}

export class KatalixWebBuilder {
  private state: WebBuilderState;

  constructor(name: string) {
    this.state = {
      name,
      metadata: emptyMetadata(),
      breakpoints: [],
      focusTraps: [],
      skipLinks: [],
      routeBoundaries: [],
      capabilities: [],
      rendering: { mode: "spa", framework: "vite" },
      externalLinks: [],
      storage: [],
      unsafeHtml: [],
      builderTrace: [`Web("${name}")`],
    };
  }

  metadata(author: (metadata: KatalixWebMetadataBuilder) => KatalixWebMetadataBuilder): this {
    const builder = author(new KatalixWebMetadataBuilder());
    this.state = {
      ...this.state,
      metadata: builder.toManifest(),
      builderTrace: [...this.state.builderTrace, "metadata"],
    };
    return this;
  }

  viewport(viewport: KatalixWebViewport): this {
    this.state = { ...this.state, viewport, builderTrace: [...this.state.builderTrace, "viewport"] };
    return this;
  }

  breakpoint(name: string, minWidth: number): this {
    this.state = {
      ...this.state,
      breakpoints: [...this.state.breakpoints, { name, minWidth }],
      builderTrace: [...this.state.builderTrace, "breakpoint"],
    };
    return this;
  }

  cssReset(cssReset: string): this {
    this.state = { ...this.state, cssReset, builderTrace: [...this.state.builderTrace, "cssReset"] };
    return this;
  }

  focusTrap(id: string): this {
    this.state = {
      ...this.state,
      focusTraps: [...this.state.focusTraps, id],
      builderTrace: [...this.state.builderTrace, "focusTrap"],
    };
    return this;
  }

  skipLink(id: string): this {
    this.state = {
      ...this.state,
      skipLinks: [...this.state.skipLinks, id],
      builderTrace: [...this.state.builderTrace, "skipLink"],
    };
    return this;
  }

  routeBoundary(routeRef: string, boundary: Omit<KatalixWebRouteBoundary, "routeRef">): this {
    this.state = {
      ...this.state,
      routeBoundaries: [...this.state.routeBoundaries, { routeRef, ...boundary }],
      builderTrace: [...this.state.builderTrace, "routeBoundary"],
    };
    return this;
  }

  capability(id: string): this {
    this.state = {
      ...this.state,
      capabilities: [...this.state.capabilities, id],
      builderTrace: [...this.state.builderTrace, "capability"],
    };
    return this;
  }

  pwa(pwa: KatalixWebPwaManifest): this {
    this.state = { ...this.state, pwa, builderTrace: [...this.state.builderTrace, "pwa"] };
    return this;
  }

  rendering(rendering: KatalixWebRenderingManifest): this {
    this.state = {
      ...this.state,
      rendering,
      builderTrace: [...this.state.builderTrace, "rendering"],
    };
    return this;
  }

  externalLink(id: string, href: string, options: { readonly rel?: string } = {}): this {
    this.state = {
      ...this.state,
      externalLinks: [...this.state.externalLinks, { id, href, ...options }],
      builderTrace: [...this.state.builderTrace, "externalLink"],
    };
    return this;
  }

  storage(id: string, options: Omit<KatalixWebStorageDeclaration, "id">): this {
    this.state = {
      ...this.state,
      storage: [...this.state.storage, { id, ...options }],
      builderTrace: [...this.state.builderTrace, "storage"],
    };
    return this;
  }

  unsafeHtml(id: string, html: string): this {
    this.state = {
      ...this.state,
      unsafeHtml: [...this.state.unsafeHtml, { id, html }],
      builderTrace: [...this.state.builderTrace, "unsafeHtml"],
    };
    return this;
  }

  toManifest(options?: ToWebManifestOptions): KatalixWebManifest {
    return withValidation(
      {
        kind: "web",
        name: this.state.name,
        metadata: this.state.metadata,
        ...(this.state.viewport ? { viewport: this.state.viewport } : {}),
        breakpoints: [...this.state.breakpoints],
        ...(this.state.cssReset ? { cssReset: this.state.cssReset } : {}),
        focusTraps: [...this.state.focusTraps],
        skipLinks: [...this.state.skipLinks],
        routeBoundaries: [...this.state.routeBoundaries],
        capabilities: [...this.state.capabilities],
        ...(this.state.pwa ? { pwa: this.state.pwa } : {}),
        rendering: this.state.rendering,
        externalLinks: [...this.state.externalLinks],
        storage: [...this.state.storage],
        unsafeHtml: [...this.state.unsafeHtml],
        meta: {
          path: "web",
          builderTrace: [...this.state.builderTrace],
        },
      },
      options,
    );
  }

  validate(options?: ToWebManifestOptions): ValidationResult {
    return this.toManifest({ ...options, throwOnError: false }).validation;
  }

  debug(options?: ToWebManifestOptions) {
    const manifest = this.toManifest({ ...options, throwOnError: false });
    return {
      manifest,
      validation: manifest.validation,
      printed: printWebManifest(manifest),
    };
  }
}

export const Web = (name: string) => new KatalixWebBuilder(name);

export const createDocumentHead = (manifest: KatalixWebManifest): DocumentHeadPlan => ({
  ...(manifest.metadata.title ? { title: manifest.metadata.title } : {}),
  meta: [
    ...(manifest.metadata.description
      ? [{ name: "description", content: manifest.metadata.description }]
      : []),
    ...manifest.metadata.meta,
  ],
  links: [
    ...(manifest.metadata.canonical
      ? [{ rel: "canonical", href: manifest.metadata.canonical }]
      : []),
    ...manifest.metadata.favicons.map((href) => ({ rel: "icon", href })),
  ],
  openGraph: [...manifest.metadata.openGraph],
  themeColor: manifest.metadata.themeColor,
});

export const createWebAdapterPlan = (manifest: KatalixWebManifest): WebAdapterPlan => ({
  name: manifest.name,
  framework: manifest.rendering.framework,
  renderingMode: manifest.rendering.mode,
  capabilities: [...manifest.capabilities],
  ...(manifest.pwa ? { pwa: manifest.pwa } : {}),
});

export const printWebManifest = (manifest: KatalixWebManifest) =>
  `web name=${manifest.name} framework=${manifest.rendering.framework}`;
