import { Dispatch, SetStateAction, useState } from "react";
import {
  DocumentIcon,
  ImageIcon,
  WikipediaIcon,
  YoutubeIcon,
} from "@/components/shared/icons";

const tabs = [
  {
    id: 0,
    title: "Incolla Appunto",
    icon: DocumentIcon,
  },
  {
    id: 1,
    title: "Carica File",
    icon: ImageIcon,
  },
  {
    id: 2,
    title: "YouTube",
    icon: YoutubeIcon,
  },
  {
    id: 3,
    title: "Wikipedia",
    icon: WikipediaIcon,
  },
];

export default function TabComponent({
  children,
  step,
  onSetStep,
}: {
  children: React.ReactNode;
  step: number;
  onSetStep: Dispatch<SetStateAction<number>>;
}) {
  return (
    <div>
      <header className="flex items-center border-b border-zinc-200 mb-4">
        {tabs.map((tab) => (
          <button
            onClick={() => onSetStep(tab.id)}
            key={tab.id}
            type="button"
            className={`flex items-center gap-x-2 p-3 rounded-t-lg duration-300 sm:text-base text-sm ${
              step === tab.id ? "bg-zinc-100" : null
            }`}
          >
            <tab.icon /> {tab.title}
          </button>
        ))}
      </header>
      {children}
    </div>
  );
}

