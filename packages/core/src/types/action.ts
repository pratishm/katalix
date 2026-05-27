/** Declarative action reference — resolved by renderers at interaction time. */
export type KatalixActionId = string;

export interface KatalixActionPayload {
  readonly [key: string]: unknown;
}

/** Action attached to interactive nodes (e.g. button onPress). */
export interface KatalixAction {
  readonly id: KatalixActionId;
  readonly payload?: KatalixActionPayload;
}

/** Convenience shape stored on node props. */
export interface KatalixActionProps {
  readonly onPress?: KatalixAction | KatalixActionId;
  readonly onChange?: KatalixAction | KatalixActionId;
  readonly onSubmit?: KatalixAction | KatalixActionId;
}
