import { Suspense } from "react";
import { Metadata } from "next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Website Content Management",
  description: "Manage all website content for your Hamro Home Stay platform.",
};

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
        <Tabs defaultValue="home" className="space-y-4">
          <TabsList className="flex flex-wrap h-auto bg-muted text-muted-foreground">
            <TabsTrigger value="home">Home Page</TabsTrigger>
            <TabsTrigger value="about">About Page</TabsTrigger>
            <TabsTrigger value="contact">Contact Page</TabsTrigger>
            <TabsTrigger value="navigation">Navigation</TabsTrigger>
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