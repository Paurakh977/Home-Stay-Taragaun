"use client";

import { createContext, useContext, ReactNode } from 'react';

interface AdminOfficerContextType {
  isOfficer: boolean;
  officerData: {
    username: string;
    parentAdmin: string;
    permissions: Record<string, boolean>;
  } | null;
  adminUsername: string | null;
}

// Create context with default values
const AdminOfficerContext = createContext<AdminOfficerContextType>({
  isOfficer: false,
  officerData: null,
  adminUsername: null
});

// Provider component
export function AdminOfficerProvider({
  children,
  isOfficer = false,
  officerData = null,
  adminUsername = null
}: {
  children: ReactNode;
  isOfficer?: boolean;
  officerData?: {
    username: string;
    parentAdmin: string;
    permissions: Record<string, boolean>;
  } | null;
  adminUsername?: string | null;
}) {
  return (
    <AdminOfficerContext.Provider value={{ isOfficer, officerData, adminUsername }}>
      {children}
    </AdminOfficerContext.Provider>
  );
}

// Hook to use the context
export function useAdminOfficer() {
  const context = useContext(AdminOfficerContext);
  
  // Return the context even if it's the default value outside of provider
  // This allows the hook to be used safely in both admin and officer routes
  return context;
} 