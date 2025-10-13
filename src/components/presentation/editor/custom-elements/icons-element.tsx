"use client";

import React, { type ReactNode } from "react";
import { cn, withRef } from "@udecode/cn";
import { type TElement } from "@udecode/plate-common";
import { createPlatePlugin } from "@udecode/plate-core/react";
import { PlateElement } from "@/components/text-editor/plate-ui/plate-element";

// Import IconItem and constants
import { IconItem } from "./icon-item";
import { ICON_ITEM_ELEMENT, ICONS_ELEMENT } from "../lib";

export interface IconsElement extends TElement {
  type: typeof ICONS_ELEMENT;
}

// Main icons component with withRef pattern
export const IconsElement = withRef<typeof PlateElement>(
  ({ element, children, className, ...props }, ref) => {
    const childrenArray = React.Children.toArray(children as ReactNode);
    const items = element.children;

    // Determine number of columns based on item count - improved logic
    const getColumnClass = () => {
      const count = items.length;
      if (count <= 1) return "grid-cols-1";
      if (count <= 2) return "grid-cols-2";
      if (count <= 4) return "grid-cols-2 sm:grid-cols-3";
      return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"; // Responsive grid
    };

    return (
      <PlateElement
        ref={ref}
        element={element}
        className={cn("my-6", className)}
        {...props}
      >
        <div className={cn("grid gap-6", getColumnClass())}>
          {childrenArray.map((child, index) => (
            <div key={index} className="flex justify-center">
              <div className="w-full max-w-xs">
                <IconItem element={items[index] as TElement}>
                  {child}
                </IconItem>
              </div>
            </div>
          ))}
        </div>
      </PlateElement>
    );
  },
);

// Create plugin for icons
export const IconsPlugin = createPlatePlugin({
  key: ICONS_ELEMENT,
  node: {
    isElement: true,
    type: ICONS_ELEMENT,
    component: IconsElement,
  },
});

// Create plugin for icon item
export const IconItemPlugin = createPlatePlugin({
  key: ICON_ITEM_ELEMENT,
  node: {
    isElement: true,
    type: ICON_ITEM_ELEMENT,
  },
});
