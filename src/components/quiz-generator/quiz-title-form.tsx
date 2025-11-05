"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen } from 'lucide-react';
import { getQuizGeneratorTranslations } from '@/lib/quiz-generator/language-translations';
import type { QuizTitleFormProps } from '@/types/quiz-generator';

export function QuizTitleForm({ onSubmit, isLoading, isExtracting, universalFormData }: QuizTitleFormProps) {
  const [title, setTitle] = useState("");
  const [numberOfQuizzes, setNumberOfQuizzes] = useState(5);

  // Get language and grade level for translations
  const language = universalFormData?.get('language')?.toString() || 'italian';
  const gradeLevel = universalFormData?.get('gradeLevel')?.toString() || 'secondary';
  const translations = getQuizGeneratorTranslations(language);

  // Custom quiz count options: 1-10 (all), then 12, 15, 20, 25, 30, 40, 50
  const quizCountOptions = [
    ...Array.from({ length: 10 }, (_, i) => i + 1), // 1 to 10
    12, 15, 20, 25, 30, 40, 50 // Then these specific numbers
  ];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("📝 Quiz form submitted with:", { title, numberOfQuizzes });
    if (title.trim()) {
      // Validate number of quizzes
      if (numberOfQuizzes < 1 || numberOfQuizzes > 50) {
        alert("Il numero di quiz deve essere compreso tra 1 e 50.");
        return;
      }
      onSubmit(title.trim(), numberOfQuizzes);
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
        <CardTitle className="text-2xl font-bold text-gray-900">Crea il Tuo Quiz</CardTitle>
        <p className="text-gray-600 mt-2">
          Dai un titolo al tuo quiz e configura il numero di quiz da generare
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="quizTitle" className="text-sm font-medium text-gray-700">
              Titolo del Quiz
            </Label>
            <Input
              id="quizTitle"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="es. Quiz di Fotosintesi, Test di Matematica: Frazioni"
              className="w-full"
              required
              maxLength={100}
            />
            <p className="text-xs text-gray-500">
              {title.length}/100 caratteri
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="numberOfQuizzes" className="text-sm font-medium text-gray-700">
              {translations.numberOfQuizzes}
            </Label>
            <Select 
              value={numberOfQuizzes.toString()} 
              onValueChange={(value) => {
                const num = parseInt(value);
                if (!isNaN(num) && num >= 1 && num <= 50) {
                  setNumberOfQuizzes(num);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleziona numero di quiz" />
              </SelectTrigger>
              <SelectContent>
                {quizCountOptions.map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} {translations.quizzes}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-xs text-gray-500">
              <p><strong>Intervallo:</strong> 1 - 50 {translations.quizzes}</p>
              <p><strong>Consigliato:</strong> 5-10 {translations.quizzes} per una buona copertura</p>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isLoading || isExtracting || !title.trim() || numberOfQuizzes < 1 || numberOfQuizzes > 50}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            {isLoading ? translations.generating : translations.generateQuiz}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

