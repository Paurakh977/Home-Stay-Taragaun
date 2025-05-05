'use client';

import { useEffect, useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Upload } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import Image from "next/image";

// Define validation schema for site info
const siteInfoSchema = z.object({
  siteName: z.string().min(2, { message: "Site name must be at least 2 characters" }),
  tagline: z.string().min(5, { message: "Tagline must be at least 5 characters" }),
  logoPath: z.string().min(1, { message: "Logo path is required" }),
  faviconPath: z.string().min(1, { message: "Favicon path is required" }),
});

// Define interface for our content type
interface ISiteInfo {
  siteInfo?: any;
  [key: string]: any;
}

export default function SiteInfoEditor() {
  const [content, setContent] = useState<ISiteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  // Initialize the form with React Hook Form
  const form = useForm<z.infer<typeof siteInfoSchema>>({
    resolver: zodResolver(siteInfoSchema),
    defaultValues: {
      siteName: "",
      tagline: "",
      logoPath: "",
      faviconPath: "",
    },
  });

  // Fetch content on component mount
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('/api/web-content?adminUsername=main');
        if (!response.ok) {
          throw new Error('Failed to fetch content');
        }
        const data = await response.json();
        setContent(data);
        
        // Populate form with fetched data
        if (data.siteInfo) {
          form.reset(data.siteInfo);
        }
      } catch (err) {
        console.error('Error fetching content:', err);
        toast.error('Failed to load site information');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [form]);

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof siteInfoSchema>) => {
    try {
      setSaving(true);
      const response = await fetch('/api/web-content?adminUsername=main&section=siteInfo', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update site information');
      }
      
      const updatedContent = await response.json();
      setContent(updatedContent);
      toast.success('Site information updated successfully');
    } catch (err) {
      console.error('Error updating content:', err);
      toast.error('Failed to update site information');
    } finally {
      setSaving(false);
    }
  };
  
  // Logo upload handler
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setUploadingImage(true);
      
      // Create a FormData instance
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'branding'); // Specify folder to save in
      
      // Use fetch to upload the image
      const response = await fetch('/api/superadmin/uploads/image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload logo');
      }
      
      const data = await response.json();
      
      // Set the image path to the form field
      form.setValue('logoPath', data.imagePath, { shouldValidate: true });
      toast.success('Logo uploaded successfully');
      
    } catch (err) {
      console.error('Error uploading logo:', err);
      toast.error('Failed to upload logo');
    } finally {
      setUploadingImage(false);
    }
  };
  
  // Favicon upload handler
  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setUploadingFavicon(true);
      
      // Create a FormData instance
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'branding'); // Specify folder to save in
      
      // Use fetch to upload the image
      const response = await fetch('/api/superadmin/uploads/image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload favicon');
      }
      
      const data = await response.json();
      
      // Set the image path to the form field
      form.setValue('faviconPath', data.imagePath, { shouldValidate: true });
      toast.success('Favicon uploaded successfully');
      
    } catch (err) {
      console.error('Error uploading favicon:', err);
      toast.error('Failed to upload favicon');
    } finally {
      setUploadingFavicon(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading site information...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Site Information & Branding</CardTitle>
          <CardDescription>
            Manage your website's core identity elements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Site Name */}
              <FormField
                control={form.control}
                name="siteName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Nepal StayLink" {...field} />
                    </FormControl>
                    <FormDescription>The name of your website that appears in the header</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Tagline */}
              <FormField
                control={form.control}
                name="tagline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tagline</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Gateway to Authentic Homestays" {...field} />
                    </FormControl>
                    <FormDescription>A short slogan that describes your business</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Logo */}
              <FormField
                control={form.control}
                name="logoPath"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo</FormLabel>
                    <FormControl>
                      <div className="flex flex-col gap-4">
                        <div className="flex gap-2">
                          <Input placeholder="/path/to/logo.png" {...field} />
                          <div className="relative">
                            <Input
                              type="file"
                              accept="image/*"
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              onChange={handleLogoUpload}
                              disabled={uploadingImage}
                            />
                            <Button type="button" variant="outline" disabled={uploadingImage}>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload
                            </Button>
                          </div>
                        </div>
                        {field.value && (
                          <div className="relative h-20 w-40 bg-gray-50 border rounded-md p-2 flex items-center justify-center">
                            <Image
                              src={field.value}
                              alt="Logo Preview"
                              width={120}
                              height={60}
                              className="object-contain max-h-full"
                            />
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription>
                      Your website logo (recommended: PNG with transparent background)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Favicon */}
              <FormField
                control={form.control}
                name="faviconPath"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Favicon</FormLabel>
                    <FormControl>
                      <div className="flex flex-col gap-4">
                        <div className="flex gap-2">
                          <Input placeholder="/favicon.ico" {...field} />
                          <div className="relative">
                            <Input
                              type="file"
                              accept="image/x-icon,image/png"
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              onChange={handleFaviconUpload}
                              disabled={uploadingFavicon}
                            />
                            <Button type="button" variant="outline" disabled={uploadingFavicon}>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload
                            </Button>
                          </div>
                        </div>
                        {field.value && (
                          <div className="relative h-16 w-16 bg-gray-50 border rounded-md p-2 flex items-center justify-center">
                            <Image
                              src={field.value}
                              alt="Favicon Preview"
                              width={32}
                              height={32}
                              className="object-contain"
                            />
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription>
                      Your browser tab icon (recommended: 32x32 or 16x16 ICO or PNG file)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Submit Button */}
              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 