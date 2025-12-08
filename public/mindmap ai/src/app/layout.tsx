import type { Metadata, Viewport } from "next";
import "./globals.css";
import "react-loading-skeleton/dist/skeleton.css";
import { ThemeProvider } from "../contexts/ThemeContext";

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: "Mappa Mentale AI",
  description: "Genera bellissime mappe mentali con l'AI. Crea mappe di conoscenza visive da qualsiasi argomento.",
  keywords: "mappa mentale, AI, mappe di conoscenza, apprendimento visivo, strumenti di studio",
  authors: [{ name: "Mappa Mentale AI" }],
  openGraph: {
    title: "Mappa Mentale AI - Generatore di Mappe Mentali con AI",
    description: "Genera bellissime mappe mentali con l'AI. Crea mappe di conoscenza visive da qualsiasi argomento.",
    url: "http://localhost:3000",
    siteName: "Mappa Mentale AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mappa Mentale AI - Generatore di Mappe Mentali con AI",
    description: "Genera bellissime mappe mentali con l'AI. Crea mappe di conoscenza visive da qualsiasi argomento.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" data-theme="dark" style={{ colorScheme: 'normal' }} suppressHydrationWarning>
      <body className={`antialiased`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
