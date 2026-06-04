export interface PushPayload {
  readonly title?: string;
  readonly body?: string;
  readonly data?: Readonly<Record<string, unknown>>;
}

export interface PushAdapter {
  readonly requestPermission: () => Promise<boolean>;
  readonly getToken: () => Promise<string | null>;
  readonly onMessage: (handler: (payload: PushPayload) => void) => () => void;
}

export interface PushRuntime {
  readonly capabilityIds: readonly string[];
  readonly requestPermission: () => Promise<boolean>;
  readonly getToken: () => Promise<string | null>;
  readonly onMessage: (handler: (payload: PushPayload) => void) => () => void;
}
