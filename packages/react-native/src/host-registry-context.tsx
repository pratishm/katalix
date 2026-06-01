import React from "react";
import type { KatalixNode } from "@katalix/core";

export type HostComponentRenderer = React.ComponentType<{ readonly node: KatalixNode }>;

export type HostComponentRegistry = Readonly<Record<string, HostComponentRenderer>>;

const defaultRegistry: HostComponentRegistry = {};

export const KatalixHostRegistryContext =
  React.createContext<HostComponentRegistry>(defaultRegistry);

export const useHostComponent = (componentId: string): HostComponentRenderer | undefined => {
  const registry = React.useContext(KatalixHostRegistryContext);
  return registry[componentId];
};
