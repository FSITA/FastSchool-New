"use client";

import { Loader2, X } from "lucide-react";
import { useState } from "react";

interface ContentExtractionNotificationBarProps {
  sourceType?: "PDF" | "YouTube" | "Wikipedia" | "Notes" | "Files";
  message?: string;
  onClose?: () => void;
}

export default function ContentExtractionNotificationBar({ 
  sourceType, 
  message,
  onClose
}: ContentExtractionNotificationBarProps) {
  const [isVisible, setIsVisible] = useState(true);

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

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5 fade-in duration-300">
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 p-4 min-w-[320px] max-w-[400px]">
        <div className="flex items-start gap-3">
          {/* Loader */}
          <div className="flex-shrink-0">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {displayMessage}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Questo potrebbe richiedere alcuni secondi...
            </p>
          </div>
          
          {/* Close button (optional, for manual dismissal) */}
          {onClose && (
            <button
              onClick={handleClose}
              className="flex-shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              aria-label="Chiudi"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
