"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen } from "lucide-react";
import { getAllDisabilityTypesTranslated } from "@/types/accessibility";

interface LessonTitleFormProps {
  onSubmit: (title: string, isSpecialNeeds: boolean, disabilityType: string) => void;
  isLoading: boolean;
  isExtracting?: boolean;
  universalFormData: FormData | null;
}

export function LessonTitleForm({ onSubmit, isLoading, isExtracting, universalFormData }: LessonTitleFormProps) {
  const [title, setTitle] = useState("");
  const [isSpecialNeeds, setIsSpecialNeeds] = useState(false);
  const [disabilityType, setDisabilityType] = useState("");

  // Get language for translations
  const language = universalFormData?.get('language')?.toString() || 'italian';

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("📝 Form submitted with:", { title, isSpecialNeeds, disabilityType });
    if (title.trim()) {
      // Validate that if special needs is enabled, a disability type is selected
      if (isSpecialNeeds && !disabilityType) {
        alert("Please select a disability type when creating a lesson plan for special needs students.");
        return;
      }
      onSubmit(title.trim(), isSpecialNeeds, disabilityType);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
            <BookOpen className="h-8 w-8" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">Nomina il tuo Piano di Lezione</CardTitle>
        <p className="text-gray-600 mt-2">
          Dai al tuo piano di lezione un titolo descrittivo che sarà utilizzato per la visualizzazione e il download PDF
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="lessonTitle" className="text-sm font-medium text-gray-700">
              Titolo del Piano di Lezione
            </Label>
            <Input
              id="lessonTitle"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="es. Introduzione alla Fotosintesi, Matematica: Frazioni e Decimali"
              className="w-full"
              required
              maxLength={100}
            />
            <p className="text-xs text-gray-500">
              {title.length}/100 characters
            </p>
          </div>

          {/* Accessibility Toggle */}
          <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Switch
              id="special-needs"
              checked={isSpecialNeeds}
              onCheckedChange={setIsSpecialNeeds}
              className="data-[state=checked]:bg-blue-600"
            />
            <Label htmlFor="special-needs" className="text-sm font-medium text-blue-900">
              Crea piano di lezione per studenti con bisogni speciali
            </Label>
          </div>

          {/* Conditional Disability Type Dropdown */}
          {isSpecialNeeds && (
            <div className="space-y-2">
              <Label htmlFor="disabilityType" className="text-sm font-medium text-gray-700">
                Tipo di Disabilità
              </Label>
              <Select value={disabilityType} onValueChange={setDisabilityType}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona il tipo di disabilità" />
                </SelectTrigger>
                <SelectContent>
                  {getAllDisabilityTypesTranslated(language).map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div>
                        <div className="font-medium">{type.translatedLabel}</div>
                        <div className="text-xs text-gray-500">{type.translatedDescription}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button 
            type="submit" 
            disabled={isLoading || isExtracting || !title.trim() || (isSpecialNeeds && !disabilityType)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            {isLoading ? 'Generazione...' : 'Genera Piano di Lezione'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
