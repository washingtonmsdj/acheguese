import { createElement, type ComponentType, type PropsWithChildren } from "react";
import LaunchPausedPage from "@/app/pages/LaunchPausedPage";

type PausedRouteProps = PropsWithChildren<Record<string, unknown>>;

export function createLaunchPausedRoute(moduleName: string): ComponentType<PausedRouteProps> {
  function LaunchPausedRoute() {
    return createElement(LaunchPausedPage, { moduleName });
  }

  LaunchPausedRoute.displayName = `LaunchPaused${moduleName.replace(/\W+/g, "")}`;
  return LaunchPausedRoute;
}
