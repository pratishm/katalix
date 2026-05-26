import { ScreenBuilder, type ScreenCallback } from "./builders/screen.js";

/** Create a screen using PascalCase entry (matches component naming). */
export const Screen = (id: string, configure?: ScreenCallback): ScreenBuilder =>
  new ScreenBuilder(id, configure);

/** Create a screen using lowercase entry. */
export const screen = Screen;
