import Link from "next/link";

export default function Footer() {
  return (
    <footer className="flex lg:flex-row flex-col lg:items-center items-start justify-between lg:gap-4 gap-8 max-w-7xl mx-auto border-t border-light py-14 xl:px-0 px-6">
      <p className="text-zinc-500">
        &copy; FastSchool {new Date().getFullYear()}
      </p>
      <nav>
        <ul className="flex items-center flex-wrap gap-x-5 gap-y-3">
          <li>
            <Link
              href="/"
              className="text-zinc-600 font-semibold tracking-tighter hover:text-zinc-800 duration-300"
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              href="/presentation"
              className="text-zinc-600 font-semibold tracking-tighter hover:text-zinc-800 duration-300"
            >
              Presentations
            </Link>
          </li>
          <li>
            <Link
              href="/quiz"
              className="text-zinc-600 font-semibold tracking-tighter hover:text-zinc-800 duration-300"
            >
              Quizzes
            </Link>
          </li>
                  <li>
                    <Link
                      href="/flashcards"
                      className="text-zinc-600 font-semibold tracking-tighter hover:text-zinc-800 duration-300"
                    >
                      Flashcards
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/lesson-planner"
                      className="text-zinc-600 font-semibold tracking-tighter hover:text-zinc-800 duration-300"
                    >
                      Lesson Planner
                    </Link>
                  </li>
                </ul>
      </nav>
    </footer>
  );
}
