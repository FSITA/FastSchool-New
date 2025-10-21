"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { Download, ZoomIn, ZoomOut, RotateCcw, Target } from "lucide-react";

interface MermaidDiagramProps {
  code: string;
  onError?: (error: string) => void;
}

export function MermaidDiagram({ code, onError }: MermaidDiagramProps) {
  const [svg, setSvg] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [zoomMode, setZoomMode] = useState<'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('center');
  const [isZoomToolActive, setIsZoomToolActive] = useState(false);
  const diagramId = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const svgContainerRef = useRef<HTMLDivElement>(null);

  const containerStyle: React.CSSProperties = {
    height: "600px",
    minHeight: "600px"
  };

  useEffect(() => {
    if (!code) {
      setSvg("");
      setError(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);

    const cleanCode = code
      .replace(/^---+\s*/g, "")
      .replace(/\s*---+$/g, "")
      .trim();

    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      securityLevel: "loose",
      fontFamily: "Inter, system-ui, sans-serif",
      flowchart: { 
        useMaxWidth: false, 
        htmlLabels: true, 
        curve: "basis",
        nodeSpacing: 80,
        rankSpacing: 80,
        padding: 40,
        diagramPadding: 20
      },
      sequence: { 
        useMaxWidth: false, 
        actorMargin: 80, 
        width: 200, 
        height: 80, 
        boxMargin: 15, 
        boxTextMargin: 8, 
        noteMargin: 15, 
        messageMargin: 50 
      },
      class: { useMaxWidth: false },
      er: { useMaxWidth: false },
      journey: { useMaxWidth: false },
      gantt: { useMaxWidth: false, fontSize: 12, numberSectionStyles: 4 }
    });

    (async function() {
      try {
        await mermaid.parse(cleanCode);
        const renderResult = await mermaid.render(diagramId, cleanCode);
        let svgOut = "";
        if (typeof renderResult === "string") {
          svgOut = renderResult;
        } else if (renderResult && typeof renderResult === "object" && "svg" in renderResult) {
          svgOut = renderResult.svg;
        } else {
          svgOut = String(renderResult);
        }
        setSvg(svgOut);
        setIsLoading(false);
        
      } catch (err) {
        setSvg("");
        setIsLoading(false);
        const errorMessage = err instanceof Error ? err.message : "Failed to render diagram";
        setError(errorMessage);
        if (onError) onError(errorMessage);
      }
    })();
  }, [code]);

  const handleDownloadSvg = async () => {
    if (!svgContainerRef.current) return;
    const svgElement = svgContainerRef.current.querySelector('svg');
    if (!svgElement) return;

    setIsDownloading(true);

    const clonedSvgElement = svgElement.cloneNode(true) as SVGSVGElement;

    clonedSvgElement.removeAttribute('width');
    clonedSvgElement.removeAttribute('height');
    clonedSvgElement.style.width = '';
    clonedSvgElement.style.height = '';
    clonedSvgElement.style.maxWidth = 'none';
    clonedSvgElement.style.maxHeight = 'none';

    const style = document.createElement('style');
    let css = '';
    for (const sheet of Array.from(document.styleSheets)) {
        try {
            if (sheet.cssRules) {
                css += Array.from(sheet.cssRules)
                    .map(rule => rule.cssText)
                    .join('\\n');
            }
        } catch (e) {
            console.warn("Could not read CSS rules from stylesheet:", e);
        }
    }
    style.appendChild(document.createTextNode(css));
    clonedSvgElement.prepend(style);

    const svgString = new XMLSerializer().serializeToString(clonedSvgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setTimeout(() => setIsDownloading(false), 1000);
  };

  if (!code) {
    return (
      <div className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6 flex items-center justify-center" style={containerStyle}>
        <div className="text-center">
          <div className="text-gray-500 dark:text-gray-400 text-sm">No diagram to display</div>
          <div className="text-gray-400 dark:text-gray-500 text-xs mt-1">Generate a diagram from your text</div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6 flex items-center justify-center" style={containerStyle}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <div className="text-gray-500 dark:text-gray-400 text-sm">Rendering diagram...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6 flex items-center justify-center" style={containerStyle}>
        <div className="text-center w-full">
          <div className="text-red-600 dark:text-red-400 text-sm font-medium mb-1">Diagram Render Error</div>
          <div className="text-red-500 dark:text-red-300 text-xs mb-2">{error}</div>
          <details className="text-left">
            <summary className="text-xs text-red-400 cursor-pointer">Show code</summary>
            <pre className="text-xs text-red-300 mt-1 p-2 bg-red-900/10 rounded whitespace-pre-wrap max-h-96 overflow-auto">{code}</pre>
          </details>
        </div>
      </div>
    );
  }

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 3.0));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1.0);
    setZoomMode('center');
  };

  const handleZoomModeChange = (mode: typeof zoomMode) => {
    setZoomMode(mode);
    setIsZoomToolActive(false);
  };

  const getTransformOrigin = () => {
    switch (zoomMode) {
      case 'top-left': return 'top left';
      case 'top-right': return 'top right';
      case 'bottom-left': return 'bottom left';
      case 'bottom-right': return 'bottom right';
      default: return 'center';
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
            <button
              onClick={handleZoomOut}
              className="p-2 rounded-md hover:bg-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4 text-gray-600" />
            </button>
            <span className="text-sm font-medium text-gray-700 min-w-[50px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 rounded-md hover:bg-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4 text-gray-600" />
            </button>
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            <button
              onClick={handleResetZoom}
              className="p-2 rounded-md hover:bg-white transition-colors"
              title="Reset Zoom"
            >
              <RotateCcw className="h-4 w-4 text-gray-600" />
            </button>
          </div>

          {/* Zoom Focus Tool */}
          <div className="relative">
            <button
              onClick={() => setIsZoomToolActive(!isZoomToolActive)}
              className={`p-2 rounded-lg transition-colors ${
                isZoomToolActive 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
              }`}
              title="Zoom Focus Tool"
            >
              <Target className="h-4 w-4" />
            </button>
            
            {isZoomToolActive && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[140px]">
                <div className="p-2">
                  <div className="text-xs font-medium text-gray-500 mb-2">Zoom Focus</div>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => handleZoomModeChange('top-left')}
                      className={`p-2 rounded text-xs transition-colors ${
                        zoomMode === 'top-left' 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      Top Left
                    </button>
                    <button
                      onClick={() => handleZoomModeChange('top-right')}
                      className={`p-2 rounded text-xs transition-colors ${
                        zoomMode === 'top-right' 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      Top Right
                    </button>
                    <button
                      onClick={() => handleZoomModeChange('bottom-left')}
                      className={`p-2 rounded text-xs transition-colors ${
                        zoomMode === 'bottom-left' 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      Bottom Left
                    </button>
                    <button
                      onClick={() => handleZoomModeChange('bottom-right')}
                      className={`p-2 rounded text-xs transition-colors ${
                        zoomMode === 'bottom-right' 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      Bottom Right
                    </button>
                    <button
                      onClick={() => handleZoomModeChange('center')}
                      className={`p-2 rounded text-xs transition-colors col-span-2 ${
                        zoomMode === 'center' 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      Center
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleDownloadSvg}
          className="px-4 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
          disabled={!svg || isDownloading}
        >
          <Download className={`h-4 w-4 ${isDownloading ? 'animate-bounce' : ''}`} />
          {isDownloading ? 'Downloading...' : 'Download SVG'}
        </button>
      </div>
      <div className="relative">
        <div
          ref={svgContainerRef}
          className="mermaid-container w-full bg-white border border-gray-200 rounded-lg mb-6"
          style={containerStyle}
        >
          <style>{`
            .mermaid-container {
              overflow: auto !important;
              scrollbar-width: thin;
              scrollbar-color: #e2e8f0 #f8fafc;
            }
            
            .mermaid-container::-webkit-scrollbar {
              width: 6px;
              height: 6px;
            }
            
            .mermaid-container::-webkit-scrollbar-track {
              background: #f8fafc;
              border-radius: 3px;
            }
            
            .mermaid-container::-webkit-scrollbar-thumb {
              background: #cbd5e0;
              border-radius: 3px;
              transition: background 0.2s ease;
            }
            
            .mermaid-container::-webkit-scrollbar-thumb:hover {
              background: #a0aec0;
            }
            
            .mermaid-container svg {
              width: 100% !important;
              height: auto !important;
              max-width: none !important;
              max-height: none !important;
              display: block;
              margin: auto;
            }
          `}</style>
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: zoomLevel > 1 ? `${100 * zoomLevel}%` : '100%',
              minHeight: zoomLevel > 1 ? `${100 * zoomLevel}%` : '100%',
              padding: '24px',
              width: '100%',
              height: '100%'
            }}
          >
            <div 
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: getTransformOrigin(),
                width: 'fit-content',
                height: 'fit-content'
              }}
            >
              <div dangerouslySetInnerHTML={{ __html: svg }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
