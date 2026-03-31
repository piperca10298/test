import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const neuroSans = localFont({
  src: "./fonts/bahnschrift.ttf",
  variable: "--font-neuro-sans",
  display: "swap",
});

const neuroDisplay = localFont({
  src: "./fonts/agency-fb.ttf",
  variable: "--font-neuro-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NeuroGrid | Connect Your Mind to the Machine",
  description:
    "NeuroGrid is a fictional experimental platform that connects human thought to AI systems through responsive neural interfaces.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${neuroSans.variable} ${neuroDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
