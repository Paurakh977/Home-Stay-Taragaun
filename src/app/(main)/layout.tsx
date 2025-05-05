import PlatformNavbar from "@/components/platform/PlatformNavbar";
import PlatformFooter from "@/components/platform/PlatformFooter";
import { WebContentProvider } from "@/context/WebContentContext";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WebContentProvider>
      <PlatformNavbar />
      <main className="flex-grow">{children}</main>
      <PlatformFooter />
    </WebContentProvider>
  );
} 