import { Toaster } from 'sonner';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="hidden md:block w-64 flex-shrink-0">
        <AdminSidebar />
      </aside>
      
      <main className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
        
        <Toaster position="top-right" />
      </main>
    </div>
  );
} 