"use client";
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Palette } from "lucide-react";
import { useTheme } from "next-themes";
import { usePresentationState } from "@/states/presentation-state";
import { cn } from "@/lib/utils";
import {
  themes,
  type Themes,
  type ThemeProperties,
} from "@/lib/presentation/themes";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type ThemeId = Themes | `custom-${string}`;

export function ThemeSelector() {
  const { theme: systemTheme } = useTheme();
  const { theme: presentationTheme, setTheme: setPresentationTheme } =
    usePresentationState();
  const [isThemeSheetOpen, setIsThemeSheetOpen] = useState(false);
  const isDark = systemTheme === "dark";

  // Handle theme selection
  const handleThemeSelect = (
    themeKey: ThemeId,
    customData?: ThemeProperties | null
  ) => {
    setPresentationTheme(themeKey as Themes, customData);
    setIsThemeSheetOpen(false);
  };

  return (
    <Sheet open={isThemeSheetOpen} onOpenChange={setIsThemeSheetOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
        >
          <Palette className="mr-1 h-4 w-4" />
          Tema
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        overlay={false}
        className="absolute bottom-0 top-0 w-full max-w-md overflow-y-auto sm:max-w-lg"
        container={
          typeof window === "undefined"
            ? undefined
            : typeof document !== "undefined"
            ? document.querySelector<HTMLElement>(".sheet-container") ??
              undefined
            : undefined
        }
      >
        <SheetHeader className="mb-5">
          <SheetTitle>Tema della Presentazione</SheetTitle>
          <SheetDescription>
            Scegli un tema per la tua presentazione
          </SheetDescription>
        </SheetHeader>

        <div>
          <h3 className="mb-4 text-lg font-semibold">Temi Integrati</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Object.entries(themes).map(([key, themeOption]) => {
              const modeColors = isDark
                ? themeOption.colors.dark
                : themeOption.colors.light;
              const modeShadows = isDark
                ? themeOption.shadows.dark
                : themeOption.shadows.light;

              return (
                <button
                  key={key}
                  onClick={() => handleThemeSelect(key as ThemeId)}
                  className={cn(
                    "group relative space-y-2 rounded-lg border p-4 text-left transition-all",
                    presentationTheme === key
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50 hover:bg-muted/50"
                  )}
                  style={{
                    borderRadius: themeOption.borderRadius,
                    boxShadow: modeShadows.card,
                    transition: themeOption.transitions.default,
                    backgroundColor:
                      presentationTheme === key
                        ? `${modeColors.primary}${isDark ? "15" : "08"}`
                        : isDark
                        ? "rgba(0,0,0,0.3)"
                        : "rgba(255,255,255,0.9)",
                  }}
                >
                  <div
                    className="font-medium"
                    style={{
                      color: modeColors.heading,
                      fontFamily: themeOption.fonts.heading,
                    }}
                  >
                    {themeOption.name}
                  </div>
                  <div
                    className="text-sm"
                    style={{
                      color: modeColors.text,
                      fontFamily: themeOption.fonts.body,
                    }}
                  >
                    {themeOption.description}
                  </div>
                  <div className="flex gap-2">
                    {[
                      modeColors.primary,
                      modeColors.secondary,
                      modeColors.accent,
                    ].map((color, i) => (
                      <div
                        key={i}
                        className="h-4 w-4 rounded-full ring-1 ring-inset ring-white/10"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div
                    className="mt-2 text-xs"
                    style={{ color: modeColors.muted }}
                  >
                    <span className="block">
                      Heading: {themeOption.fonts.heading}
                    </span>
                    <span className="block">
                      Body: {themeOption.fonts.body}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
