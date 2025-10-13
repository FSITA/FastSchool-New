import { useState } from "react";
import TabComponent from "@/components/quiz/shared/TabComponent";
import FileNote from "@/components/quiz/pages/FileNote";
import TextNote from "@/components/quiz/pages/TextNote";
import FormField from "@/components/quiz/pages/FormField";
import YoutubeLink from "@/components/quiz/pages/YoutubeLink";
import WikipediaLink from "@/components/quiz/pages/WikipediaLink";

export default function UniversalForm({
  onSubmit,
}: {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  const [step, setStep] = useState(0);

  return (
    <FormField>
      <form onSubmit={onSubmit}>
        <input type="hidden" name="step" value={step} />
        <header className="text-center mb-10">
          <h2 className="text-lg font-semibold mb-1">Aggiungi Contenuto</h2>
          <p className="text-xs text-zinc-400">
            Scegli la fonte del contenuto per la presentazione
          </p>
        </header>
        <div className="flex flex-col gap-3 mb-4">
          <TabComponent step={step} onSetStep={setStep}>
            {step === 0 && <TextNote />}
            {step === 1 && <FileNote />}
            {step === 2 && <YoutubeLink />}
            {step === 3 && <WikipediaLink />}
          </TabComponent>
        </div>

        <fieldset className="grid md:grid-cols-2 grid-cols-1 gap-x-10 gap-8 mb-10">
          <label htmlFor="gradeLevel">
            <p className="text-sm mb-2 text-zinc-500">
              Seleziona Livello Scolastico
            </p>

            <select
              className="font-geistmono block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:max-w-xs text-sm"
              name="gradeLevel"
              id="gradeLevel"
            >
              <option value="primary">Scuola Primaria</option>
              <option value="secondary">Scuola Secondaria</option>
              <option value="high_school">Scuola Superiore</option>
              <option value="university">Livello Universitario</option>
            </select>
          </label>

          <label htmlFor="language">
            <p className="text-sm mb-2 text-zinc-500">
              Seleziona Lingua
            </p>

            <select
              className="font-geistmono block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:max-w-xs text-sm"
              name="language"
              id="language"
            >
              <option value="italian">Italian (Italiano)</option>
              <option value="english">English (English)</option>
              <option value="spanish">Spanish (Español)</option>
              <option value="french">French (Français)</option>
              <option value="german">German (Deutsch)</option>
              <option value="portuguese">Portuguese (Português)</option>
              <option value="dutch">Dutch (Nederlands)</option>
              <option value="russian">Russian (Pусский)</option>
              <option value="chinese">Chinese (Simplified – 中文, 汉语)</option>
            </select>
          </label>
        </fieldset>

        <button className="flex items-center justify-center w-full text-center max-w-lg mx-auto duration-200 text-sm gap-x-2 bg-primary hover:bg-secondary text-white font-medium px-4 py-3 rounded-full">
          Avanti
        </button>
      </form>
    </FormField>
  );
}
