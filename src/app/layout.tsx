import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/provider/theme-provider";
import TanStackQueryProvider from "@/provider/TanstackProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { GeistMono, GeistSans } from "@/assets/quiz";

export const metadata: Metadata = {
  title: "FastSchool | Apprendimento basato sull'IA",
  description:
    "Genera quiz e presentazioni dai tuoi appunti usando l'IA.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${GeistSans.className} ${GeistMono.variable} bg-gray-50 text-zinc-800 antialiased`}
      >
        <TanStackQueryProvider>
          <AuthProvider>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
              {children}
            </ThemeProvider>
          </AuthProvider>
        </TanStackQueryProvider>
      </body>
    </html>
  );
}
