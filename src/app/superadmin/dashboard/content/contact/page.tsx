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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Plus, Trash, Upload } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import Image from "next/image";

// Define the schema for the Contact page
const contactPageSchema = z.object({
  hero: z.object({
    title: z.string().min(2, { message: "Title must be at least 2 characters" }),
    subtitle: z.string().min(10, { message: "Subtitle must be at least 10 characters" }),
    backgroundImage: z.string().min(1, { message: "Background image is required" })
  }),
  form: z.object({
    title: z.string().min(2, { message: "Title must be at least 2 characters" }),
    nameLabel: z.string().min(2, { message: "Name label is required" }),
    emailLabel: z.string().min(2, { message: "Email label is required" }),
    subjectLabel: z.string().min(2, { message: "Subject label is required" }),
    messageLabel: z.string().min(2, { message: "Message label is required" }),
    submitButtonText: z.string().min(2, { message: "Submit button text is required" }),
    subjects: z.array(z.string().min(1, { message: "Subject cannot be empty" }))
  }),
  info: z.object({
    title: z.string().min(2, { message: "Title must be at least 2 characters" }),
    location: z.object({
      title: z.string().min(2, { message: "Location title is required" }),
      address: z.string().min(5, { message: "Address is required" })
    }),
    email: z.object({
      title: z.string().min(2, { message: "Email title is required" }),
      general: z.string().email({ message: "Must be a valid email" }),
      support: z.string().email({ message: "Must be a valid email" })
    }),
    phone: z.object({
      title: z.string().min(2, { message: "Phone title is required" }),
      office: z.string().min(5, { message: "Office phone is required" }),
      support: z.string().min(5, { message: "Support phone is required" })
    }),
    hours: z.object({
      title: z.string().min(2, { message: "Hours title is required" }),
      schedule: z.string().min(5, { message: "Schedule is required" })
    })
  }),
  map: z.object({
    imagePath: z.string().min(1, { message: "Map image is required" }),
    markerText: z.string().min(2, { message: "Marker text is required" })
  })
});

// Define contact page interface
interface IContactPage {
  hero: {
    title: string;
    subtitle: string;
    backgroundImage: string;
  };
  form: {
    title: string;
    nameLabel: string;
    emailLabel: string;
    subjectLabel: string;
    messageLabel: string;
    submitButtonText: string;
    subjects: string[];
  };
  info: {
    title: string;
    location: {
      title: string;
      address: string;
    };
    email: {
      title: string;
      general: string;
      support: string;
    };
    phone: {
      title: string;
      office: string;
      support: string;
    };
    hours: {
      title: string;
      schedule: string;
    };
  };
  map: {
    imagePath: string;
    markerText: string;
  };
}

// Explicitly type the form
type ContactPageFormValues = z.infer<typeof contactPageSchema>;
type PathsToArrays = "form.subjects";

