"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface DockProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  direction?: "top" | "middle" | "bottom";
  children: React.ReactNode;
}

const Dock = React.forwardRef<HTMLDivElement, DockProps>(
  (
    {
      className,
      children,
      direction = "middle",
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "mx-auto flex h-[70px] w-max items-center justify-center gap-2 rounded-2xl border border-black dark:border-white p-2 backdrop-blur-md bg-white/80 dark:bg-black/80",
          {
            "items-start": direction === "top",
            "items-center": direction === "middle",
            "items-end": direction === "bottom",
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Dock.displayName = "Dock";

export interface DockIconProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

const DockIcon = React.forwardRef<HTMLDivElement, DockIconProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center rounded-full hover:scale-110 transition-transform",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DockIcon.displayName = "DockIcon";

export { Dock, DockIcon }; 