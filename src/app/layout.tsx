import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Toaster } from "sonner";
import { headers } from 'next/headers';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hamro Home Stay | Authentic Nepali Hospitality",
  description: "Experience authentic Nepali culture and hospitality with our carefully selected home stays across Nepal. Book your stay today!",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const heads = await headers();
  const pathname = heads.get('next-url') ?? '';

  const isSuperAdminPath = pathname.startsWith('/superadmin');

  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        {!isSuperAdminPath && <Navbar />}
        <main className="flex-grow">{children}</main>
        {!isSuperAdminPath && <Footer />}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
