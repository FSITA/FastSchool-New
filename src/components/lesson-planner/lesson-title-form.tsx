"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

interface LessonTitleFormProps {
  onSubmit: (title: string) => void;
  isLoading: boolean;
  universalFormData: FormData | null;
}

export function LessonTitleForm({ onSubmit, isLoading, universalFormData }: LessonTitleFormProps) {
  const [title, setTitle] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (title.trim()) {
      onSubmit(title.trim());
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-full">
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


          <Button 
            type="submit" 
            disabled={isLoading || !title.trim()}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            size="lg"
          >
            {isLoading ? 'Generazione...' : 'Genera Piano di Lezione'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
