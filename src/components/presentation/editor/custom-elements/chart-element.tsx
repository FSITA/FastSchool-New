"use client";

import React from "react";
import { cn, withRef } from "@udecode/cn";
import { type TElement } from "@udecode/plate-common";
import { createPlatePlugin } from "@udecode/plate-core/react";
import { PlateElement } from "@/components/text-editor/plate-ui/plate-element";

export const CHART_ELEMENT = "chart";

export interface ChartElement extends TElement {
  type: typeof CHART_ELEMENT;
  chartType?: string;
  data?: Array<{ label: string; value: number }>;
}

// Simple chart component for presentation slides
export const ChartElement = withRef<typeof PlateElement>(
  ({ element, className, ...props }, ref) => {
    const chartElement = element as ChartElement;
    const { chartType = "horizontal-bar", data = [] } = chartElement;

    const maxValue = Math.max(...data.map(d => d.value), 1);

    return (
      <PlateElement
        ref={ref}
        element={element}
        className={cn("my-6", className)}
        {...props}
      >
        <div className="w-full max-w-2xl mx-auto">
          <div className="bg-card border rounded-lg p-6 shadow-sm">
            <div className="space-y-4">
              {data.map((item, index) => {
                const percentage = (item.value / maxValue) * 100;
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-foreground">
                        {item.label}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {item.value}
                      </span>
                    </div>
                    
                    {chartType === "horizontal-bar" ? (
                      <div className="w-full bg-muted rounded-full h-3">
                        <div
                          className="bg-primary h-3 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    ) : (
                      <div className="w-full bg-muted rounded-full h-3">
                        <div
                          className="bg-primary h-3 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </PlateElement>
    );
  },
);

// Create plugin for chart
export const ChartPlugin = createPlatePlugin({
  key: CHART_ELEMENT,
  node: {
    isElement: true,
    type: CHART_ELEMENT,
    component: ChartElement,
  },
});
