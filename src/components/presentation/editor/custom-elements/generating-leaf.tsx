"use client";

import React from "react";

import { withRef } from "@udecode/cn";
import { PlateLeaf } from "@udecode/plate-common/react";
import { createSlatePlugin } from "@udecode/plate-common";
import { usePresentationState } from "@/states/presentation-state";

export const GeneratingLeaf = withRef<typeof PlateLeaf>(
  ({ children, ...props }, ref) => {
    const { leaf } = props;
    const { isGeneratingPresentation } = usePresentationState();
    const isGenerating =
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      isGeneratingPresentation && (leaf.generating as boolean);

    return (
      <PlateLeaf ref={ref} {...props}>
        <span className="flex items-end gap-1">
          {children}
          {isGenerating && (
            <span
              className="animate-blink inline-block w-0.5 h-5 bg-current ml-0.5"
              style={{
                color: "var(--presentation-text, currentColor)",
              }}
            >
              |
            </span>
          )}
        </span>
      </PlateLeaf>
    );
  }
);

/** Enables support for bold formatting */
export const GeneratingPlugin = createSlatePlugin({
  key: "generating",
  node: { isLeaf: true, component: GeneratingLeaf },
});
