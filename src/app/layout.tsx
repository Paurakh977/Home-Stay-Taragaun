import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: '%s | Hamro Home Stay',
    default: 'Hamro Home Stay | Authentic Nepali Homestay Experience',
  },
  description: "Experience authentic Nepali culture and hospitality with our carefully selected home stays across Nepal. Book your stay today!",
  keywords: ['homestay', 'Nepal', 'travel', 'authentic', 'accommodation', 'tourism', 'Nepali culture', 'hospitality'],
  authors: [{ name: 'Hamro Home Stay Team' }],
  creator: 'Hamro Home Stay',
  publisher: 'Hamro Home Stay',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://hamrohomestay.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Hamro Home Stay | Authentic Nepali Homestay Experience',
    description: 'Experience authentic Nepali culture and hospitality with our carefully selected home stays across Nepal.',
    url: 'https://hamrohomestay.com',
    siteName: 'Hamro Home Stay',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Hamro Home Stay - Authentic Nepali Homestays',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hamro Home Stay | Authentic Nepali Homestay Experience',
    description: 'Experience authentic Nepali culture and hospitality with our carefully selected home stays across Nepal.',
    images: ['/images/twitter-image.jpg'],
  },
  verification: {
    // Add verification IDs when available
    google: 'google-site-verification-id',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-video-preview': -1,
      'max-snippet': -1,
    },
  },
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
