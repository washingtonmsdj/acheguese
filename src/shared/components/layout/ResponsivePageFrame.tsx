import type { HTMLAttributes } from "react";
import { cn } from "@/shared/utils/cn";

export type ResponsivePageFrameWidth = "standard" | "wide";

interface ResponsivePageFrameProps extends HTMLAttributes<HTMLElement> {
  as?: "div" | "main" | "section";
  width?: ResponsivePageFrameWidth;
}

const PAGE_FRAME_WIDTHS: Record<ResponsivePageFrameWidth, string> = {
  standard: "max-w-6xl",
  wide: "max-w-[76rem]",
};

/** Shared responsive gutters and content width for page-level surfaces. */
export function ResponsivePageFrame({
  as: Element = "div",
  width = "standard",
  className,
  ...props
}: ResponsivePageFrameProps) {
  return (
    <Element
      className={cn(
        "mx-auto w-full min-w-0 px-4 sm:px-6 lg:px-8",
        PAGE_FRAME_WIDTHS[width],
        className,
      )}
      data-responsive-page-frame={width}
      {...props}
    />
  );
}
