import PlatformNavbar from "@/components/platform/PlatformNavbar";
import PlatformFooter from "@/components/platform/PlatformFooter";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PlatformNavbar />
      <main className="flex-grow">{children}</main>
      <PlatformFooter />
    </>
  );
} 