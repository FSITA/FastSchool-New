import { MermaidDiagram } from "./mermaid-diagram";
import { ArrowLeft, RotateCcw } from "lucide-react";

interface DiagramDisplayProps {
  mermaidCode: string;
  error: string;
  onBackToForm: () => void;
  onNewDiagram: () => void;
}

export default function DiagramDisplay({ 
  mermaidCode, 
  error, 
  onBackToForm, 
  onNewDiagram 
}: DiagramDisplayProps) {
  return (
    <div className="w-full">
      {/* Header with Navigation */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToForm}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Torna al Form
          </button>
        </div>
        
        <button
          onClick={onNewDiagram}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Nuovo Diagramma
        </button>
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

      {/* Diagram Display - Center Aligned */}
      <div className="flex justify-center">
        <div className="w-full max-w-6xl">
          <MermaidDiagram 
            code={mermaidCode} 
            onError={(err) => console.error('Mermaid rendering error:', err)}
          />
        </div>
      </div>

      {/* Additional Info */}
      {mermaidCode && (
        <div className="mt-6 text-center">
          <details className="inline-block">
            <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
              Visualizza Codice Mermaid
            </summary>
            <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-left">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Codice ricevuto dall'IA:
              </div>
              <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-x-auto whitespace-pre-wrap">
                <code>{mermaidCode}</code>
              </pre>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
