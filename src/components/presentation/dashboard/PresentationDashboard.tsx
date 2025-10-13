"use client";

import { Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePresentationState } from "@/states/presentation-state";
import { useRouter } from "next/navigation";
import { PresentationTemplates } from "./PresentationTemplates";
import { useEffect } from "react";
import { PresentationHeader } from "./PresentationHeader";
import { createEmptyPresentation } from "@/app/_actions/presentation/presentationActions";
import UniversalFormContainer from "../universal-form/UniversalFormContainer";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

export function PresentationDashboard() {
  const router = useRouter();
  const {
    setCurrentPresentation,
    setIsGeneratingOutline,
    // We'll use these instead of directly calling startOutlineGeneration
    setShouldStartOutlineGeneration,
    setFormStep,
    setUniversalFormData,
    setPresentationInput,
    setIsFromUniversalForm,
  } = usePresentationState();

  useEffect(() => {
    setCurrentPresentation("", "");
    // Make sure to reset any generation flags when landing on dashboard
    setIsGeneratingOutline(false);
    setShouldStartOutlineGeneration(false);
    // Reset form state
    setFormStep(0);
    setUniversalFormData(null);
    setIsFromUniversalForm(false);
  }, []);


  const handleCreateBlank = async () => {
    try {
      // Clear universal form data to ensure blank presentation
      setUniversalFormData(null);
      // Set a default presentation input for blank presentations
      setPresentationInput("Untitled Presentation");
      // Mark that this is NOT from universal form (allows language selection)
      setIsFromUniversalForm(false);
      // Don't set isGeneratingOutline to true for blank presentations
      // This allows users to manually create their own outline
      const result = await createEmptyPresentation("Untitled Presentation");
      if (result.success && result.presentation) {
        setCurrentPresentation(
          result.presentation.id,
          result.presentation.title
        );
        router.push(`/presentation/generate/${result.presentation.id}`);
      } else {
        toast.error(result.message || "Failed to create presentation");
      }
    } catch (error) {
      console.error("Error creating presentation:", error);
      toast.error("Failed to create presentation");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Logo and Home Button */}
      <div className="pt-8 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-8">
            {/* Home Button */}
            <Link 
              href="/"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <ArrowLeft className="w-4 h-4" />
              Casa
            </Link>
            
            {/* Logo */}
            <div className="flex-1 flex justify-center">
              <Image
                src="/fastschool logo on white.png"
                alt="FastSchool Logo"
                width={200}
                height={60}
                className="h-12 w-auto"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="notebook-section relative w-full">
        <div className="mx-auto w-full max-w-4xl space-y-12 px-6 py-12">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Presentazione IA
            </h1>
          </div>

          <div className="space-y-8">
            <UniversalFormContainer />
            <div className="flex items-center justify-end">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleCreateBlank}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Crea Vuoto
                </Button>
              </div>
            </div>
          </div>

          <PresentationTemplates />
        </div>
      </div>
    </div>
  );
}
