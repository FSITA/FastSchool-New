import { Layout } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePresentationState } from "@/states/presentation-state";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function PresentationControls({
  shouldShowLabel = true,
}: {
  shouldShowLabel?: boolean;
}) {
  const {
    numSlides,
    setNumSlides,
    language,
    setLanguage,
    pageStyle,
    setPageStyle,
    isFromUniversalForm,
    originalLanguage,
  } = usePresentationState();

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Number of Slides */}
      <div>
        {shouldShowLabel && (
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Number of slides
          </label>
        )}
        <Select
          value={String(numSlides)}
          onValueChange={(v) => setNumSlides(Number(v))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select number of slides" />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20, 25, 30].map((num) => (
              <SelectItem key={num} value={String(num)}>
                {num} slides
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Language */}
      <div>
        {shouldShowLabel && (
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Language
          </label>
        )}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className={isFromUniversalForm && originalLanguage && language !== originalLanguage ? "border-orange-500 bg-orange-50" : ""}>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="italian">Italian (Italiano)</SelectItem>
                    <SelectItem value="english">English (English)</SelectItem>
                    <SelectItem value="spanish">Spanish (Español)</SelectItem>
                    <SelectItem value="french">French (Français)</SelectItem>
                    <SelectItem value="german">German (Deutsch)</SelectItem>
                    <SelectItem value="portuguese">Portuguese (Português)</SelectItem>
                    <SelectItem value="dutch">Dutch (Nederlands)</SelectItem>
                    <SelectItem value="russian">Russian (Pусский)</SelectItem>
                    <SelectItem value="chinese">Chinese (Simplified – 中文, 汉语)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TooltipTrigger>
            {isFromUniversalForm && originalLanguage && language !== originalLanguage && (
              <TooltipContent>
                <p>Avviso: La lingua differisce dalla lingua di generazione della struttura ({originalLanguage})</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
        {isFromUniversalForm && originalLanguage && language !== originalLanguage && (
          <div className="mt-2 p-2 bg-orange-100 border border-orange-300 rounded-md">
            <p className="text-sm text-orange-800">
              ⚠️ Avviso: Hai selezionato <strong>{language}</strong> per la generazione delle slide, ma <strong>{originalLanguage}</strong> è stato utilizzato per la generazione della struttura. Questo potrebbe causare inconsistenze.
            </p>
          </div>
        )}
      </div>

      {/* Page Style */}
      <div>
        {shouldShowLabel && (
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Page style
          </label>
        )}
        <Select value={pageStyle} onValueChange={setPageStyle}>
          <SelectTrigger>
            <div className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              <SelectValue placeholder="Select page style" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">
              <div className="flex items-center gap-3">
                <span>Default</span>
              </div>
            </SelectItem>
            <SelectItem value="traditional">
              <div className="flex items-center gap-3">
                <span>Traditional</span>
              </div>
            </SelectItem>
            <SelectItem value="tall">
              <div className="flex items-center gap-3">
                <span>Tall</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
