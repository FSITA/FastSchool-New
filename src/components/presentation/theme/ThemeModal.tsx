"use client";

import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { usePresentationState } from "@/states/presentation-state";
import { useTheme } from "next-themes";
import { themes, type Themes } from "@/lib/presentation/themes";
import { cn } from "@/lib/utils";

type ThemeId = Themes | `custom-${string}`;

export function ThemeModal({ children }: { children?: ReactNode }) {
  const { setTheme, theme: presentationTheme } = usePresentationState();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const handleSelectTheme = (themeKey: ThemeId) => {
    setTheme(themeKey as Themes);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children ? children : <Button variant="link">Altri Temi</Button>}
      </DialogTrigger>
      <DialogContent
        shouldHaveClose={false}
        className="h-[60vh] max-w-5xl overflow-auto"
      >
        <div className="flex h-full flex-col ">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Temi Integrati</h3>
            <DialogClose asChild>
              <Button size={"icon"} variant={"ghost"}>
                <X className="size-4"> </X>
              </Button>
            </DialogClose>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  onClick={() => handleSelectTheme(key as ThemeId)}
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
      </DialogContent>
    </Dialog>
  );
}
