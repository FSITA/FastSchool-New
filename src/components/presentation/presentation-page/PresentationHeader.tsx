"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { usePresentationState } from "@/states/presentation-state";
import { usePathname } from "next/navigation";

// Import our new components
import { ThemeSelector } from "../theme/ThemeSelector";
import { ShareButton } from "./buttons/ShareButton";
import { PresentButton } from "./buttons/PresentButton";
import { DownloadPdfButton } from "./buttons/DownloadPdfButton";
import { SaveStatus } from "./buttons/SaveStatus";
import { Brain } from "@/components/ui/icons";

export default function PresentationHeader() {
  const { currentPresentationTitle, isPresenting } = usePresentationState();
  const [presentationTitle, setPresentationTitle] = useState<string>(
    currentPresentationTitle ?? "Presentazione FastSchool senza titolo"
  );
  const pathname = usePathname();

  // Check if we're on the generate/outline page
  const isPresentationPage = pathname?.includes("/presentation/");

  // Update title when it changes in the state
  useEffect(() => {
    console.log("PresentationHeader - currentPresentationTitle:", currentPresentationTitle); // Added log
    if (currentPresentationTitle) {
      setPresentationTitle(currentPresentationTitle);
    }
  }, [currentPresentationTitle]);

  return (
    <header className="flex h-12 w-full items-center justify-between border-b border-accent bg-background px-4">
      {/* Left section with breadcrumb navigation */}
      <div className="flex items-center gap-2">
        <Link href="/" className="text-muted-foreground hover:text-foreground">
          <Brain className="h-5 w-5"></Brain>
        </Link>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{presentationTitle}</span>
      </div>

      {/* Right section with actions */}
      <div className="flex items-center gap-2">
        {/* Save status indicator */}
        <SaveStatus />

        {/* Theme selector - Only in presentation page, not outline */}
        {isPresentationPage && <ThemeSelector />}

        {/* Share button - Only in presentation page, not outline */}
        {isPresentationPage && !isPresenting && <ShareButton />}

        {/* Download PDF button - Only in presentation page, not outline */}
        {isPresentationPage && !isPresenting && <DownloadPdfButton />}

        {/* Present button - Only in presentation page, not outline */}
        {isPresentationPage && <PresentButton />}

      </div>
    </header>
  );
}
