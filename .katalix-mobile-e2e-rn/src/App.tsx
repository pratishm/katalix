import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  KatalixNativeRenderer,
  registerDefaultRNComponents,
} from "@katalix/react-native";
import { home } from "./screens/home.screen";
import { appManifest } from "./katalix/app";
import { authManifest } from "./katalix/auth";
import { dataManifest } from "./katalix/data";
import { diagnosticsSummary } from "./katalix/diagnostics";
import { nativeManifest } from "./katalix/native";
import { nativeScreens, routeManifest } from "./katalix/navigation";
import { storageManifest } from "./katalix/storage";

registerDefaultRNComponents();

const Stack = createNativeStackNavigator();
const tree = home.toTree();

const HomeScreen = () => (
  <KatalixNativeRenderer
    tree={tree}
    onAction={(action) => console.log("action:", action)}
  />
);

const screenComponents: Record<string, React.ComponentType> = {
  HomeScreen,
  LoginScreen: HomeScreen,
};

const flattenScreens = (screens: typeof nativeScreens): typeof nativeScreens =>
  screens.flatMap((screen) => [
    screen,
    ...(screen.children ? flattenScreens(screen.children) : []),
  ]);

const registeredScreens = flattenScreens(nativeScreens).filter((screen) => screen.componentRef);

const manifestDiagnostics = diagnosticsSummary([
    appManifest,
    routeManifest,
    dataManifest,
    storageManifest,
    authManifest,
    nativeManifest,
  ]);

const toStackPresentation = (
  presentation: (typeof nativeScreens)[number]["presentation"],
) => (presentation === "sheet" ? "modal" : presentation);

export default function App() {
  return (
    <NavigationContainer
      onReady={() => {
        console.log(manifestDiagnostics);
      }}
    >
      <Stack.Navigator>
        {registeredScreens.map((screen) => (
          <Stack.Screen
            key={screen.name}
            name={screen.name}
            component={screenComponents[screen.componentRef ?? "HomeScreen"] ?? HomeScreen}
            options={{ presentation: toStackPresentation(screen.presentation) }}
          />
        ))}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
