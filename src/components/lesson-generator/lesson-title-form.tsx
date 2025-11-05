"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen } from 'lucide-react';
import { getAllDisabilityTypesTranslated } from '@/types/accessibility';
import { getPageCountSuggestions, getLessonGeneratorTranslations } from '@/lib/lesson-generator/language-translations';
import type { LessonTitleFormProps } from '@/types/lesson-generator';

export function LessonTitleForm({ onSubmit, isLoading, isExtracting, universalFormData }: LessonTitleFormProps) {
  const [title, setTitle] = useState("");
  const [numberOfPages, setNumberOfPages] = useState(3);
  const [isSpecialNeeds, setIsSpecialNeeds] = useState(false);
  const [disabilityType, setDisabilityType] = useState("");

  // Get language and grade level for translations and suggestions
  const language = universalFormData?.get('language')?.toString() || 'italian';
  const gradeLevel = universalFormData?.get('gradeLevel')?.toString() || 'secondary';
  const translations = getLessonGeneratorTranslations(language);
  const pageSuggestions = getPageCountSuggestions(gradeLevel);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("📝 Form submitted with:", { title, numberOfPages, isSpecialNeeds, disabilityType });
    if (title.trim()) {
      if (isSpecialNeeds && !disabilityType) {
        alert("Seleziona un tipo di disabilità quando crei una lezione per studenti con bisogni speciali.");
        return;
      }
      onSubmit(title.trim(), numberOfPages, isSpecialNeeds, disabilityType);
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
        <CardTitle className="text-2xl font-bold text-gray-900">Crea la Tua Lezione</CardTitle>
        <p className="text-gray-600 mt-2">
          Dai un titolo alla tua lezione e configura il numero di pagine per un apprendimento completo
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="lessonTitle" className="text-sm font-medium text-gray-700">
              Titolo della Lezione
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
              {title.length}/100 caratteri
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="numberOfPages" className="text-sm font-medium text-gray-700">
              {translations.numberOfPages}
            </Label>
            <Select value={numberOfPages.toString()} onValueChange={(value) => setNumberOfPages(parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona numero di pagine" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 15 }, (_, i) => i + 1).map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} {translations.pages}
                    {num === pageSuggestions.recommended && " (Consigliato)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-xs text-gray-500">
              <p><strong>{translations.recommendedPages}:</strong> {pageSuggestions.recommended} {translations.pages}</p>
              <p>Intervallo: {pageSuggestions.min} - {pageSuggestions.max} {translations.pages}</p>
            </div>
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
              Crea lezione per studenti con bisogni speciali
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
                  <SelectValue placeholder="Seleziona tipo di disabilità" />
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
            {isLoading ? translations.generating : translations.generateLesson}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
