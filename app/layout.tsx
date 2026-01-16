import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reality Debugger",
  description: "Multimodal failure analysis using Gemini 3",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
