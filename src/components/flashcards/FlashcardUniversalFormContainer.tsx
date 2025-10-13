"use client";

import { useState } from "react";
import FlashcardUniversalForm from "./FlashcardUniversalForm";
import FlashcardSettingsForm from "./FlashcardSettingsForm";
import FormField from "@/components/quiz/pages/FormField";
import { toast } from "sonner";
// Removed client-side processing - now using server-side API
export default function FlashcardUniversalFormContainer({
  generateFlashcards,
}: {
  generateFlashcards: (text: string, count: number, language?: string, gradeLevel?: string) => Promise<void>;
}) {
  const [universalFormData, setUniversalFormData] = useState<FormData | null>(null);
  const [formStep, setFormStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [flashcardCount, setFlashcardCount] = useState(10);

  const handleUniversalFormNext = async (e: React.FormEvent<HTMLFormElement>) => {
    console.log("🔄 handleUniversalFormNext called");
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    console.log("📝 Universal form data collected:", {
      notes: formData.get("notes"),
      files: formData.getAll("files"),
      youtubeUrl: formData.get("youtubeUrl"),
      wikipediaLink: formData.get("wikipediaLink"),
      gradeLevel: formData.get("gradeLevel"),
      language: formData.get("language"),
    });
    setUniversalFormData(formData);
    setFormStep(1);
    console.log("✅ Moved to step 1 (settings form)");
  };

  const handleGenerateFlashcards = async () => {
    console.log("🚀 handleGenerateFlashcards called");
    console.log("📊 Current state:", {
      universalFormData: !!universalFormData,
      flashcardCount,
      formStep
    });
    
    setErrorMessage("");

    if (!universalFormData) {
      console.log("❌ No universal form data found");
      toast.error("Please complete the first step");
      return;
    }

    try {
      console.log("🔄 Processing universal form data on server...");
      
      // Send form data to server for processing (handles YouTube, PDF, etc.)
      const response = await fetch('/api/flashcards/process-content', {
        method: 'POST',
        body: universalFormData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to process content');
      }
      
      const processedData = await response.json();
      console.log("✅ Universal form data processed:", {
        contentLength: processedData.content.length,
        gradeLevel: processedData.gradeLevel,
        language: processedData.language,
        contentPreview: processedData.content.substring(0, 100) + "..."
      });
      
      console.log("🔄 Generating flashcards with count:", flashcardCount, "language:", processedData.language, "and grade level:", processedData.gradeLevel);
      // Generate flashcards using the processed content, current count, selected language, and grade level
      await generateFlashcards(processedData.content, flashcardCount, processedData.language, processedData.gradeLevel);
      console.log("✅ Flashcards generated successfully!");
      
    } catch (error) {
      console.error("❌ Error generating flashcards:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to generate flashcards");
      toast.error("Failed to generate flashcards");
    }
  };

  return (
    <section>
      {formStep === 0 && <FlashcardUniversalForm onSubmit={handleUniversalFormNext} />}
      {formStep === 1 && <FlashcardSettingsForm onSubmit={handleGenerateFlashcards} count={flashcardCount} setCount={setFlashcardCount} />}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mt-4 max-w-lg mx-auto">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{errorMessage}</span>
        </div>
      )}
    </section>
  );
}
