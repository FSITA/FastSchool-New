import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/provider/theme-provider";
import TanStackQueryProvider from "@/provider/TanstackProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { GeistMono, GeistSans } from "@/assets/fonts";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "FastSchool | Apprendimento basato sull'IA",
  description:
    "Genera presentazioni, flashcard, piani didattici e lezioni dai tuoi appunti usando l'IA.",
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
    ],
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${GeistSans.className} ${GeistMono.variable} text-[#1A1A1A] antialiased`}
      >
        <TanStackQueryProvider>
          <AuthProvider>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
              {children}
              <Toaster />
            </ThemeProvider>
          </AuthProvider>
        </TanStackQueryProvider>
      </body>
    </html>
  );
}
