"use client";

import React, { useState } from "react";
import { cn } from "@udecode/cn";
import { Toolbar } from "@/components/text-editor/plate-ui/toolbar";
import { FloatingToolbarButtons } from "@/components/text-editor/plate-ui/floating-toolbar-buttons";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Settings } from "lucide-react";

interface FixedToolbarProps {
  className?: string;
}

export const FixedToolbar = ({ className }: FixedToolbarProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      {/* Toggle Button */}
      <div className="flex justify-center mb-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-full shadow-md bg-background border-border hover:bg-muted"
        >
          {isOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <Settings className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Toolbar Content */}
      {isOpen && (
        <Toolbar
          className={cn(
            "overflow-x-auto whitespace-nowrap rounded-md border bg-popover shadow-md scrollbar-hide print:hidden",
            "max-w-[80vw]",
            className
          )}
        >
          <FloatingToolbarButtons />
        </Toolbar>
      )}
    </div>
  );
};
