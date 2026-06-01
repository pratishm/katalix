import React from "react";
import type { KatalixNativeManifest, KatalixNativeLayoutManifest } from "@katalix/native";

export interface NativeLayoutContextValue {
  readonly layout: KatalixNativeLayoutManifest;
  readonly onRefresh?: (controlId: string) => void;
}

export const NativeLayoutContext = React.createContext<NativeLayoutContextValue>({
  layout: {
    gestures: [],
    portals: [],
    toasts: [],
    refreshControls: [],
    bottomSheets: [],
  },
});

export const useNativeLayout = (): NativeLayoutContextValue =>
  React.useContext(NativeLayoutContext);

export interface NativeLayoutProviderProps {
  readonly manifest: KatalixNativeManifest;
  readonly onRefresh?: (controlId: string) => void;
  readonly KeyboardAvoidingView?: React.ComponentType<{
    behavior?: string;
    style?: Record<string, unknown>;
    children?: React.ReactNode;
  }>;
  readonly children: React.ReactNode;
}

/** Applies keyboard avoidance and layout flags from native manifest (GAP-ADAPTER-007). */
export const NativeLayoutProvider: React.FC<NativeLayoutProviderProps> = ({
  manifest,
  onRefresh,
  KeyboardAvoidingView,
  children,
}) => {
  const value: NativeLayoutContextValue = {
    layout: manifest.layout,
    onRefresh,
  };

  let content = <NativeLayoutContext.Provider value={value}>{children}</NativeLayoutContext.Provider>;

  if (manifest.layout.keyboard === "avoid" && KeyboardAvoidingView) {
    content = (
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        {content}
      </KeyboardAvoidingView>
    );
  }

  return content;
};

export const shouldUseSafeArea = (layout: KatalixNativeLayoutManifest): boolean =>
  layout.safeArea === "required" || layout.safeArea === "optional";
