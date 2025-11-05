"use client";

import { useState } from "react";
import UniversalForm from "@/components/presentation/universal-form/UniversalForm";
import DiagramGenerationStep from "./diagram-generation-step";
import DiagramDisplay from "./diagram-display";
import ContentExtractionNotificationBar from "@/components/shared/ContentExtractionNotificationBar";
import { toast } from "sonner";
import type { ProcessedContent } from "@/lib/presentation/universal-form-processor";

export default function DiagramGeneratorUniversalFormContainer() {
  const [formStep, setFormStep] = useState(0);
  const [universalFormData, setUniversalFormData] = useState<FormData | null>(null);
  const [extractedContent, setExtractedContent] = useState<ProcessedContent | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string>("");
  const [mermaidCode, setMermaidCode] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleUniversalFormNext = async (e: React.FormEvent<HTMLFormElement>) => {
    console.log("🔄 handleUniversalFormNext called");
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setUniversalFormData(formData);
    setExtractionError("");
    setIsExtracting(true);

    try {
      // Determine source type for loading message
      const step = formData.get("step") as string;
      const activeStep = step ? parseInt(step, 10) : -1;
      let sourceType: "PDF" | "YouTube" | "Wikipedia" | "Notes" | "Files" | undefined;
      
      if (activeStep === 0) sourceType = "Notes";
      else if (activeStep === 1) sourceType = "PDF";
      else if (activeStep === 2) sourceType = "YouTube";
      else if (activeStep === 3) sourceType = "Wikipedia";

      // Call extraction API
      const response = await fetch('/api/universal-form/extract-content', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to extract content' }));
        throw new Error(errorData.details || errorData.error || 'Failed to extract content');
      }

      const processedData: ProcessedContent = await response.json();
      setExtractedContent(processedData);
      setIsExtracting(false);
      setFormStep(1);
      toast.success('Contenuto estratto con successo!');
    } catch (error) {
      console.error('Error extracting content:', error);
      setIsExtracting(false);
      const errorMsg = error instanceof Error ? error.message : 'Errore durante l\'estrazione del contenuto';
      setExtractionError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleGenerateDiagram = async () => {
    if (!universalFormData) {
      toast.error("Dati del modulo non trovati");
      return;
    }

    setIsLoading(true);
    setError("");
    setMermaidCode("");

    try {
      // Prepare form data with pre-extracted content if available
      const apiFormData = new FormData();
      universalFormData.forEach((value, key) => {
        apiFormData.append(key, value);
      });

      // Add any uploaded files
      const files = universalFormData.getAll('files');
      files.forEach(file => {
        if (file instanceof File) {
          apiFormData.append('files', file);
        }
      });

      // Add pre-extracted content if available
      if (extractedContent) {
        console.log("✅ Using pre-extracted content");
        apiFormData.append('extractedContent', extractedContent.content);
        apiFormData.append('extractedGradeLevel', extractedContent.gradeLevel);
        apiFormData.append('extractedLanguage', extractedContent.language);
      }

      // Send form data to API
      const response = await fetch('/api/diagram-generator/generate', {
        method: 'POST',
        body: apiFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API Error (${response.status})`);
      }

      const data = await response.json();
      
      if (data.success && data.mermaidCode) {
        setMermaidCode(data.mermaidCode);
        setFormStep(2);
        toast.success("Diagramma generato con successo!");
      } else {
        throw new Error(data.error || "Failed to generate diagram");
      }
    } catch (error) {
      console.error("Error generating diagram:", error);
      const errorMessage = error instanceof Error ? error.message : "Errore sconosciuto";
      setError(errorMessage);
      toast.error("Errore nella generazione del diagramma");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToForm = () => {
    setFormStep(0);
    setMermaidCode("");
    setError("");
  };

  const handleNewDiagram = () => {
    setFormStep(0);
    setUniversalFormData(null);
    setExtractedContent(null);
    setExtractionError("");
    setMermaidCode("");
    setError("");
  };

  // Determine source type for extraction loader
  const getExtractionSourceType = (): "PDF" | "YouTube" | "Wikipedia" | "Notes" | "Files" | undefined => {
    if (!universalFormData) return undefined;
    const step = universalFormData.get("step") as string;
    const activeStep = step ? parseInt(step, 10) : -1;
    if (activeStep === 0) return "Notes";
    else if (activeStep === 1) return "PDF";
    else if (activeStep === 2) return "YouTube";
    else if (activeStep === 3) return "Wikipedia";
    return undefined;
  };

  return (
    <section>
      {formStep === 0 && !isExtracting && (
        <UniversalForm 
          onSubmit={handleUniversalFormNext}
          description="Scegli la fonte del contenuto per il diagramma"
        />
      )}

      {/* Show step 2 form even during extraction */}
      {(formStep === 1 || isExtracting) && (
        <DiagramGenerationStep 
          onSubmit={handleGenerateDiagram}
          isLoading={isLoading}
          isExtracting={isExtracting}
          error={error}
        />
      )}

      {/* Show extraction notification bar at top-right */}
      {isExtracting && (
        <ContentExtractionNotificationBar sourceType={getExtractionSourceType()} />
      )}

      {/* Show extraction error if any */}
      {extractionError && !isExtracting && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5 fade-in duration-300">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg max-w-md">
            <strong className="font-bold">Errore: </strong>
            <span>{extractionError}</span>
          </div>
        </div>
      )}
      
      {formStep === 2 && (
        <DiagramDisplay 
          mermaidCode={mermaidCode}
          error={error}
          onBackToForm={handleBackToForm}
          onNewDiagram={handleNewDiagram}
        />
      )}
    </section>
  );
}
