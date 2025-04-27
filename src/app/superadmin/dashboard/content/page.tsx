'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Check, FileText, Globe, Home, Info, Layout, Users } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { IWebContent } from '@/lib/models';

export default function ContentManagementPage() {
  const [content, setContent] = useState<IWebContent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('/api/web-content?adminUsername=main');
        if (!response.ok) {
          throw new Error('Failed to fetch content');
        }
        const data = await response.json();
        setContent(data);
        setLastUpdated(new Date(data.updatedAt).toLocaleString());
      } catch (err) {
        console.error('Error fetching content:', err);
        setError('Failed to load website content');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all content to defaults? This action cannot be undone.')) {
      try {
        setLoading(true);
        const response = await fetch('/api/web-content/reset?adminUsername=main', {
          method: 'POST',
        });
        
        if (!response.ok) {
          throw new Error('Failed to reset content');
        }
        
        const data = await response.json();
        setContent(data.content);
        setLastUpdated(new Date(data.content.updatedAt).toLocaleString());
        alert('Content has been reset to defaults successfully');
      } catch (err) {
        console.error('Error resetting content:', err);
        setError('Failed to reset website content');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Tabs defaultValue="home">
      <TabsContent value="home" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Home Page</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {content?.homePage?.hero?.title ? 'Active' : 'Not Configured'}
              </div>
              <p className="text-xs text-muted-foreground">
                Landing page content
              </p>
              <Link href="/superadmin/dashboard/content/home">
                <Button className="w-full mt-4" size="sm">
                  Edit Home Page
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">About Page</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {content?.aboutPage?.story?.title ? 'Active' : 'Not Configured'}
              </div>
              <p className="text-xs text-muted-foreground">
                Company information and story
              </p>
              <Link href="/superadmin/dashboard/content/about">
                <Button className="w-full mt-4" size="sm">
                  Edit About Page
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contact Page</CardTitle>
              <Info className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {content?.contactPage?.info?.title ? 'Active' : 'Not Configured'}
              </div>
              <p className="text-xs text-muted-foreground">
                Contact details and form
              </p>
              <Link href="/superadmin/dashboard/content/contact">
                <Button className="w-full mt-4" size="sm">
                  Edit Contact Page
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Testimonials</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {content?.testimonials?.length || 0} Entries
              </div>
              <p className="text-xs text-muted-foreground">
                Customer testimonials
              </p>
              <Link href="/superadmin/dashboard/content/testimonials">
                <Button className="w-full mt-4" size="sm">
                  Manage Testimonials
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Site Components</CardTitle>
              <CardDescription>
                Manage navigation, footer and other site-wide elements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Link href="/superadmin/dashboard/content/navigation">
                  <Button variant="outline" className="w-full flex items-center justify-start gap-2" size="lg">
                    <Layout className="h-4 w-4" />
                    Navigation Menu
                  </Button>
                </Link>
                
                <Link href="/superadmin/dashboard/content/footer">
                  <Button variant="outline" className="w-full flex items-center justify-start gap-2" size="lg">
                    <Layout className="h-4 w-4" />
                    Footer
                  </Button>
                </Link>
                
                <Link href="/superadmin/dashboard/content/siteInfo">
                  <Button variant="outline" className="w-full flex items-center justify-start gap-2" size="lg">
                    <Globe className="h-4 w-4" />
                    Site Info & Branding
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Content Status</CardTitle>
              <CardDescription>
                Website content information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="font-medium">Last Updated</div>
                <div className="text-sm text-muted-foreground">{lastUpdated || 'Unknown'}</div>
              </div>
              
              <div className="flex items-center justify-between border-b pb-2">
                <div className="font-medium">Status</div>
                <div className="flex items-center gap-1 text-sm">
                  {!error && content ? (
                    <>
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-green-500">Active</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="text-red-500">Error</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div className="font-medium">Reset Content</div>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  disabled={loading}
                  onClick={handleReset}
                >
                  Reset to Default
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}
      </TabsContent>
    </Tabs>
  );
} 