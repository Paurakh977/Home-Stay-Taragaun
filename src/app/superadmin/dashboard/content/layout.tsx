'use client';

import { Suspense, useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { usePathname, useRouter } from "next/navigation";

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("home");

  // Set the active tab based on the current path
  useEffect(() => {
    if (pathname.includes("/content/home")) {
      setActiveTab("home");
    } else if (pathname.includes("/content/about")) {
      setActiveTab("about");
    } else if (pathname.includes("/content/contact")) {
      setActiveTab("contact");
    } else if (pathname.includes("/content/footer")) {
      setActiveTab("footer");
    } else if (pathname.includes("/content/testimonials")) {
      setActiveTab("testimonials");
    } else if (pathname.includes("/content/siteInfo")) {
      setActiveTab("siteInfo");
    } else if (pathname === "/superadmin/dashboard/content") {
      setActiveTab("dashboard");
    }
  }, [pathname]);

  const handleTabChange = (value: string) => {
    if (value === "dashboard") {
      router.push("/superadmin/dashboard/content");
    } else {
      router.push(`/superadmin/dashboard/content/${value}`);
    }
  };

  return (
    <div className="space-y-6 p-6 lg:p-10">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Website Content Management</h2>
        <p className="text-muted-foreground text-sm mt-2">
          Manage all content displayed on your website including pages, images, and text.
        </p>
      </div>
      <Separator className="my-6" />
      
      <div className="flex-1 space-y-4">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="flex flex-wrap h-auto bg-muted text-muted-foreground">
            <TabsTrigger value="dashboard">Overview</TabsTrigger>
            <TabsTrigger value="home">Home Page</TabsTrigger>
            <TabsTrigger value="about">About Page</TabsTrigger>
            <TabsTrigger value="contact">Contact Page</TabsTrigger>
            <TabsTrigger value="footer">Footer</TabsTrigger>
            <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
            <TabsTrigger value="siteInfo">Site Info</TabsTrigger>
          </TabsList>
          
          <Suspense fallback={<div className="space-y-3"><Skeleton className="h-[500px]" /></div>}>
            {children}
          </Suspense>
        </Tabs>
      </div>
    </div>
  );
} 