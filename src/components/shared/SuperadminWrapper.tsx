'use client';

// SuperadminWrapper is now a passthrough component - no longer gates content
export default function SuperadminWrapper({ children }: { children: React.ReactNode }) {
  // Always render children - no superadmin check required
  return <>{children}</>;
}