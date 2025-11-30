import FormField from "@/components/shared/FormField";
import { CheckCircle, Info, Loader2 } from "lucide-react";

interface DiagramGenerationStepProps {
  onSubmit: () => void;
  isLoading: boolean;
  isExtracting?: boolean;
  error: string;
}

export default function DiagramGenerationStep({ 
  onSubmit, 
  isLoading,
  isExtracting,
  error 
}: DiagramGenerationStepProps) {
  return (
    <FormField>
      <div className="text-center">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        

        {/* Information Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 max-w-2xl mx-auto">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-left">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                📊 Informazioni importanti:
              </h3>
              <p className="text-sm text-blue-700 leading-relaxed">
                Se il diagramma non viene visualizzato correttamente a causa delle 
                limitazioni del browser, utilizza i controlli di zoom e scarica il 
                file SVG per una visualizzazione ottimale.
              </p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 max-w-2xl mx-auto">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Errore
                </h3>
                <div className="mt-1 text-sm text-red-700">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <div className="flex justify-center">
          <button
            onClick={onSubmit}
            disabled={isLoading || isExtracting}
            className={`px-8 py-3 rounded-lg font-medium text-white transition-all duration-200 flex items-center gap-2 ${
              isLoading || isExtracting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg hover:shadow-xl'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generazione in corso...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Genera Diagramma
              </>
            )}
          </button>
        </div>

        {/* Additional Info */}
        <p className="text-sm text-gray-500 mt-4">
          Il processo di generazione potrebbe richiedere alcuni secondi
        </p>
      </div>
    </FormField>
  );
}
