import FormField from "@/components/quiz/pages/FormField";

export default function FlashcardSettingsForm({
  onSubmit,
  count,
  setCount,
}: {
  onSubmit: () => void;
  count: number;
  setCount: (count: number) => void;
}) {

  return (
    <FormField>
      <div>
        <header className="text-center mb-10">
          <h2 className="text-lg font-semibold mb-1">Impostazioni Flashcard</h2>
          <p className="text-xs text-zinc-400">
            Configura il numero di flashcard da generare.
          </p>
        </header>

        <fieldset className="grid md:grid-cols-2 grid-cols-1 gap-x-10 gap-8 mb-10">
          <label htmlFor="count">
            <p className="text-sm mb-2 text-zinc-500">
              Numero di flashcard
            </p>

            <select
              className="font-geistmono block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:max-w-xs text-sm"
              name="count"
              id="count"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            >
              {[5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
          </label>

          <div></div>
        </fieldset>

        <button 
          type="button"
          onClick={() => {
            console.log("🔘 Generate Flashcards button clicked");
            console.log("📊 Current count:", count);
            onSubmit();
          }}
          className="flex items-center justify-center w-full text-center max-w-lg mx-auto duration-200 text-sm gap-x-2 bg-primary hover:bg-secondary text-white font-medium px-4 py-3 rounded-full"
        >
          Genera Flashcard
        </button>
      </div>
    </FormField>
  );
}
