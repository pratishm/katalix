/** Declarative action reference — resolved by renderers at interaction time. */
export type LattixActionId = string;

export interface LattixActionPayload {
  readonly [key: string]: unknown;
}

/** Action attached to interactive nodes (e.g. button onPress). */
export interface LattixAction {
  readonly id: LattixActionId;
  readonly payload?: LattixActionPayload;
}

/** Convenience shape stored on node props. */
export interface LattixActionProps {
  readonly onPress?: LattixAction | LattixActionId;
  readonly onChange?: LattixAction | LattixActionId;
  readonly onSubmit?: LattixAction | LattixActionId;
}
