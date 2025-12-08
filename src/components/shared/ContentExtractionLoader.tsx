"use client";

import { Loader2 } from "lucide-react";

interface ContentExtractionLoaderProps {
  sourceType?: "PDF" | "YouTube" | "Wikipedia" | "Notes" | "Files";
  message?: string;
}

export default function ContentExtractionLoader({ 
  sourceType, 
  message 
}: ContentExtractionLoaderProps) {
  const getDefaultMessage = () => {
    switch (sourceType) {
      case "PDF":
        return "Estraendo contenuto dal PDF...";
      case "YouTube":
        return "Recuperando trascrizione da YouTube...";
      case "Wikipedia":
        return "Recuperando contenuto da Wikipedia...";
      case "Notes":
        return "Elaborando note...";
      case "Files":
        return "Elaborando file...";
      default:
        return "Elaborando contenuto...";
    }
  };

  const displayMessage = message || getDefaultMessage();

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="relative">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
      <p className="mt-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {displayMessage}
      </p>
      {/* Only show "Questo potrebbe richiedere alcuni secondi..." if no custom message is provided */}
      {!message && (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Questo potrebbe richiedere alcuni secondi...
        </p>
      )}
    </div>
  );
}