export default function ContactPageEditor() {
  const [content, setContent] = useState<{contactPage?: IContactPage} | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState("hero");

  // Initialize the form with React Hook Form
  const form = useForm<ContactPageFormValues>({
    resolver: zodResolver(contactPageSchema),
    defaultValues: {
      hero: {
        title: "",
        subtitle: "",
        backgroundImage: ""
      },
      form: {
        title: "",
        nameLabel: "",
        emailLabel: "",
        subjectLabel: "",
        messageLabel: "",
        submitButtonText: "",
        subjects: [""]
      },
      info: {
        title: "",
        location: {
          title: "",
          address: ""
        },
        email: {
          title: "",
          general: "",
          support: ""
        },
        phone: {
          title: "",
          office: "",
          support: ""
        },
        hours: {
          title: "",
          schedule: ""
        }
      },
      map: {
        imagePath: "",
        markerText: ""
      }
    }
  });

  // Set up field array for form subjects
  const subjectsArray = useFieldArray({
    control: form.control,
    name: "form.subjects" as PathsToArrays
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
        
        // Populate form with fetched data if available
        if (data.contactPage) {
          form.reset(data.contactPage);
        }
      } catch (err) {
        console.error('Error fetching content:', err);
        toast.error('Failed to load contact page content');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [form]);

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof contactPageSchema>) => {
    try {
      setSaving(true);
      const response = await fetch('/api/web-content?adminUsername=main&section=contactPage', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update contact page content');
      }
      
      const updatedContent = await response.json();
      setContent({...content, contactPage: data});
      toast.success('Contact page content updated successfully');
    } catch (err) {
      console.error('Error updating content:', err);
      toast.error('Failed to update contact page content');
    } finally {
      setSaving(false);
    }
  };
  
  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setUploadingImage(true);
      
      // Create a FormData instance
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'contact'); // Specify folder to save in
      
      // Use fetch to upload the image
      const response = await fetch('/api/superadmin/uploads/image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const data = await response.json();
      
      // Set the image path to the form field
      form.setValue(fieldName as any, data.imagePath, { shouldValidate: true });
      toast.success('Image uploaded successfully');
      
    } catch (err) {
      console.error('Error uploading image:', err);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading contact page content...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="hero" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="hero">Hero</TabsTrigger>
            <TabsTrigger value="form">Form</TabsTrigger>
            <TabsTrigger value="info">Information</TabsTrigger>
            <TabsTrigger value="map">Map</TabsTrigger>
          </TabsList>
          
          {/* Hero Section */}
          <TabsContent value="hero" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Hero Section</CardTitle>
                <CardDescription>
                  Edit the hero section at the top of the contact page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="hero.title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Contact Us" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="hero.subtitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subtitle</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Have questions or feedback? We'd love to hear from you." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="hero.backgroundImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Background Image</FormLabel>
                      <FormControl>
                        <div className="flex flex-col gap-4">
                          <div className="flex gap-2">
                            <Input placeholder="/path/to/image.jpg" {...field} />
                            <div className="relative">
                              <Input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => handleImageUpload(e, 'hero.backgroundImage')}
                                disabled={uploadingImage}
                              />
                              <Button type="button" variant="outline" disabled={uploadingImage}>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload
                              </Button>
                            </div>
                          </div>
                          {field.value && (
                            <div className="relative h-40 w-full rounded-md overflow-hidden border">
                              <Image
                                src={field.value}
                                alt="Background Preview"
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Form Section */}
          <TabsContent value="form" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Contact Form</CardTitle>
                <CardDescription>
                  Customize the contact form fields and options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="form.title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Form Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Send Us a Message" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="form.nameLabel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name Field Label</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Name *" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="form.emailLabel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Field Label</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Email *" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="form.subjectLabel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject Field Label</FormLabel>
                        <FormControl>
                          <Input placeholder="Subject *" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="form.messageLabel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message Field Label</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Message *" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="form.submitButtonText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Submit Button Text</FormLabel>
                      <FormControl>
                        <Input placeholder="Send Message" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <FormLabel>Subject Options</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => subjectsArray.append("")}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Subject
                    </Button>
                  </div>
                  
                  {subjectsArray.fields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-2">
                      <FormField
                        control={form.control}
                        name={`form.subjects.${index}`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input 
                                placeholder="Enter subject option" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => subjectsArray.remove(index)}
                        disabled={subjectsArray.fields.length <= 1}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Info Section */}
          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>
                  Edit contact details displayed on the contact page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="info.title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Get In Touch" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Location */}
                <div className="space-y-4 border rounded-md p-4">
                  <h3 className="text-sm font-medium">Location Information</h3>
                  
                  <FormField
                    control={form.control}
                    name="info.location.title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Our Location" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="info.location.address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Thamel, Kathmandu 44600, Nepal" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Email */}
                <div className="space-y-4 border rounded-md p-4">
                  <h3 className="text-sm font-medium">Email Information</h3>
                  
                  <FormField
                    control={form.control}
                    name="info.email.title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Email Us" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="info.email.general"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>General Email</FormLabel>
                          <FormControl>
                            <Input placeholder="info@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="info.email.support"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Support Email</FormLabel>
                          <FormControl>
                            <Input placeholder="support@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                {/* Phone */}
                <div className="space-y-4 border rounded-md p-4">
                  <h3 className="text-sm font-medium">Phone Information</h3>
                  
                  <FormField
                    control={form.control}
                    name="info.phone.title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Call Us" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="info.phone.office"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Office Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+977 1 4123456" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="info.phone.support"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Support Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+977 1 4123457" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                {/* Working Hours */}
                <div className="space-y-4 border rounded-md p-4">
                  <h3 className="text-sm font-medium">Working Hours</h3>
                  
                  <FormField
                    control={form.control}
                    name="info.hours.title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hours Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Working Hours" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="info.hours.schedule"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Schedule</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Monday - Friday: 9:00 AM - 6:00 PM&#10;Saturday: 10:00 AM - 4:00 PM&#10;Sunday: Closed" 
                            rows={4}
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Use new lines to separate days
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Map Section */}
          <TabsContent value="map" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Map Section</CardTitle>
                <CardDescription>
                  Edit the map section of the contact page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="map.imagePath"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Map Image</FormLabel>
                      <FormControl>
                        <div className="flex flex-col gap-4">
                          <div className="flex gap-2">
                            <Input placeholder="/path/to/map.jpg" {...field} />
                            <div className="relative">
                              <Input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => handleImageUpload(e, 'map.imagePath')}
                                disabled={uploadingImage}
                              />
                              <Button type="button" variant="outline" disabled={uploadingImage}>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload
                              </Button>
                            </div>
                          </div>
                          {field.value && (
                            <div className="relative h-40 w-full rounded-md overflow-hidden border">
                              <Image
                                src={field.value}
                                alt="Map Preview"
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="map.markerText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Map Marker Text</FormLabel>
                      <FormControl>
                        <Input placeholder="Nepal StayLink Headquarters" {...field} />
                      </FormControl>
                      <FormDescription>
                        Text that appears on the map marker
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 