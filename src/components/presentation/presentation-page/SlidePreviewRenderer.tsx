"use client";

import debounce from "lodash.debounce";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";

interface SlidePreviewRendererProps {
  slideIndex: number;
  slideId: string;
  children: React.ReactNode;
}

export function SlidePreviewRenderer({
  slideIndex,
  children,
}: SlidePreviewRendererProps) {
  const [mounted, setMounted] = useState(false);
  const [scale, setScale] = useState(1);
  const childrenRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({
    editorWidth: 0,
    editorHeight: 0,
    previewWidth: 0,
    previewHeight: 0,
  });
  const [stableHeight, setStableHeight] = useState<number | null>(null);

  // Only render on client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const calculateDimensions = () => {
      const slidePreview = document.querySelector(
        `#slide-preview-${slideIndex}`
      );

      if (!slidePreview || !childrenRef.current) return;

      const previewRect = slidePreview.getBoundingClientRect();
      const editorRect = childrenRef.current.getBoundingClientRect();

      const previewWidth = previewRect.width;
      const previewHeight = previewRect.height;
      const editorWidth = editorRect.width;
      const editorHeight = editorRect.height;
      // Calculate scale for width to fit the preview
      const newScale = previewWidth / editorWidth;
      setDimensions({
        editorWidth,
        editorHeight,
        previewWidth,
        previewHeight,
      });

      setScale(newScale);
      
      // Set stable height after initial calculation to prevent flickering
      if (!stableHeight && newScale > 0) {
        const aspectRatio = editorHeight / editorWidth;
        const expectedHeight = previewWidth * aspectRatio;
        setStableHeight(expectedHeight);
      }
    };

    const debouncedCalculateDimensions = debounce(calculateDimensions, 100);

    // Setup resize observer for responsive scaling
    const observer = new ResizeObserver(() => {
      debouncedCalculateDimensions();
    });

    const slidePreview = document.querySelector(`#slide-preview-${slideIndex}`);
    if (slidePreview && childrenRef.current) {
      observer.observe(slidePreview);
      observer.observe(childrenRef.current);
      // Initial calculation
      calculateDimensions();
    }

    return () => {
      observer.disconnect();
    };
  }, [slideIndex, mounted]);

  if (!mounted) return null;

  // Find the preview element to portal into
  const previewElement = document.querySelector(`#slide-preview-${slideIndex}`);
  if (!previewElement) return null;

  // Calculate expected height based on the aspect ratio
  const aspectRatio = dimensions.editorHeight / dimensions.editorWidth;
  const expectedHeight = stableHeight || (dimensions.previewWidth * aspectRatio);

  return (
    <div
      ref={childrenRef}
      style={{ position: "absolute", visibility: "hidden" }}
    >
      {children}
      {createPortal(
        <div
          className="max-h-96"
          style={{
            height:
              expectedHeight && expectedHeight > 0 ? expectedHeight : "75px",
            // Remove transition during generation to prevent scrollbar flickering
            transition: "none",
          }}
        >
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              width: dimensions.editorWidth || 0,
              height: dimensions.editorHeight || 0,
              pointerEvents: "none",
            }}
          >
            {children}
          </div>
        </div>,
        previewElement
      )}
    </div>
  );
}
