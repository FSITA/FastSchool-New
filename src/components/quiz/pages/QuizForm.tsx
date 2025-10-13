import FormField from "@/components/quiz/pages/FormField";

export default function QuizForm({
  onSubmit,
}: {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <FormField>
      <form onSubmit={onSubmit}>
        <header className="text-center mb-10">
          <h2 className="text-lg font-semibold mb-1">Quiz Settings</h2>
          <p className="text-xs text-zinc-400">
            Configure the settings for your quiz.
          </p>
        </header>

        <fieldset className="grid md:grid-cols-2 grid-cols-1 gap-x-10 gap-8 mb-10">
          <label htmlFor="quizCount">
            <p className="text-sm mb-2 text-zinc-500">
              How many quizzes do you want to generate?
            </p>

            <select
              className="font-geistmono block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:max-w-xs text-sm"
              name="quizCount"
              id="quizCount"
            >
              <option value="2">2</option>
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20</option>
            </select>
          </label>
        </fieldset>

        <button className="flex items-center justify-center w-full text-center max-w-lg mx-auto duration-200 text-sm gap-x-2 bg-primary hover:bg-secondary text-white font-medium px-4 py-3 rounded-full">
          Generate Quiz
        </button>
      </form>
    </FormField>
  );
}
