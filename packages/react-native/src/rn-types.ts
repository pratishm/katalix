/**
 * Minimal React Native type surface used by the renderer.
 *
 * At runtime the real `react-native` module is imported dynamically.
 * These types exist so the package compiles without react-native installed
 * as a direct dependency (it is a peerDependency).
 */
import type React from "react";

/** Subset of RN ViewStyle used by the renderer. */
export interface RNViewStyle {
  readonly flex?: number;
  readonly flexGrow?: number;
  readonly flexShrink?: number;
  readonly flexDirection?: "row" | "column";
  readonly alignItems?: "flex-start" | "flex-end" | "center" | "stretch" | "baseline";
  readonly alignSelf?: "auto" | "flex-start" | "flex-end" | "center" | "stretch" | "baseline";
  readonly justifyContent?:
    | "flex-start"
    | "flex-end"
    | "center"
    | "space-between"
    | "space-around"
    | "space-evenly";
  readonly gap?: number;
  readonly padding?: number;
  readonly paddingTop?: number;
  readonly paddingBottom?: number;
  readonly paddingLeft?: number;
  readonly paddingRight?: number;
  readonly margin?: number;
  readonly marginTop?: number;
  readonly marginBottom?: number;
  readonly marginLeft?: number;
  readonly marginRight?: number;
  readonly backgroundColor?: string;
  readonly borderRadius?: number;
  readonly borderWidth?: number;
  readonly borderColor?: string;
  readonly width?: number | string;
  readonly height?: number | string;
  readonly minHeight?: number | string;
  readonly paddingHorizontal?: number;
  readonly paddingVertical?: number;
  readonly opacity?: number;
  readonly overflow?: "visible" | "hidden" | "scroll";
  readonly shadowColor?: string;
  readonly shadowOffset?: { readonly width: number; readonly height: number };
  readonly shadowOpacity?: number;
  readonly shadowRadius?: number;
  readonly elevation?: number;
}

/** Subset of RN TextStyle used by the renderer. */
export interface RNTextStyle extends RNViewStyle {
  readonly color?: string;
  readonly fontSize?: number;
  readonly fontWeight?:
    | "normal"
    | "bold"
    | "100"
    | "200"
    | "300"
    | "400"
    | "500"
    | "600"
    | "700"
    | "800"
    | "900";
  readonly textAlign?: "auto" | "left" | "right" | "center" | "justify";
  readonly lineHeight?: number;
}

/** Subset of RN ImageStyle used by the renderer. */
export interface RNImageStyle extends RNViewStyle {
  readonly resizeMode?: "cover" | "contain" | "stretch" | "center";
}

/** Union of all RN style types the renderer produces. */
export type RNStyle = RNViewStyle | RNTextStyle | RNImageStyle;

/** Props accepted by RN View component. */
export interface RNViewProps {
  readonly style?: RNViewStyle;
  readonly testID?: string;
  readonly accessibilityRole?: string;
  readonly edges?: readonly string[];
  readonly children?: React.ReactNode;
}

/** Props accepted by RN Text component. */
export interface RNTextProps {
  readonly style?: RNTextStyle;
  readonly testID?: string;
  readonly numberOfLines?: number;
  readonly selectable?: boolean;
  readonly children?: React.ReactNode;
}

/** Props accepted by RN ScrollView component. */
export interface RNScrollViewProps {
  readonly style?: RNViewStyle;
  readonly contentContainerStyle?: RNViewStyle;
  readonly testID?: string;
  readonly horizontal?: boolean;
  readonly refreshControl?: React.ReactNode;
  readonly children?: React.ReactNode;
}

export interface RNSafeAreaViewProps extends RNViewProps {
  readonly edges?: readonly string[];
}

export interface RNFlatListProps<T> {
  readonly data: readonly T[];
  readonly renderItem: (info: { item: T; index: number }) => React.ReactElement | null;
  readonly keyExtractor?: (item: T, index: number) => string;
  readonly testID?: string;
  readonly style?: RNViewStyle;
  readonly refreshControl?: React.ReactNode;
}

export interface RNModalProps {
  readonly visible?: boolean;
  readonly testID?: string;
  readonly children?: React.ReactNode;
}

export interface RNKeyboardAvoidingViewProps extends RNViewProps {
  readonly behavior?: "height" | "position" | "padding";
  readonly keyboardVerticalOffset?: number;
}

export interface RNSwitchProps {
  readonly value?: boolean;
  readonly onValueChange?: (value: boolean) => void;
  readonly testID?: string;
}

/** Props accepted by RN TextInput component. */
export interface RNTextInputProps {
  readonly style?: RNTextStyle;
  readonly testID?: string;
  readonly placeholder?: string;
  readonly value?: string;
  readonly secureTextEntry?: boolean;
  readonly keyboardType?: string;
  readonly multiline?: boolean;
  readonly editable?: boolean;
  readonly onChangeText?: (text: string) => void;
}

/** Props accepted by RN Pressable component. */
export interface RNPressableProps {
  readonly style?: RNViewStyle;
  readonly testID?: string;
  readonly onPress?: () => void;
  readonly disabled?: boolean;
  readonly accessibilityRole?: string;
  readonly children?: React.ReactNode;
}

/** Props accepted by RN Image component. */
export interface RNImageProps {
  readonly style?: RNImageStyle;
  readonly testID?: string;
  readonly source: { readonly uri: string } | number;
  readonly accessibilityLabel?: string;
  readonly resizeMode?: "cover" | "contain" | "stretch" | "center";
}
