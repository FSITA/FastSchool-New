"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react"

interface Flashcard {
  question: string
  answer: string
}

interface FlashcardViewerProps {
  flashcards: Flashcard[]
}

export function FlashcardViewer({ flashcards }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  if (flashcards.length === 0) {
    return null
  }

  const currentCard = flashcards[currentIndex]

  if (!currentCard) {
    return null
  }

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setIsFlipped(false)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setIsFlipped(false)
    }
  }

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-4">
        <div className="text-sm text-muted-foreground">
          Carta {currentIndex + 1} di {flashcards.length}
        </div>
        <div className="flex-1 max-w-xs bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div className="flex justify-center">
        <div 
          className="w-full max-w-2xl h-80 cursor-pointer perspective-1000"
          onClick={handleFlip}
        >
          <div 
            className={`relative w-full h-full transition-transform duration-700 ease-in-out transform-style-preserve-3d ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
          >
            {/* Front of card (Question) */}
            <Card className="absolute inset-0 w-full h-full border-border bg-card hover:shadow-lg transition-shadow duration-300 backface-hidden">
              <CardContent className="p-8 h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="text-sm font-medium text-primary uppercase tracking-wide">
                    Domanda
                  </div>
                  <div className="text-lg md:text-xl text-card-foreground text-balance leading-relaxed">
                    {currentCard.question}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Clicca per rivelare la risposta
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Back of card (Answer) */}
            <Card className="absolute inset-0 w-full h-full border-border bg-card hover:shadow-lg transition-shadow duration-300 backface-hidden rotate-y-180">
              <CardContent className="p-8 h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="text-sm font-medium text-primary uppercase tracking-wide">
                    Risposta
                  </div>
                  <div className="text-lg md:text-xl text-card-foreground text-balance leading-relaxed">
                    {currentCard.answer}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Clicca per vedere la domanda
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-center gap-4">
        <Button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          variant="outline"
          className="border-border text-foreground hover:bg-accent bg-transparent"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Precedente
        </Button>

        <Button onClick={handleFlip} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <RotateCcw className="h-4 w-4 mr-2" />
          Capovolgi Carta
        </Button>

        <Button
          onClick={handleNext}
          disabled={currentIndex === flashcards.length - 1}
          variant="outline"
          className="border-border text-foreground hover:bg-accent bg-transparent"
        >
          Successivo
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Card Grid Preview */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">Tutte le carte</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {flashcards.map((card, index) => (
            <Card
              key={index}
              className={`cursor-pointer border transition-all duration-200 ${
                index === currentIndex ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"
              }`}
              onClick={() => {
                setCurrentIndex(index)
                setIsFlipped(false)
              }}
            >
              <CardContent className="p-4">
                <div className="text-xs font-medium text-primary mb-2">Carta {index + 1}</div>
                <div className="text-sm text-card-foreground line-clamp-3">{card.question}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
