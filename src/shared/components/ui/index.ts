 
/**
 * Shared UI Components
 *
 * Componentes de interface reutilizáveis baseados em shadcn/ui.
 * Estes componentes são agnósticos de domínio e podem ser usados em qualquer módulo.
 */

// Re-export all UI components
export * from "./accordion";
export * from "./alert";
export * from "./alert-dialog";
export * from "./aspect-ratio";
export * from "./avatar";
export * from "./badge";
export * from "./breadcrumb";
export * from "./button";
export * from "./calendar";
export * from "./card";
export * from "./carousel";
export * from "./chart";
export * from "./checkbox";
export * from "./collapsible";
export * from "./command";
export * from "./context-menu";
export * from "./dialog";
export * from "./accessible-dialog";
export * from "./drawer";
export * from "./dropdown-menu";
export * from "./form";
export * from "./hover-card";
export * from "./input";
export * from "./input-otp";
export * from "./label";
export * from "./menubar";
export * from "./navigation-menu";
export * from "./pagination";
export * from "./popover";
export * from "./progress";
export * from "./radio-group";
export * from "./resizable";
export * from "./scroll-area";
export * from "./select";
export * from "./separator";
export * from "./sheet";
export * from "./sidebar";
export * from "./skeleton";
export * from "./slider";
export * from "./sonner";
export * from "./switch";
export * from "./table";
export * from "./tabs";
export * from "./textarea";
export * from "./toggle";
export * from "./toggle-group";
export * from "./tooltip";
export * from "./visually-hidden";

// Custom UI components
export {
  BusinessHeaderSkeleton,
  BusinessSectionSkeleton,
  BusinessGallerySkeleton,
} from "./BusinessSkeleton";
export { ErrorBoundary } from "./ErrorBoundary";
export { OptimizedImage } from "./optimized-image";
export { InfiniteScrollTrigger } from "./InfiniteScrollTrigger";
