import { Toaster } from 'sonner';

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {children}
      <Toaster position="top-right" />
    </div>
  );
} 