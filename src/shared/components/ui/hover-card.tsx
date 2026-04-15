import * as React from "react";
import * as HoverCardPrimitive from "@radix-ui/react-hover-card";

import { cn } from "@/shared/utils/cn";

const HoverCard = HoverCardPrimitive.Root;

const HoverCardTrigger = HoverCardPrimitive.Trigger;

const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <HoverCardPrimitive.Content
    ref={ref}
    align={align}
    sideOffset={sideOffset}
    className={cn(
      "z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none date-[state=open]:animate-in date-[state=closed]:animate-out date-[state=closed]:fade-out-0 date-[state=open]:fade-in-0 date-[state=closed]:zoom-out-95 date-[state=open]:zoom-in-95 date-[side=bottom]:slide-in-from-top-2 date-[side=left]:slide-in-from-right-2 date-[side=right]:slide-in-from-left-2 date-[side=top]:slide-in-from-bottom-2",
      className,
    )}
    {...props}
  />
));
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName;

export { HoverCard, HoverCardTrigger, HoverCardContent };
