"use client"

import Link from "next/link";

export function Header() {
  return (
    <header className="w-full px-6 py-4">
      <nav className="flex items-center justify-between w-full" style={{maxWidth: 'none', marginLeft: '0', marginRight: '0'}}>
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt="MerdiAI Logo" className="w-8 h-8 rounded" />
            <span className="text-xl font-semibold text-gray-800">MerdiAI</span>
          </Link>
        </div>
      </nav>
    </header>
  )
}
