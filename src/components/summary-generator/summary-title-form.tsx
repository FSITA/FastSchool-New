"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText } from 'lucide-react';
import { getSummaryGeneratorTranslations } from '@/lib/summary-generator/language-translations';
import type { SummaryTitleFormProps } from '@/types/summary-generator';

export function SummaryTitleForm({ onSubmit, isLoading, isExtracting, universalFormData }: SummaryTitleFormProps) {
  const [title, setTitle] = useState("");

  // Get language for translations
  const language = universalFormData?.get('language')?.toString() || 'italian';
  const translations = getSummaryGeneratorTranslations(language);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("📝 Form submitted with:", { title });
    if (title.trim()) {
      onSubmit(title.trim());
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
            <FileText className="h-8 w-8" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">Crea il Tuo Riassunto</CardTitle>
        <p className="text-gray-600 mt-2">
          Dai un titolo al tuo riassunto e genera 10 riassunti concisi
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="summaryTitle" className="text-sm font-medium text-gray-700">
              Titolo del Riassunto
            </Label>
            <Input
              id="summaryTitle"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="es. Riassunto della Fotosintesi, Matematica: Frazioni e Decimali"
              className="w-full"
              required
              maxLength={100}
            />
            <p className="text-xs text-gray-500">
              {title.length}/100 caratteri
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800 mb-2">
              <strong>Nota:</strong> Verranno generati esattamente 10 riassunti concisi (massimo 2 righe ciascuno).
            </p>
          </div>

          <Button 
            type="submit" 
            disabled={isLoading || isExtracting || !title.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            {isLoading ? translations.generating : translations.generateSummary}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

