'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Edit } from "lucide-react";
import { MindmapRenderer } from '@/components/ui/mindmap/mindmap-renderer';
import { ChatInput } from "@/components/ui/chat/chat-input";
import { MindmapEditDialog } from '@/components/ui/mindmap/mindmap-edit-dialog';
import { ThemeToggle } from "@/components/ui/theme-toggle";

// Define a MindmapNode and MindmapData type for strong typing
interface MindmapNode {
  text: string;
  definition?: string;
  children?: MindmapNode[];
}
interface MindmapData {
  root: MindmapNode;
}

export default function MindmapPage() {
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mindmapData, setMindmapData] = useState<MindmapData | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Generate mindmap
  const handleGenerateMindmap = async () => {
    if (!topic.trim()) {
      setError('Inserisci un argomento');
      return;
    }
    
    setIsLoading(true);
    setError('');
    try {
      let response;
      if (pdfFile) {
        const formData = new FormData();
        formData.append('topic', topic);
        formData.append('pdf', pdfFile);
        response = await fetch('/api/mindmap', {
          method: 'POST',
          body: formData,
        });
      } else {
        response = await fetch('/api/mindmap', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ topic }),
        });
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Impossibile generare la mappa mentale');
      }
      const data = await response.json();
      setMindmapData(data.mindmap as MindmapData);
    } catch (err) {
      console.error('Error generating mindmap:', err);
      setError(err instanceof Error ? err.message : 'Impossibile generare la mappa mentale');
    } finally {
      setIsLoading(false);
      setTopic('');
      setPdfFile(null);
    }
  };

  // Edit mindmap structure
  const handleEditMindmapData = (updatedData: MindmapData) => {
    setMindmapData(updatedData);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Mappa Mentale AI</h1>
        <ThemeToggle className="rounded-full" />
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Genera una Mappa Mentale</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleGenerateMindmap();
          }} className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <div className="flex-1 w-full">
                <ChatInput
                  placeholder="Inserisci un argomento (es. Fisica Quantistica)"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleGenerateMindmap();
                    }
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <label htmlFor="pdf-upload" className="flex-shrink-0">
                  <Button variant="outline" className="px-4 py-2 cursor-pointer rounded-lg shadow-sm border-muted/60 hover:cursor-pointer" asChild>
                    <span>{pdfFile ? "Cambia PDF" : "Scegli PDF"}</span>
                  </Button>
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  id="pdf-upload"
                  className="hidden"
                  onChange={e => setPdfFile(e.target.files?.[0] || null)}
                  disabled={isLoading}
                />
                {pdfFile && (
                  <div className="flex items-center gap-1 bg-muted/60 px-2 py-1 rounded text-xs shadow-sm max-w-full">
                    <span className="truncate max-w-[120px] font-medium">{pdfFile.name}</span>
                    <button
                      type="button"
                      className="ml-1 text-muted-foreground hover:text-destructive"
                      onClick={() => setPdfFile(null)}
                      aria-label="Rimuovi file"
                      disabled={isLoading}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <Button type="submit" disabled={isLoading} className="cursor-pointer hover:opacity-90 ml-auto">
                  {isLoading ? 'Generazione...' : 'Genera'}
                </Button>
              </div>
            </div>
          </form>
          {error && <p className="text-destructive mt-2">{error}</p>}
        </CardContent>
      </Card>

      {mindmapData && (
        <div className="flex-1 flex min-h-0">
          <Card className="w-full h-full flex-1 flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Mappa Mentale</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setIsEditDialogOpen(true)}
                >
                  <Edit className="h-4 w-4" />
                  Modifica Struttura
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 pt-0 flex flex-col min-h-0">
              <div className="flex-1 w-full h-full min-h-0 min-w-0">
                <MindmapRenderer mindmapData={mindmapData} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mindmap Edit Dialog */}
      {mindmapData && (
        <MindmapEditDialog
          open={isEditDialogOpen}
          mindmapData={mindmapData}
          onSave={handleEditMindmapData}
          onClose={() => setIsEditDialogOpen(false)}
        />
      )}
    </div>
  );
}
