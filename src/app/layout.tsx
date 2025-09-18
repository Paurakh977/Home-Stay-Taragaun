import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Script from 'next/script';
import { TranslateProvider } from "@/components/shared/TranslateProvider";
import { ClerkProvider } from "@clerk/nextjs";
import ChatProviderClient from "@/components/providers/ChatProviderClient";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: 'NepalStayLink',
    default: 'NepalStayLink | Authentic Nepali Homestay Experience',
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/Logo.png",
    apple: "/icons/icon-192x192.png",
  },
  themeColor: "#000000",
  description: "Experience authentic Nepali culture and hospitality with our carefully selected home stays across Nepal. Book your stay today!",
  keywords: ['homestay', 'Nepal', 'travel', 'authentic', 'accommodation', 'tourism', 'Nepali culture', 'hospitality'],
  authors: [{ name: 'NepalStayLink Team' }],
  creator: 'NepalStayLink',
  publisher: 'NepalStayLink',
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
    title: 'NepalStayLink | Authentic Nepali Homestay Experience',
    description: 'Experience authentic Nepali culture and hospitality with our carefully selected home stays across Nepal.',
    url: 'https://hamrohomestay.com',
    siteName: 'NepalStayLink',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'NepalStayLink - Authentic Nepali Homestays',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NepalStayLink | Authentic Nepali Homestay Experience',
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
      <head>
        {/* Inject CSS to prevent duplicate sidebars */}
        <style dangerouslySetInnerHTML={{ __html: `
          /* Hide any sidebars after the first one (fix duplicate sidebars) */
          aside:not(:first-of-type) {
            display: none !important;
          }
          
          /* Hide duplicate admin dashboards */
          .duplicate-admin-dashboard {
            display: none !important;
          }
          
          /* Make language names in the Google Translate dropdown untranslatable */
          .goog-te-menu-value span {
            -webkit-user-select: text !important;
            -webkit-user-modify: read-write !important;
            unicode-bidi: embed !important;
          }
          
          /* Make sure the notranslate class works properly with Google Translate */
          .notranslate {
            unicode-bidi: isolate !important;
          }
        ` }} />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        {/* Script to mark duplicate admin dashboards */}
        <Script id="deduplicate-admin-dashboards" strategy="afterInteractive">
          {`
            // Handle duplicate admin dashboards
            function deduplicateAdminDashboards() {
              const dashboardElements = document.querySelectorAll('span');
              let foundAdminDashboard = false;
              
              dashboardElements.forEach(el => {
                if (el.textContent && el.textContent.includes('Admin Dashboard')) {
                  if (foundAdminDashboard) {
                    // This is a duplicate - find parent container and hide it
                    let parent = el.parentElement;
                    for (let i = 0; i < 3; i++) {
                      if (parent) parent = parent.parentElement;
                    }
                    if (parent) parent.classList.add('duplicate-admin-dashboard');
                  } else {
                    foundAdminDashboard = true;
                  }
                }
              });
            }
            
            // Run on page load
            setTimeout(deduplicateAdminDashboards, 500);
            
            // Set up observer to run when DOM changes
            const observer = new MutationObserver(() => {
              setTimeout(deduplicateAdminDashboards, 100);
            });
            
            // Start observing
            setTimeout(() => {
              observer.observe(document.body, { childList: true, subtree: true });
            }, 1000);
          `}
        </Script>
        
        {/* Enhanced Google Translate handler script */}
        <Script id="google-translate-helper" strategy="afterInteractive">
          {`
            // Function to set Google Translate cookies
            function setGoogleTranslateCookies(lang) {
              const hostname = window.location.hostname;
              const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
              const isSecure = window.location.protocol === 'https:';
              
              // Get domain variations for proper cookie handling
              let domains = [hostname];
              if (!isLocalhost && hostname.includes('.')) {
                const parts = hostname.split('.');
                
                // Add the full hostname
                domains.push(hostname);
                
                // Add with leading dot for subdomain cookies
                domains.push('.' + hostname);
                
                // Add parent domains (e.g., 'sthaniyataha.com' from 'devhomestay.sthaniyataha.com')
                if (parts.length >= 2) {
                  const rootDomain = parts.slice(-2).join('.');
                  domains.push(rootDomain);
                  domains.push('.' + rootDomain);
                }
                
                // Remove duplicates
                domains = [...new Set(domains)];
              }
              
              if (!lang || lang === 'en') {
                // Clear cookies for English across all domain variations
                domains.forEach(domain => {
                  const domainWithDot = domain.startsWith('.') ? domain : '.' + domain;
                  const domainWithoutDot = domain.startsWith('.') ? domain.substring(1) : domain;
                  
                  document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + domainWithDot;
                  document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + domainWithoutDot;
                  
                  if (isSecure) {
                    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + domainWithDot + '; secure';
                    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + domainWithoutDot + '; secure';
                  }
                });
                document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
                return;
              }
              
              // Set cookies for non-English languages across all domain variations
              domains.forEach(domain => {
                const domainWithDot = domain.startsWith('.') ? domain : '.' + domain;
                const domainWithoutDot = domain.startsWith('.') ? domain.substring(1) : domain;
                
                document.cookie = 'googtrans=/auto/' + lang + '; path=/; domain=' + domainWithDot + (isSecure ? '; secure' : '');
                document.cookie = 'googtrans=/auto/' + lang + '; path=/; domain=' + domainWithoutDot + (isSecure ? '; secure' : '');
              });
              document.cookie = 'googtrans=/auto/' + lang + '; path=/';
              
              // Dispatch custom event to notify page change
              const event = new CustomEvent('nextjs:afterPageTransition');
              document.dispatchEvent(event);
            }
            
            // Enhanced function to handle translation dropdowns
            function fixTranslateDropdowns() {
              // Find all Google Translate dropdowns and ensure they're not translated
              const dropdowns = document.querySelectorAll('.goog-te-menu-value span');
              dropdowns.forEach(el => {
                if (!el.classList.contains('notranslate')) {
                  el.classList.add('notranslate');
                }
              });
              
              // Add class to parent dropdown container
              const containers = document.querySelectorAll('.goog-te-gadget');
              containers.forEach(el => {
                if (!el.classList.contains('notranslate')) {
                  el.classList.add('notranslate');
                }
              });
            }
            
            // Check for existing translation settings on page load
            const getCookie = (name) => {
              const value = '; ' + document.cookie;
              const parts = value.split('; ' + name + '=');
              if (parts.length === 2) return parts.pop().split(';').shift();
            };
            
            // Apply existing translation
            const savedLang = getCookie('googtrans');
            if (savedLang) {
              const lang = savedLang.split('/').pop();
              if (lang && lang !== 'en') {
                setTimeout(() => setGoogleTranslateCookies(lang), 1000);
              }
            }
            
            // Handle Next.js page transitions
            const handlePageChange = () => {
              const savedLang = getCookie('googtrans');
              if (savedLang) {
                const lang = savedLang.split('/').pop();
                setTimeout(() => {
                  // Fix translation dropdowns
                  fixTranslateDropdowns();
                  
                  // Re-trigger translation if needed
                  if (lang && lang !== 'en') {
                    // Dispatch custom event to notify page change
                    const event = new CustomEvent('nextjs:afterPageTransition');
                    document.dispatchEvent(event);
                  }
                }, 500);
              }
            };
            
            // Set up listeners for Next.js page changes
            if (typeof window !== 'undefined') {
              // Run fixTranslateDropdowns periodically to ensure UI consistency
              setInterval(fixTranslateDropdowns, 2000);
              
              // Listen for route changes
              window.addEventListener('popstate', handlePageChange);
              
              // This will catch Next.js Link component navigation
              const originalPushState = history.pushState;
              history.pushState = function() {
                originalPushState.apply(this, arguments);
                handlePageChange();
              };
            }
          `}
        </Script>
        
        <ClerkProvider>
          <ChatProviderClient>
            <TranslateProvider>
              {children}
            </TranslateProvider>
            <Toaster position="top-right" richColors />
          </ChatProviderClient>
        </ClerkProvider>
      </body>
    </html>
  );
}
