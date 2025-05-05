'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Check, FileText, Globe, Home, Info, Layout, Users, X } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { IWebContent } from '@/lib/models';
import Image from "next/image";
import { toast } from "sonner";

export default function ContentManagementPage() {
  const [content, setContent] = useState<IWebContent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [resetLoading, setResetLoading] = useState<boolean>(false);

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
        setResetLoading(true);
        const response = await fetch('/api/reset-web-content?adminUsername=main', {
          method: 'POST',
        });
        
        if (!response.ok) {
          throw new Error('Failed to reset content');
        }
        
        const data = await response.json();
        setContent(data.content);
        setLastUpdated(new Date(data.content.updatedAt).toLocaleString());
        toast.success('Content has been reset to defaults successfully');
      } catch (err) {
        console.error('Error resetting content:', err);
        setError('Failed to reset website content');
        toast.error('Failed to reset content. Please check the console for details.');
      } finally {
        setResetLoading(false);
      }
    }
  };

  // Helper function to check if a section is configured
  const isSectionConfigured = (sectionName: string): boolean => {
    if (!content) return false;
    return !!content[sectionName as keyof IWebContent];
  };

  // Helper to get content counts
  const getContentCount = (sectionName: string): number => {
    if (!content) return 0;
    const section = content[sectionName as keyof IWebContent];
    if (Array.isArray(section)) {
      return section.length;
    }
    return Object.keys(section || {}).length > 0 ? 1 : 0;
  };

  // Helper to show status badge
  const StatusBadge = ({ configured }: { configured: boolean }) => (
    <div className="flex items-center text-sm mt-2">
      <div className={`rounded-full w-2 h-2 mr-2 ${configured ? 'bg-green-500' : 'bg-amber-500'}`}></div>
      <span>{configured ? 'Configured' : 'Not configured'}</span>
    </div>
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading content dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Content Management</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Manage the content displayed on your website. Last updated: {lastUpdated || 'Never'}
        </p>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Site Information */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <Globe className="mr-2 h-5 w-5 text-primary" />
              Site Information
            </CardTitle>
            <CardDescription>
              Basic information like site name, logo, and favicon
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StatusBadge configured={isSectionConfigured('siteInfo')} />
            
            {content?.siteInfo && (
              <div className="mt-3 flex items-center gap-3 text-sm">
                <div className="relative h-8 w-8 overflow-hidden rounded-md border bg-muted">
                  {content.siteInfo.logoPath && (
                    <Image 
                      src={content.siteInfo.logoPath} 
                      alt="Logo" 
                      width={32} 
                      height={32} 
                      className="object-contain"
                    />
                  )}
                </div>
                <span className="font-medium">{content.siteInfo.siteName}</span>
                <span className="text-xs text-muted-foreground">{content.siteInfo.tagline}</span>
              </div>
            )}
          </CardContent>
          <div className="px-6 pb-6">
            <Button variant="outline" asChild className="w-full mt-2">
              <Link href="/superadmin/dashboard/content/siteInfo">Edit Site Info</Link>
            </Button>
          </div>
        </Card>
        
        {/* Homepage */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <Home className="mr-2 h-5 w-5 text-primary" />
              Home Page
            </CardTitle>
            <CardDescription>
              Hero section, features, and call-to-action
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StatusBadge configured={isSectionConfigured('homePage')} />
            
            {content?.homePage && (
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="border rounded p-2">
                  <p className="font-medium text-xs mb-1">Hero</p>
                  <p className="truncate text-xs">{content.homePage.hero.title}</p>
                </div>
                <div className="border rounded p-2">
                  <p className="font-medium text-xs mb-1">Sections</p>
                  <p className="text-xs">
                    {Object.keys(content.homePage).length - 1} configured sections
                  </p>
                </div>
              </div>
            )}
          </CardContent>
          <div className="px-6 pb-6">
            <Button variant="outline" asChild className="w-full mt-2">
              <Link href="/superadmin/dashboard/content/home">Edit Home Page</Link>
            </Button>
          </div>
        </Card>
        
        {/* About Page */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <Info className="mr-2 h-5 w-5 text-primary" />
              About Page
            </CardTitle>
            <CardDescription>
              Story, mission, team, and values
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StatusBadge configured={isSectionConfigured('aboutPage')} />
            
            {content?.aboutPage && (
              <div className="mt-3 text-sm">
                <div className="border rounded p-2">
                  <p className="font-medium text-xs mb-1">Our Mission</p>
                  <p className="truncate text-xs">{content.aboutPage.mission?.statement}</p>
                </div>
                
                {content.aboutPage.team?.members && content.aboutPage.team.members.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {content.aboutPage.team.members.slice(0, 4).map((member: any, index: number) => (
                      <div key={index} className="relative h-8 w-8 overflow-hidden rounded-full border bg-muted">
                        <Image src={member.photoPath} alt={member.name} fill className="object-cover" />
                      </div>
                    ))}
                    {content.aboutPage.team.members.length > 4 && (
                      <div className="flex items-center justify-center h-8 w-8 rounded-full border bg-muted text-xs">
                        +{content.aboutPage.team.members.length - 4}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <div className="px-6 pb-6">
            <Button variant="outline" asChild className="w-full mt-2">
              <Link href="/superadmin/dashboard/content/about">Edit About Page</Link>
            </Button>
          </div>
        </Card>
        
        {/* Contact Page */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <FileText className="mr-2 h-5 w-5 text-primary" />
              Contact Page
            </CardTitle>
            <CardDescription>
              Contact form, information, and map
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StatusBadge configured={isSectionConfigured('contactPage')} />
            
            {content?.contactPage && (
              <div className="mt-3 text-sm">
                <div className="border rounded p-2">
                  <p className="font-medium text-xs mb-1">Contact Info</p>
                  <p className="truncate text-xs">
                    {content.contactPage.info?.phone?.office || 'Phone not set'} | {content.contactPage.info?.email?.general || 'Email not set'}
                  </p>
                </div>
                
                {content.contactPage.form?.subjects && (
                  <div className="border rounded p-2 mt-2">
                    <p className="font-medium text-xs mb-1">Form Subjects</p>
                    <p className="truncate text-xs">
                      {content.contactPage.form.subjects.length} subject options
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <div className="px-6 pb-6">
            <Button variant="outline" asChild className="w-full mt-2">
              <Link href="/superadmin/dashboard/content/contact">Edit Contact Page</Link>
            </Button>
          </div>
        </Card>
        
        {/* Testimonials */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <Users className="mr-2 h-5 w-5 text-primary" />
              Testimonials
            </CardTitle>
            <CardDescription>
              Customer reviews and testimonials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StatusBadge configured={content?.testimonials && content.testimonials.length > 0} />
            
            {content?.testimonials && content.testimonials.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium mb-2">{content.testimonials.length} Testimonials</p>
                <div className="flex gap-1">
                  {content.testimonials.slice(0, 4).map((testimonial: any, index: number) => (
                    <div key={index} className="relative h-8 w-8 overflow-hidden rounded-full border bg-muted">
                      <Image src={testimonial.photoPath} alt={testimonial.name} fill className="object-cover" />
                    </div>
                  ))}
                  {content.testimonials.length > 4 && (
                    <div className="flex items-center justify-center h-8 w-8 rounded-full border bg-muted text-xs">
                      +{content.testimonials.length - 4}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
          <div className="px-6 pb-6">
            <Button variant="outline" asChild className="w-full mt-2">
              <Link href="/superadmin/dashboard/content/testimonials">Edit Testimonials</Link>
            </Button>
          </div>
        </Card>
        
        {/* Navigation & Footer */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <Layout className="mr-2 h-5 w-5 text-primary" />
              Navigation & Footer
            </CardTitle>
            <CardDescription>
              Navigation links and footer content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Navigation:</span>
                <StatusBadge configured={isSectionConfigured('navigation')} />
              </div>
              
              {content?.navigation?.links && (
                <div className="flex flex-wrap gap-1">
                  {content.navigation.links.slice(0, 4).map((link: any, index: number) => (
                    <div key={index} className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                      {link.name}
                    </div>
                  ))}
                  {content.navigation.links.length > 4 && (
                    <div className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                      +{content.navigation.links.length - 4}
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm">Footer:</span>
                <StatusBadge configured={isSectionConfigured('footer')} />
              </div>
            </div>
          </CardContent>
          <div className="px-6 pb-6 grid grid-cols-2 gap-2">
            <Button variant="outline" asChild>
              <Link href="/superadmin/dashboard/content/header">Edit Navigation</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/superadmin/dashboard/content/footer">Edit Footer</Link>
            </Button>
          </div>
        </Card>
      </div>
      
      <div className="flex justify-between mt-8">
        <Button variant="destructive" onClick={handleReset} disabled={resetLoading}>
          {resetLoading ? "Resetting..." : "Reset All Content to Defaults"}
        </Button>
        
        <Button onClick={() => window.open('/', '_blank')}>
          View Website
        </Button>
      </div>
    </div>
  );
} 