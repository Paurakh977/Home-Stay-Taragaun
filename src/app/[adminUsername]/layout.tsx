import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Toaster } from "sonner";
import { User } from "@/lib/models";
import dbConnect from "@/lib/mongodb";
import { getBrandingByAdminUsername } from "@/lib/services/brandingService";
import BrandingProviderClient from "@/context/BrandingProviderClient";

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { adminUsername: string };
}) {
  const { adminUsername } = params;

  try {
    // Connect to the database
    await dbConnect();
    
    // Find the admin user
    const adminUser = await User.findOne({ 
      username: adminUsername,
      role: 'admin'
    });

    // If the admin doesn't exist, show a 404 page
    if (!adminUser) {
      console.warn(`Admin user not found: ${adminUsername}`);
      notFound();
    }
    
    // Fetch branding data for this admin
    const brandingData = await getBrandingByAdminUsername(adminUsername);

    return (
      <BrandingProviderClient brandingData={brandingData}>
        <Navbar adminUsername={adminUsername} />
        <main className="flex-grow">{children}</main>
        <Footer adminUsername={adminUsername} />
        <Toaster position="top-right" richColors />
      </BrandingProviderClient>
    );
  } catch (error) {
    console.error(`Error in admin layout for ${adminUsername}:`, error);
    notFound();
  }
} 