"use client";
import { ChevronLeft, SendHorizonal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LLMService } from "@/lib/diagram-generator/llm-service";

interface ChatPanelProps {
  onDiagramGenerated: (mermaidCode: string) => void;
  onError: (error: string) => void;
}

const ChatPanel = ({ onDiagramGenerated, onError }: ChatPanelProps) => {
  const router = useRouter();
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleSendMessage = async () => {
    if (!inputText.trim() || isGenerating) return;
    
    try {
      setIsGenerating(true);
      onError(""); 
      
      const response = await LLMService.generateMermaidDiagram(inputText.trim());
      
      if (response.success && response.mermaidCode) {
        onDiagramGenerated(response.mermaidCode);
        setInputText(""); 
      } else {
        onError(response.error || "Failed to generate diagram");
      }
    } catch (error) {
      console.error("Error generating diagram:", error);
      onError("An unexpected error occurred while generating the diagram");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col relative w-full md:w-1/2 h-full bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20">
      <div className="flex items-center gap-2 p-6 pb-0">
        <button 
          className="p-2 cursor-pointer hover:bg-white/50 rounded-lg transition-colors" 
          onClick={() => router.push("/")}
        >
          <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">DG</span>
          </div>
          <span className="text-xl font-semibold text-gray-800 dark:text-gray-200">Diagram Generator</span>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center flex-1 text-center px-6">
        <div className="text-2xl mb-4 text-gray-600 dark:text-gray-400">
          {isGenerating ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          ) : (
            '📊'
          )}
        </div>
        <h1 className="text-xl md:text-2xl text-gray-800 dark:text-gray-200 mb-2">
          {isGenerating ? "Generating your diagram..." : "Describe your diagram"}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm max-w-md">
          {isGenerating 
            ? "AI is creating your diagram..." 
            : "Tell us what kind of diagram you need and we'll create it for you"
          }
        </p>
      </div>

      <div className="fixed bottom-0 left-0 right-0 md:right-1/2 p-6 bg-gradient-to-t from-white/95 via-white/90 to-transparent dark:from-gray-900/95 dark:via-gray-900/90 backdrop-blur-sm">
        <div className="relative w-full max-w-2xl mx-auto">
          <input
            type="text"
            placeholder="Describe your diagram (e.g., 'Create a flowchart for user login process')"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isGenerating}
            className={`w-full rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4 pr-20 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
              isGenerating ? 'animate-pulse' : ''
            }`}
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button 
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isGenerating}
              className="p-2 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition cursor-pointer text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SendHorizonal className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="h-24"></div>
    </div>
  );
};

export default ChatPanel;
