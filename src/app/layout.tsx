import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Qadam — Your Document, Decoded",
  description:
    "Upload a Pakistani government, university, or scholarship document and get a personalized, evidence-backed action plan.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
