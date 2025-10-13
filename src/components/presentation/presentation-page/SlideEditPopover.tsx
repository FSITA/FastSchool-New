import {
  Edit,
  Image,
  Trash2,
  LayoutGrid,
  PanelRight,
  PanelLeft,
  PanelTop,
  MoveHorizontal,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { usePresentationState } from "@/states/presentation-state";
import { cn } from "@/lib/utils";
import { type LayoutType } from "../utils/parser";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SlideEditPopoverProps {
  index: number;
}

export function SlideEditPopover({ index }: SlideEditPopoverProps) {
  const { slides, setSlides } = usePresentationState();
  const updateSlide = (
    updates: Partial<{
      layoutType: LayoutType;
      width: "S" | "M" | "L";
      rootImage?: {
        query: string;
        url?: string;
      };
    }>
  ) => {
    const updatedSlides = [...slides];
    updatedSlides[index] = {
      ...updatedSlides[index]!,
      ...updates,
    };
    setSlides(updatedSlides);
  };

  const currentSlide = slides[index];
  const currentLayout = currentSlide?.layoutType ?? "left";
  const currentWidth = currentSlide?.width ?? "M";
  const hasRootImage = !!currentSlide?.rootImage;

  const handleImageEdit = () => {
    // Create a file input for image selection
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const url = event.target?.result as string;
          updateSlide({
            rootImage: {
              query: file.name,
              url: url,
            },
          });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleImageDelete = () => {
    updateSlide({ rootImage: undefined });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="!size-8 rounded-full bg-background/80 hover:bg-background border border-border/50">
          <Edit className="h-4 w-4 text-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 rounded-md border border-border bg-background shadow-lg"
        side="bottom"
      >
        <div className="space-y-4">
          {/* Upload Your Image */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image className="h-4 w-4 text-foreground" />
              <span className="text-sm text-foreground font-medium">Upload Your Image</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Background image that appears behind your slide content</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="link"
                className="h-auto p-0 text-sm text-primary hover:text-primary/80"
                onClick={handleImageEdit}
              >
                {hasRootImage ? "Change" : "Add"}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-red-500"
                onClick={handleImageDelete}
                disabled={!hasRootImage}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {/* Image Placement */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-foreground" />
              <span className="text-sm text-foreground font-medium">Card layout</span>
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-6 w-6 border-border bg-background hover:bg-muted",
                  currentLayout === "vertical" && "bg-primary text-primary-foreground"
                )}
                onClick={() => updateSlide({ layoutType: "vertical" })}
              >
                <PanelTop className="h-4 w-4"></PanelTop>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-6 w-6 border-border bg-background hover:bg-muted",
                  currentLayout === "left" && "bg-primary text-primary-foreground"
                )}
                onClick={() => updateSlide({ layoutType: "left" })}
              >
                <PanelLeft className="h-4 w-4"></PanelLeft>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-6 w-6 border-border bg-background hover:bg-muted",
                  currentLayout === "right" && "bg-primary text-primary-foreground"
                )}
                onClick={() => updateSlide({ layoutType: "right" })}
              >
                <PanelRight className="h-4 w-4"></PanelRight>
              </Button>
            </div>
          </div>

          {/* Card Width */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MoveHorizontal className="h-4 w-4 text-foreground"></MoveHorizontal>
              <span className="text-sm text-foreground font-medium">Card width</span>
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-6 border-border bg-background hover:bg-muted px-2 text-xs",
                  currentWidth === "S" && "bg-primary text-primary-foreground"
                )}
                onClick={() => updateSlide({ width: "S" })}
                title="Small width (768px)"
              >
                S
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-6 border-border bg-background hover:bg-muted px-2 text-xs",
                  currentWidth === "M" && "bg-primary text-primary-foreground"
                )}
                onClick={() => updateSlide({ width: "M" })}
                title="Medium width (1024px)"
              >
                M
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-6 border-border bg-background hover:bg-muted px-2 text-xs",
                  currentWidth === "L" && "bg-primary text-primary-foreground"
                )}
                onClick={() => updateSlide({ width: "L" })}
                title="Large width (1536px)"
              >
                L
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
