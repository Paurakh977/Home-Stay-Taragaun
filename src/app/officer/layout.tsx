import { Suspense } from 'react';
import { Toaster } from 'sonner';
import OfficerClientWrapper from './components/OfficerClientWrapper';
import Script from 'next/script';

// Loading fallback for Suspense
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full"></div>
    </div>
  );
}

export default function OfficerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Script to hide duplicate officer sidebars */}
      <Script id="hide-duplicate-sidebars" strategy="afterInteractive">
        {`
          function hideDuplicateSidebars() {
            // Get all officer dashboards and sidebars
            const sidebars = document.querySelectorAll('aside');
            if (sidebars.length > 1) {
              // Hide all but the first sidebar
              for (let i = 1; i < sidebars.length; i++) {
                sidebars[i].style.display = 'none';
              }
            }

            // Get all officer dashboard headers (containing "Officer Dashboard" text)
            const headers = document.querySelectorAll('h1, h2, h3, h4, h5, h6, span');
            let officerDashboardCount = 0;
            headers.forEach(header => {
              if (header.textContent.includes('Officer Dashboard')) {
                officerDashboardCount++;
                if (officerDashboardCount > 1) {
                  // Hide parent elements of duplicate headers
                  let parent = header.parentElement;
                  for (let i = 0; i < 3; i++) { // Go up 3 levels to hide the container
                    if (parent) {
                      parent = parent.parentElement;
                    }
                  }
                  if (parent) {
                    parent.style.display = 'none';
                  }
                }
              }
            });
          }

          // Run initially
          setTimeout(hideDuplicateSidebars, 100);

          // Set up observer to run when DOM changes
          const observer = new MutationObserver(hideDuplicateSidebars);
          observer.observe(document.body, { childList: true, subtree: true });
        `}
      </Script>

      <Suspense fallback={<LoadingFallback />}>
        <OfficerClientWrapper>
          <main className="flex-1">
            <Suspense fallback={<LoadingFallback />}>
              {children}
            </Suspense>
          </main>
        </OfficerClientWrapper>
      </Suspense>
      <Toaster />
    </div>
  );
} 