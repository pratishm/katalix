import React, { createContext, useContext } from "react";
import type { KatalixNode } from "@katalix/core";

export type HostComponent = React.ComponentType<{ readonly node: KatalixNode }>;

export type HostComponentRegistry = Readonly<Record<string, HostComponent>>;

const KatalixHostRegistryContext = createContext<HostComponentRegistry | null>(null);

export const KatalixHostRegistryContextProvider: React.FC<{
  readonly value: HostComponentRegistry;
  readonly children: React.ReactNode;
}> = ({ value, children }) => (
  <KatalixHostRegistryContext.Provider value={value}>{children}</KatalixHostRegistryContext.Provider>
);

export const useHostComponent = (componentId: string): HostComponent | undefined => {
  const registry = useContext(KatalixHostRegistryContext);
  return registry?.[componentId];
};
