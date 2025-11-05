import FormField from "@/components/shared/FormField";
import { usePresentationState } from "@/states/presentation-state";

export default function PresentationSettingsForm({
  onSubmit,
  isExtracting,
}: {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isExtracting?: boolean;
}) {
  const { numSlides, setNumSlides, pageStyle, setPageStyle } = usePresentationState();

  return (
    <FormField>
      <form onSubmit={onSubmit}>
        <header className="text-center mb-10">
          <h2 className="text-lg font-semibold mb-1">Impostazioni Presentazione</h2>
          <p className="text-xs text-zinc-400">
            Configura le impostazioni per la tua presentazione.
          </p>
        </header>

        <fieldset className="grid md:grid-cols-2 grid-cols-1 gap-x-10 gap-8 mb-10">
          <label htmlFor="numSlides">
            <p className="text-sm mb-2 text-zinc-500">
              Numero di diapositive
            </p>

            <select
              className="font-geistmono block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:max-w-xs text-sm"
              name="numSlides"
              id="numSlides"
              value={numSlides}
              onChange={(e) => setNumSlides(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20].map((num) => (
                <option key={num} value={num}>
                  {num} diapositive
                </option>
              ))}
            </select>
          </label>

          <label htmlFor="pageStyle">
            <p className="text-sm mb-2 text-zinc-500">
              Stile Presentazione
            </p>

            <select
              className="font-geistmono block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:max-w-xs text-sm"
              name="pageStyle"
              id="pageStyle"
              value={pageStyle}
              onChange={(e) => setPageStyle(e.target.value)}
            >
              <option value="professional">Professionale</option>
              <option value="creative">Creativo</option>
              <option value="academic">Accademico</option>
              <option value="casual">Casuale</option>
              <option value="minimalist">Minimalista</option>
            </select>
          </label>
        </fieldset>

        <button 
          type="submit"
          disabled={isExtracting}
          className={`flex items-center justify-center w-full text-center max-w-lg mx-auto duration-200 text-sm gap-x-2 font-medium px-4 py-3 rounded-full ${
            isExtracting
              ? 'bg-gray-400 cursor-not-allowed text-white'
              : 'bg-primary hover:bg-secondary text-white'
          }`}
        >
          Genera Presentazione
        </button>
      </form>
    </FormField>
  );
}
