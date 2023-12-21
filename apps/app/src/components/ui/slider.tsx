"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import * as React from "react";

import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    variant?: "small" | "regular";
    autoHidden?: boolean;
  }
>(({ className, variant = "regular", autoHidden, children, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "group relative flex w-full touch-none select-none items-center",
      className,
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-slider-track w-full grow overflow-hidden rounded-sm bg-slider-track">
      <SliderPrimitive.Range className="absolute h-full bg-ia-accent rounded-sm will-change-[width]" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      className={cn(
        "block rounded-slider-thumb border-width-slider-thumb border-slider-thumb bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mod-border-focus disabled:pointer-events-none disabled:opacity-50 transition-opacity  will-change-[left]",
        variant === "regular"
          ? "h-slider-thumb w-slider-thumb"
          : "h-slider-thumb-sm w-slider-thumb-sm",
        autoHidden && "opacity-0 group-hocus:opacity-100 focus:opacity-100",
      )}
    />
    {children}
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
