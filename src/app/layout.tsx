import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hamro Home Stay | Authentic Nepali Hospitality",
  description: "Experience authentic Nepali culture and hospitality with our carefully selected home stays across Nepal. Book your stay today!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
