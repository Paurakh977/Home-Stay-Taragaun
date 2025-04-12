'use client';

import { useParams } from 'next/navigation';
import DocumentsPage from '@/app/dashboard/documents/page';

// Wrapper component for admin-specific documents page
export default function AdminDocumentsPage() {
  const params = useParams();
  const adminUsername = params.adminUsername as string;
  
  // Pass the adminUsername to the documents page
  return <DocumentsPage adminUsername={adminUsername} />;
} 