"use client";

import { useState } from "react";
import { usePresentationState } from "@/states/presentation-state";
import UniversalForm from "./UniversalForm";
import PresentationSettingsForm from "./PresentationSettingsForm";
import FormField from "@/components/quiz/pages/FormField";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createEmptyPresentation } from "@/app/_actions/presentation/presentationActions";

export default function UniversalFormContainer() {
  const { 
    setCurrentPresentation, 
    setIsGeneratingOutline,
    setShouldStartOutlineGeneration,
    universalFormData,
    setUniversalFormData,
    formStep,
    setFormStep,
    setIsFromUniversalForm,
    setOriginalLanguage
  } = usePresentationState();
  
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleUniversalFormNext = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const language = formData.get("language") as string;
    setUniversalFormData(formData);
    setOriginalLanguage(language);
    setFormStep(1);
  };

  const handleGeneratePresentation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");

    if (!universalFormData) {
      toast.error("Please complete the first step");
      return;
    }

    // Set UI loading state
    setIsGeneratingOutline(true);
    // Mark that this presentation is from universal form
    setIsFromUniversalForm(true);

    try {
      // Create empty presentation first
      const result = await createEmptyPresentation("Untitled Presentation");

      if (result.success && result.presentation) {
        // Set the current presentation
        setCurrentPresentation(
          result.presentation.id,
          result.presentation.title
        );
        
        // Navigate to generation page where outline generation will start
        router.push(`/presentation/generate/${result.presentation.id}`);
      } else {
        setIsGeneratingOutline(false);
        toast.error(result.message || "Failed to create presentation");
      }
    } catch (error) {
      setIsGeneratingOutline(false);
      console.error("Error creating presentation:", error);
      toast.error("Failed to create presentation");
    }
  };

  return (
    <section>
      {formStep === 0 && <UniversalForm onSubmit={handleUniversalFormNext} />}
      {formStep === 1 && <PresentationSettingsForm onSubmit={handleGeneratePresentation} />}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mt-4 max-w-lg mx-auto">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{errorMessage}</span>
        </div>
      )}
    </section>
  );
}
