import React from "react";
import { createBrowserRouter } from "react-router-dom";
import { App } from "./App.js";
import { routeAdapterContract } from "./katalix/navigation.js";

const screenElements: Record<string, React.ReactNode> = {
  HomeScreen: <App />,
};

const routes = routeAdapterContract.map((route) => ({
  id: route.id,
  path: route.path,
  element: screenElements[route.elementRef ?? "HomeScreen"] ?? <App />,
}));

export const router = createBrowserRouter(routes);
