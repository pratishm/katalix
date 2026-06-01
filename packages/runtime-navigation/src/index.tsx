import React from "react";
import type { KatalixNavigationManifest, KatalixRouteManifest } from "@katalix/navigation";
import { createReactNavigationScreens } from "@katalix/navigation";

export interface AuthGuardRuntime {
  readonly isAuthenticated: () => boolean;
  readonly loginRoute?: string;
}

export interface ReactNavigationFactories {
  readonly NavigationContainer: React.ComponentType<{ children: React.ReactNode }>;
  readonly createBottomTabNavigator: () => {
    Navigator: React.ComponentType<{ children: React.ReactNode; screenOptions?: Record<string, unknown> }>;
    Screen: React.ComponentType<{ name: string; component?: React.ComponentType; options?: Record<string, unknown> }>;
  };
  readonly createNativeStackNavigator: () => {
    Navigator: React.ComponentType<{ children: React.ReactNode; screenOptions?: Record<string, unknown> }>;
    Screen: React.ComponentType<{ name: string; component?: React.ComponentType; options?: Record<string, unknown> }>;
  };
}

export interface CreateReactNavigationNavigatorsOptions {
  readonly guards?: AuthGuardRuntime;
  readonly components?: Readonly<Record<string, React.ComponentType>>;
  readonly screenOptions?: Record<string, unknown>;
}

const resolveComponent = (
  route: KatalixRouteManifest,
  components: Readonly<Record<string, React.ComponentType>> | undefined,
): React.ComponentType | undefined => {
  const ref = route.screenRef;
  if (!ref || !components) {
    return undefined;
  }
  return components[ref];
};

const renderRouteScreens = (
  routes: readonly KatalixRouteManifest[],
  Screen: React.ComponentType<{
    name: string;
    component?: React.ComponentType;
    options?: Record<string, unknown>;
  }>,
  components: Readonly<Record<string, React.ComponentType>> | undefined,
  guards: AuthGuardRuntime | undefined,
): React.ReactNode[] =>
  routes.flatMap((route) => {
    const guarded =
      guards &&
      route.guards.includes("authenticated") &&
      !guards.isAuthenticated()
        ? false
        : true;
    if (!guarded) {
      return [];
    }
    const element = resolveComponent(route, components);
    const screens: React.ReactNode[] = [
      <Screen
        key={route.id}
        name={route.id}
        {...(element ? { component: element } : {})}
        options={{
          ...(route.presentation === "modal" ? { presentation: "modal" as const } : {}),
        }}
      />,
    ];
    if (route.children.length > 0) {
      screens.push(...renderRouteScreens(route.children, Screen, components, guards));
    }
    return screens;
  });

/** Build tab + stack navigators from a Katalix navigation manifest (GAP-NAV-001). */
export const createReactNavigationNavigators = (
  manifest: KatalixNavigationManifest,
  factories: ReactNavigationFactories,
  options: CreateReactNavigationNavigatorsOptions = {},
): React.ReactElement => {
  const { NavigationContainer, createBottomTabNavigator, createNativeStackNavigator } =
    factories;
  const tabRoutes = manifest.routes.filter((r) => r.kind === "tabs");
  const stackRoutes = manifest.routes.filter((r) => r.kind === "stack" || r.kind === "screen");
  const leafRoutes =
    tabRoutes.length === 0 && stackRoutes.length === 0 ? manifest.routes : stackRoutes;

  const Stack = createNativeStackNavigator();
  const stackScreens = renderRouteScreens(
    leafRoutes,
    Stack.Screen,
    options.components,
    options.guards,
  );

  const stackNav = (
    <Stack.Navigator screenOptions={options.screenOptions}>{stackScreens}</Stack.Navigator>
  );

  if (tabRoutes.length === 0) {
    return <NavigationContainer>{stackNav}</NavigationContainer>;
  }

  const Tab = createBottomTabNavigator();
  const tabScreens = tabRoutes.map((tab) => (
    <Tab.Screen
      key={tab.id}
      name={tab.id}
      component={() => (
        <Stack.Navigator>
          {renderRouteScreens(tab.children, Stack.Screen, options.components, options.guards)}
        </Stack.Navigator>
      )}
    />
  ));

  return (
    <NavigationContainer>
      <Tab.Navigator>{tabScreens}</Tab.Navigator>
    </NavigationContainer>
  );
};

export { createReactNavigationScreens };
