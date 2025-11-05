"use client";
import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePresentationState } from "@/states/presentation-state";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function DownloadPdfButton() {
  const {
    slides,
    savingStatus,
    currentPresentationId,
    isGeneratingPresentation,
    isGeneratingOutline,
    isPresenting,
  } = usePresentationState();

  const [isPreparingPrint, setIsPreparingPrint] = useState(false);

  // Check if generation is in progress
  const isGenerating = isGeneratingPresentation || isGeneratingOutline;

  // Handle PDF download using server-side Puppeteer
  const handleDownloadPdf = async () => {
    // Edge case: No slides
    if (slides.length === 0) {
      toast.error("Non ci sono slide da scaricare");
      return;
    }

    // Edge case: During generation
    if (isGenerating) {
      toast.error("Attendere il completamento della generazione");
      return;
    }

    // Edge case: During presentation
    if (isPresenting) {
      toast.error("Esci dalla modalità presentazione per scaricare il PDF");
      return;
    }

    // Edge case: No presentation ID
    if (!currentPresentationId) {
      toast.error("ID presentazione non trovato");
      return;
    }

    // Wait for save to complete if saving
    if (savingStatus === "saving") {
      toast.info("Salvataggio in corso... Attendere");
      await new Promise<void>((resolve) => {
        const checkInterval = setInterval(() => {
          const currentStatus = usePresentationState.getState().savingStatus;
          if (currentStatus !== "saving") {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);

        setTimeout(() => {
          clearInterval(checkInterval);
          resolve();
        }, 5000);
      });
    }

    setIsPreparingPrint(true);
    toast.info("Generazione PDF in corso... (questo potrebbe richiedere qualche secondo)");

    try {
      // Call API to generate PDF server-side
      const response = await fetch("/api/export-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          presentationId: currentPresentationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Get PDF blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `presentazione_${currentPresentationId}_${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("PDF scaricato con successo!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error(
        error instanceof Error
          ? `Errore: ${error.message}`
          : "Errore durante la generazione del PDF. Riprova."
      );
    } finally {
      setIsPreparingPrint(false);
    }
  };

  // Disable button if no slides or during generation/presentation
  const isDisabled =
    slides.length === 0 || 
    isGenerating || 
    isPresenting || 
    isPreparingPrint || 
    !currentPresentationId;

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "text-muted-foreground hover:text-foreground",
        isDisabled && "cursor-not-allowed opacity-70"
      )}
      onClick={handleDownloadPdf}
      disabled={isDisabled}
      aria-label="Scarica PDF"
    >
      {isPreparingPrint ? (
        <>
          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          Preparazione...
        </>
      ) : (
        <>
          <Download className="mr-1 h-4 w-4" />
          Scarica PDF
        </>
      )}
    </Button>
  );
}

