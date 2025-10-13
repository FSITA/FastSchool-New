import Link from "next/link";

export default function Social() {
  return (
    <ul className="flex items-center gap-x-6">
      <li>
        <Link
          href="https://github.com"
          className="text-zinc-800 hover:text-primary text-2xl duration-200"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </Link>
      </li>
    </ul>
  );
}
