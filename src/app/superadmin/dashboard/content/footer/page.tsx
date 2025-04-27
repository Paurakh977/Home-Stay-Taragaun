'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Plus, Trash } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, FieldValues } from "react-hook-form";
import { toast } from "sonner";
import { Separator } from '@/components/ui/separator';

// Define schemas for links
const linkSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  path: z.string().min(1, { message: "Path is required" }),
  order: z.coerce.number().min(0, { message: "Order must be a positive number" })
});

const socialLinkSchema = z.object({
  platform: z.string().min(1, { message: "Platform name is required" }),
  url: z.string().url({ message: "Please enter a valid URL" }),
  icon: z.string().min(1, { message: "Icon name is required" }),
});

// Define contact info schema
const contactInfoSchema = z.object({
  address: z.string().min(5, { message: "Address must be at least 5 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().min(5, { message: "Phone number is required" }),
  workingHours: z.string().min(5, { message: "Working hours are required" }),
});

// Define complete footer schema
const footerSchema = z.object({
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  copyright: z.string().min(1, { message: "Copyright text is required" }),
  contactInfo: contactInfoSchema,
  quickLinks: z.array(linkSchema).min(1, { message: "At least one quick link is required" }),
  hostLinks: z.array(linkSchema).min(1, { message: "At least one host link is required" }),
  policyLinks: z.array(linkSchema).min(1, { message: "At least one policy link is required" }),
  socialLinks: z.array(socialLinkSchema).min(1, { message: "At least one social link is required" }),
});

// Create a type for our form
type FooterFormValues = z.infer<typeof footerSchema>;

export default function FooterEditor() {
  const [content, setContent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // Initialize the form with React Hook Form
  const form = useForm<FooterFormValues>({
    resolver: zodResolver(footerSchema),
    defaultValues: {
      description: "",
      copyright: "",
      contactInfo: {
        address: "",
        email: "",
        phone: "",
        workingHours: "",
      },
      quickLinks: [{ name: "", path: "", order: 1 }],
      hostLinks: [{ name: "", path: "", order: 1 }],
      policyLinks: [{ name: "", path: "", order: 1 }],
      socialLinks: [{ platform: "", url: "", icon: "" }],
    },
  });

  // Setup field arrays for links
  const quickLinksArray = useFieldArray({
    control: form.control,
    name: "quickLinks",
  });

  const hostLinksArray = useFieldArray({
    control: form.control,
    name: "hostLinks",
  });

  const policyLinksArray = useFieldArray({
    control: form.control,
    name: "policyLinks",
  });

  const socialLinksArray = useFieldArray({
    control: form.control,
    name: "socialLinks",
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
        if (data.footer) {
          form.reset({
            description: data.footer.description || "",
            copyright: data.footer.copyright || "",
            contactInfo: {
              address: data.footer.contactInfo?.address || "",
              email: data.footer.contactInfo?.email || "",
              phone: data.footer.contactInfo?.phone || "",
              workingHours: data.footer.contactInfo?.workingHours || "",
            },
            quickLinks: data.footer.quickLinks?.length ? 
              data.footer.quickLinks.map((link: any) => ({
                name: link.name || "",
                path: link.path || "",
                order: Number(link.order) || 0,
              })) : 
              [{ name: "", path: "", order: 1 }],
            hostLinks: data.footer.hostLinks?.length ? 
              data.footer.hostLinks.map((link: any) => ({
                name: link.name || "",
                path: link.path || "",
                order: Number(link.order) || 0,
              })) : 
              [{ name: "", path: "", order: 1 }],
            policyLinks: data.footer.policyLinks?.length ? 
              data.footer.policyLinks.map((link: any) => ({
                name: link.name || "",
                path: link.path || "",
                order: Number(link.order) || 0,
              })) : 
              [{ name: "", path: "", order: 1 }],
            socialLinks: data.footer.socialLinks?.length ? 
              data.footer.socialLinks.map((link: any) => ({
                platform: link.platform || "",
                url: link.url || "",
                icon: link.icon || "",
              })) : 
              [{ platform: "", url: "", icon: "" }],
          });
        }
      } catch (err) {
        console.error('Error fetching content:', err);
        toast.error('Failed to load footer content');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [form]);

  // Handle form submission
  const onSubmit = async (data: FooterFormValues) => {
    try {
      setSaving(true);
      
      // Prepare the footer data
      const footerData = {
        description: data.description,
        copyright: data.copyright,
        contactInfo: data.contactInfo,
        quickLinks: data.quickLinks,
        hostLinks: data.hostLinks,
        policyLinks: data.policyLinks,
        socialLinks: data.socialLinks,
      };
      
      const response = await fetch('/api/web-content?adminUsername=main&section=footer', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(footerData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update footer content');
      }
      
      const updatedContent = await response.json();
      setContent({ ...content, footer: updatedContent });
      toast.success('Footer updated successfully');
    } catch (err) {
      console.error('Error updating content:', err);
      toast.error('Failed to update footer');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading footer content...</div>;
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 w-full justify-start">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="contact">Contact Information</TabsTrigger>
          <TabsTrigger value="links">Navigation Links</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
        </TabsList>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* General Tab */}
            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle>Footer Information</CardTitle>
                  <CardDescription>
                    Edit the main footer content
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Footer Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="About your company..." rows={4} {...field} />
                        </FormControl>
                        <FormDescription>
                          A brief description about your company that will appear in the footer
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="copyright"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Copyright Text</FormLabel>
                        <FormControl>
                          <Input placeholder="© 2023 Nepal StayLink. All rights reserved." {...field} />
                        </FormControl>
                        <FormDescription>
                          Copyright notice text that appears at the bottom of the footer
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Contact Tab */}
            <TabsContent value="contact">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>
                    Edit the contact details shown in the footer
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="contactInfo.address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St, City, Country" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="contactInfo.email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="info@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="contactInfo.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 234 567 890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="contactInfo.workingHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Working Hours</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Monday - Friday: 9:00 AM - 6:00 PM" 
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Add working hours in multiple lines if needed
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Links Tab */}
            <TabsContent value="links">
              <div className="space-y-6">
                {/* Quick Links */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Links</CardTitle>
                    <CardDescription>
                      Main navigation links displayed in the footer
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {quickLinksArray.fields.map((field, index) => (
                      <div key={field.id} className="flex items-start gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                          <FormField
                            control={form.control}
                            name={`quickLinks.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Link Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="About Us" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name={`quickLinks.${index}.path`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>URL Path</FormLabel>
                                <FormControl>
                                  <Input placeholder="/about" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name={`quickLinks.${index}.order`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Display Order</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="1"
                                    placeholder="1" 
                                    {...field}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                    value={field.value}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="mt-8"
                          onClick={() => quickLinksArray.remove(index)}
                          disabled={quickLinksArray.fields.length <= 1}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => quickLinksArray.append({ name: "", path: "", order: quickLinksArray.fields.length + 1 })}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Quick Link
                    </Button>
                  </CardContent>
                </Card>
                
                {/* Host Links */}
                <Card>
                  <CardHeader>
                    <CardTitle>Host Links</CardTitle>
                    <CardDescription>
                      Links for homestay hosts displayed in the footer
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {hostLinksArray.fields.map((field, index) => (
                      <div key={field.id} className="flex items-start gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                          <FormField
                            control={form.control}
                            name={`hostLinks.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Link Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Register Your Homestay" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name={`hostLinks.${index}.path`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>URL Path</FormLabel>
                                <FormControl>
                                  <Input placeholder="/register" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name={`hostLinks.${index}.order`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Display Order</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="1"
                                    placeholder="1" 
                                    {...field}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                    value={field.value}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="mt-8"
                          onClick={() => hostLinksArray.remove(index)}
                          disabled={hostLinksArray.fields.length <= 1}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => hostLinksArray.append({ name: "", path: "", order: hostLinksArray.fields.length + 1 })}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Host Link
                    </Button>
                  </CardContent>
                </Card>
                
                {/* Policy Links */}
                <Card>
                  <CardHeader>
                    <CardTitle>Policy Links</CardTitle>
                    <CardDescription>
                      Policy and legal links displayed at the bottom of the footer
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {policyLinksArray.fields.map((field, index) => (
                      <div key={field.id} className="flex items-start gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                          <FormField
                            control={form.control}
                            name={`policyLinks.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Link Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Privacy Policy" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name={`policyLinks.${index}.path`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>URL Path</FormLabel>
                                <FormControl>
                                  <Input placeholder="/privacy-policy" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name={`policyLinks.${index}.order`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Display Order</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="1"
                                    placeholder="1" 
                                    {...field}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                    value={field.value}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="mt-8"
                          onClick={() => policyLinksArray.remove(index)}
                          disabled={policyLinksArray.fields.length <= 1}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => policyLinksArray.append({ name: "", path: "", order: policyLinksArray.fields.length + 1 })}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Policy Link
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Social Media Tab */}
            <TabsContent value="social">
              <Card>
                <CardHeader>
                  <CardTitle>Social Media Links</CardTitle>
                  <CardDescription>
                    Social media profiles displayed in the footer
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {socialLinksArray.fields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                        <FormField
                          control={form.control}
                          name={`socialLinks.${index}.platform`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Platform Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Facebook" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`socialLinks.${index}.url`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>URL</FormLabel>
                              <FormControl>
                                <Input placeholder="https://facebook.com/yourpage" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`socialLinks.${index}.icon`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Icon Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Facebook" {...field} />
                              </FormControl>
                              <FormDescription>
                                Use icon names like: Facebook, Twitter, Instagram
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="mt-8"
                        onClick={() => socialLinksArray.remove(index)}
                        disabled={socialLinksArray.fields.length <= 1}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => socialLinksArray.append({ platform: "", url: "", icon: "" })}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Social Link
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Footer"}
              </Button>
            </div>
          </form>
        </Form>
      </Tabs>
      
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-md text-amber-700">
        <h3 className="font-medium mb-2">Note:</h3>
        <p className="text-sm">
          This is a simplified editor for footer content. For more advanced editing, including links and contact information,
          please contact your developer to implement the full footer editor.
        </p>
      </div>
    </div>
  );
} 