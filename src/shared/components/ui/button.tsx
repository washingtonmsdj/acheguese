/* eslint-disable react-refresh/only-export-components */
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/utils/cn";

type PolymorphicSlotProps = React.HTMLAttributes<HTMLElement> & {
  children?: React.ReactNode;
};

function composeRefs<T>(
  ...refs: Array<React.Ref<T> | undefined>
): React.RefCallback<T> {
  return (node) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === "function") {
        ref(node);
        return;
      }
      (ref as React.MutableRefObject<T | null>).current = node;
    });
  };
}

function isEventHandler(propName: string, value: unknown): value is (...args: unknown[]) => void {
  return /^on[A-Z]/.test(propName) && typeof value === "function";
}

function getPropValue(props: React.HTMLAttributes<HTMLElement>, propName: string): unknown {
  return Object.entries(props).find(([entryName]) => entryName === propName)?.[1];
}

function isStyleValue(value: unknown): value is React.CSSProperties {
  return typeof value === "object" && value !== null;
}

function mergeSlotProps(
  slotProps: React.HTMLAttributes<HTMLElement>,
  childProps: React.HTMLAttributes<HTMLElement>,
): React.HTMLAttributes<HTMLElement> {
  const propNames = new Set([...Object.keys(slotProps), ...Object.keys(childProps)]);
  const mergedEntries = Array.from(propNames, (propName): [string, unknown] => {
    const childValue = getPropValue(childProps, propName);
    const slotValue = getPropValue(slotProps, propName);

    if (isEventHandler(propName, childValue) && isEventHandler(propName, slotValue)) {
      return [propName, (...args: unknown[]) => {
        childValue(...args);
        const event = args[0] as { defaultPrevented?: boolean } | undefined;
        if (!event?.defaultPrevented) {
          slotValue(...args);
        }
      }];
    }

    if (propName === "className") {
      return [propName, cn(slotProps.className, childProps.className)];
    }

    if (propName === "style") {
      return [
        propName,
        {
          ...(isStyleValue(slotValue) ? slotValue : undefined),
          ...(isStyleValue(childValue) ? childValue : undefined),
        },
      ];
    }

    return [propName, childValue ?? slotValue];
  });

  return Object.fromEntries(mergedEntries) as React.HTMLAttributes<HTMLElement>;
}

const ButtonSlot = React.forwardRef<HTMLElement, PolymorphicSlotProps>(
  ({ children, ...props }, ref) => {
    if (!React.isValidElement<React.HTMLAttributes<HTMLElement>>(children)) {
      return null;
    }

    const child = children;
    const childRef = (child as { ref?: React.Ref<HTMLElement> }).ref;

    const mergedProps = {
      ...mergeSlotProps(props, child.props),
      ref: composeRefs(ref, childRef),
    } as React.HTMLAttributes<HTMLElement> & React.RefAttributes<HTMLElement>;

    return React.cloneElement(child, mergedProps);
  },
);
ButtonSlot.displayName = "ButtonSlot";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? ButtonSlot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref as React.Ref<HTMLButtonElement> & React.Ref<HTMLElement>}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
