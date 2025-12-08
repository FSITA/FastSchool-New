import { useState } from "react";
import { MindmapRenderer } from "./mindmap/mindmap-renderer";
import { MindmapEditDialog } from "./mindmap/mindmap-edit-dialog";
import { ArrowLeft, RotateCcw, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MindmapData } from "@/types/mindmap";

interface MindmapDisplayProps {
  mindmapData: MindmapData;
  error: string;
  onBackToForm: () => void;
  onNewDiagram: () => void;
  onMindmapUpdate?: (updatedData: MindmapData) => void;
}

export default function MindmapDisplay({ 
  mindmapData, 
  error, 
  onBackToForm, 
  onNewDiagram,
  onMindmapUpdate
}: MindmapDisplayProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentMindmapData, setCurrentMindmapData] = useState<MindmapData>(mindmapData);

  const handleEditMindmapData = (updatedData: MindmapData) => {
    setCurrentMindmapData(updatedData);
    if (onMindmapUpdate) {
      onMindmapUpdate(updatedData);
    }
  };

  return (
    <div className="w-full">
      {/* Header with Navigation */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Button
            onClick={onBackToForm}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Torna al Form
          </Button>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsEditDialogOpen(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Modifica Struttura
          </Button>
          
          <Button
            onClick={onNewDiagram}
            className="flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <RotateCcw className="w-4 h-4" />
            Nuovo Diagramma
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Errore
              </h3>
              <div className="mt-1 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mindmap Display - Center Aligned */}
      <div className="flex justify-center">
        <div className="w-full max-w-6xl">
          <div className="bg-white border border-gray-200 rounded-lg p-6" style={{ minHeight: '600px' }}>
            <MindmapRenderer mindmapData={currentMindmapData} />
          </div>
        </div>
      </div>

      {/* Mindmap Edit Dialog */}
      <MindmapEditDialog
        open={isEditDialogOpen}
        mindmapData={currentMindmapData}
        onSave={handleEditMindmapData}
        onClose={() => setIsEditDialogOpen(false)}
      />
    </div>
  );
}

