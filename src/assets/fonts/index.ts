import localFont from "next/font/local";

export const GeistSans = localFont({
  src: [
    {
      path: "../quiz/geist-sans/Geist-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../quiz/geist-sans/Geist-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../quiz/geist-sans/Geist-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../quiz/geist-sans/Geist-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../quiz/geist-sans/Geist-Bold.woff2",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--geist-sans",
  display: "swap",
});

export const GeistMono = localFont({
  src: [
    {
      path: "../quiz/geist-mono/GeistMono-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../quiz/geist-mono/GeistMono-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../quiz/geist-mono/GeistMono-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../quiz/geist-mono/GeistMono-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../quiz/geist-mono/GeistMono-Bold.woff2",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--geistmono",
  display: "swap",
});

