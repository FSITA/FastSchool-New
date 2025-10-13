"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, FileText, Sparkles, AlertCircle, CheckCircle } from "lucide-react"
import { FlashcardViewer } from "@/components/flashcards/flashcard-viewer"
import { useFlashcards } from "@/hooks/flashcards/use-flashcards"
import { useHealthCheck } from "@/hooks/flashcards/use-health-check"
import { LoadingSpinner } from "@/components/flashcards/loading-spinner"
import FlashcardUniversalFormContainer from "./FlashcardUniversalFormContainer"
import FlashcardLoading from "./FlashcardLoading"

export function FlashcardGenerator() {
  const { flashcards, isLoading, error, generateFlashcards, clearFlashcards, clearError } = useFlashcards()
  const { isHealthy, isLoading: healthLoading, error: healthError, checkHealth } = useHealthCheck()

  console.log("🎮 FlashcardGenerator render:", {
    flashcardsCount: flashcards.length,
    isLoading,
    error,
    hasFlashcards: flashcards.length > 0
  });

  const handleReset = () => {
    clearFlashcards()
    clearError()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {isLoading ? (
          /* Loading State */
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-foreground mb-4 text-balance">Generazione delle tue Flashcard</h1>
              <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
                Attendi mentre creiamo le tue flashcard interattive...
              </p>
            </div>
            <FlashcardLoading />
          </div>
        ) : flashcards.length === 0 ? (
          /* Input Interface */
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-foreground mb-4 text-balance">Genera le tue Flashcard</h1>
              <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
                Trasforma il tuo materiale di studio in flashcard interattive usando l'IA
              </p>
            </div>

            <div className="flex justify-center">
              {healthLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
                  <LoadingSpinner size="sm" />
                  <span className="text-sm">Attendi...</span>
                </div>
              ) : isHealthy ? (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-full border border-green-200">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Pronto</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-destructive-foreground bg-destructive px-4 py-2 rounded-full">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Server Offline</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={checkHealth}
                    className="text-xs px-2 py-1 h-auto ml-2 bg-destructive-foreground text-destructive border-destructive-foreground hover:bg-destructive-foreground/90"
                  >
                    Riprova
                  </Button>
                </div>
              )}
            </div>

            {!isHealthy && !healthLoading && (
              <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                    <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                      <h3>Errore</h3>
                      {healthError && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{healthError}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Universal Form */}
            <FlashcardUniversalFormContainer generateFlashcards={generateFlashcards} />

            {error && (
              <Card className="border-red-500 bg-red-50 dark:bg-red-900/10">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-base font-semibold text-red-600 dark:text-red-400">Errore</div>
                      <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                        {error}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tips Section */}
            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <h3 className="font-semibold text-card-foreground mb-3">Consigli per Flashcard Migliori:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Includi concetti chiave, definizioni e fatti importanti nel tuo materiale</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Usa contenuti strutturati come appunti di lezione, capitoli di libri di testo o guide di studio</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Più dettagliato e organizzato è il tuo input, migliori saranno le domande generate</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Flashcard Results */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Le tue Flashcard</h1>
                <p className="text-muted-foreground">
                  Generate {flashcards.length} flashcard{flashcards.length !== 1 ? "s" : ""} dal tuo materiale
                </p>
              </div>
              <Button
                onClick={handleReset}
                variant="outline"
                className="border-border text-foreground hover:bg-accent bg-transparent"
              >
                Crea Nuovo Set
              </Button>
            </div>

            <FlashcardViewer flashcards={flashcards} />
          </div>
        )}
      </div>
    </div>
  )
}
