'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
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
import { Plus, Trash, Upload, Image as ImageIcon } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import Image from "next/image";

// Define the IWebContent interface
interface IWebContent {
  homePage?: any;
  [key: string]: any;
}

// Define the validation schema for the form
const heroSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  subtitle: z.string().min(10, { message: "Subtitle must be at least 10 characters" }),
  backgroundImage: z.string().min(1, { message: "Background image is required" }),
  searchPlaceholder: z.string().min(3, { message: "Search placeholder is required" }),
});

const statSchema = z.object({
  value: z.string().min(1, { message: "Value is required" }),
  label: z.string().min(1, { message: "Label is required" }),
});

const stepSchema = z.object({
  icon: z.string().min(1, { message: "Icon is required" }),
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  linkText: z.string().min(1, { message: "Link text is required" }),
  linkUrl: z.string().min(1, { message: "Link URL is required" }),
});

const destinationSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  imagePath: z.string().min(1, { message: "Image path is required" }),
  homestayCount: z.number().min(0, { message: "Count must be a positive number" }),
});

const featureSchema = z.object({
  icon: z.string().min(1, { message: "Icon is required" }),
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
});

const buttonSchema = z.object({
  text: z.string().min(1, { message: "Button text is required" }),
  link: z.string().min(1, { message: "Button link is required" }),
});

const homePageSchema = z.object({
  hero: heroSchema,
  stats: z.array(statSchema).min(1, { message: "At least one stat is required" }),
  howItWorks: z.object({
    title: z.string().min(1, { message: "Title is required" }),
    subtitle: z.string().min(10, { message: "Subtitle must be at least 10 characters" }),
    steps: z.array(stepSchema).min(1, { message: "At least one step is required" }),
  }),
  destinations: z.object({
    title: z.string().min(1, { message: "Title is required" }),
    subtitle: z.string().min(10, { message: "Subtitle must be at least 10 characters" }),
    items: z.array(destinationSchema).min(1, { message: "At least one destination is required" }),
    viewAllLink: z.string().min(1, { message: "View all link is required" }),
  }),
  join: z.object({
    title: z.string().min(1, { message: "Title is required" }),
    description: z.string().min(10, { message: "Description must be at least 10 characters" }),
    features: z.array(featureSchema).min(1, { message: "At least one feature is required" }),
    backgroundImage: z.string().min(1, { message: "Background image is required" }),
  }),
  cta: z.object({
    title: z.string().min(1, { message: "Title is required" }),
    subtitle: z.string().min(10, { message: "Subtitle must be at least 10 characters" }),
    backgroundImage: z.string().min(1, { message: "Background image is required" }),
    primaryButton: buttonSchema,
    secondaryButton: buttonSchema,
  }),
});

export default function HomePageEditor() {
  const [content, setContent] = useState<IWebContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  
  // Initialize the form with React Hook Form
  const form = useForm<z.infer<typeof homePageSchema>>({
    resolver: zodResolver(homePageSchema),
    defaultValues: {
      hero: {
        title: "",
        subtitle: "",
        backgroundImage: "",
        searchPlaceholder: "",
      },
      stats: [{ value: "", label: "" }],
      howItWorks: {
        title: "",
        subtitle: "",
        steps: [{ icon: "", title: "", description: "", linkText: "", linkUrl: "" }],
      },
      destinations: {
        title: "",
        subtitle: "",
        items: [{ name: "", imagePath: "", homestayCount: 0 }],
        viewAllLink: "",
      },
      join: {
        title: "",
        description: "",
        features: [{ icon: "", title: "", description: "" }],
        backgroundImage: "",
      },
      cta: {
        title: "",
        subtitle: "",
        backgroundImage: "",
        primaryButton: { text: "", link: "" },
        secondaryButton: { text: "", link: "" },
      },
    },
  });
  
  // Setup field arrays for dynamic content sections
  const statsArray = useFieldArray({
    control: form.control,
    name: "stats",
  });
  
  const stepsArray = useFieldArray({
    control: form.control,
    name: "howItWorks.steps",
  });
  
  const destinationsArray = useFieldArray({
    control: form.control,
    name: "destinations.items",
  });
  
  const featuresArray = useFieldArray({
    control: form.control,
    name: "join.features",
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
        if (data.homePage) {
          form.reset(data.homePage);
        }
      } catch (err) {
        console.error('Error fetching content:', err);
        toast.error('Failed to load home page content');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [form]);

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof homePageSchema>) => {
    try {
      setSaving(true);
      const response = await fetch('/api/web-content?adminUsername=main&section=homePage', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update home page content');
      }
      
      const updatedContent = await response.json();
      setContent(updatedContent);
      toast.success('Home page content updated successfully');
    } catch (err) {
      console.error('Error updating content:', err);
      toast.error('Failed to update home page content');
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
      formData.append('folder', 'home'); // Specify folder to save in
      
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
    return <div className="flex items-center justify-center h-64">Loading home page content...</div>;
  }

  return (
    <Tabs defaultValue="hero">
      <div className="mb-4">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="how">How It Works</TabsTrigger>
          <TabsTrigger value="destinations">Destinations</TabsTrigger>
          <TabsTrigger value="join">Join Network</TabsTrigger>
          <TabsTrigger value="cta">CTA</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="hero" className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Hero Section</CardTitle>
                <CardDescription>
                  Edit the main homepage banner section content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Hero Title */}
                <FormField
                  control={form.control}
                  name="hero.title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter hero title" {...field} />
                      </FormControl>
                      <FormDescription>
                        Main heading displayed on the hero section
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Hero Subtitle */}
                <FormField
                  control={form.control}
                  name="hero.subtitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subtitle</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter hero subtitle" {...field} />
                      </FormControl>
                      <FormDescription>
                        Subheading text shown below the main title
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Hero Background Image */}
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
                      <FormDescription>
                        Background image for the hero section
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Search Placeholder */}
                <FormField
                  control={form.control}
                  name="hero.searchPlaceholder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Search Placeholder</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter search placeholder text" {...field} />
                      </FormControl>
                      <FormDescription>
                        Placeholder text shown in the search box
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </TabsContent>
      
      {/* Stats Section */}
      <TabsContent value="stats" className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Stats</CardTitle>
                <CardDescription>
                  Key statistics displayed on the homepage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {statsArray.fields.map((field, index) => (
                  <div key={field.id} className="flex gap-4 items-start">
                    <div className="flex-1 space-y-4">
                      <FormField
                        control={form.control}
                        name={`stats.${index}.value`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Value</FormLabel>
                            <FormControl>
                              <Input placeholder="200+" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`stats.${index}.label`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Label</FormLabel>
                            <FormControl>
                              <Input placeholder="Homestays" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => statsArray.remove(index)}
                      disabled={statsArray.fields.length === 1}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => statsArray.append({ value: "", label: "" })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Stat
                </Button>
              </CardContent>
            </Card>
            
            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </TabsContent>
      
      {/* "How It Works" section will be added next */}
      <TabsContent value="how" className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>How It Works Section</CardTitle>
                <CardDescription>
                  Explain the process of using your platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Section Title & Subtitle */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="howItWorks.title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Section Title</FormLabel>
                        <FormControl>
                          <Input placeholder="How It Works" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="howItWorks.subtitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Section Subtitle</FormLabel>
                        <FormControl>
                          <Input placeholder="A simple process..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Steps */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Process Steps</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => stepsArray.append({ 
                        icon: "", 
                        title: "", 
                        description: "", 
                        linkText: "", 
                        linkUrl: "" 
                      })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Step
                    </Button>
                  </div>
                  
                  {stepsArray.fields.map((field, index) => (
                    <Card key={field.id} className="border-dashed">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <h4 className="text-md font-medium">Step {index + 1}</h4>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => stepsArray.remove(index)}
                            disabled={stepsArray.fields.length === 1}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`howItWorks.steps.${index}.icon`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Icon Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Search, HomeIcon, Star, etc." {...field} />
                                </FormControl>
                                <FormDescription>
                                  Use icon names like Search, HomeIcon, Star, Users, Shield
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name={`howItWorks.steps.${index}.title`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                  <Input placeholder="Find Your Stay" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name={`howItWorks.steps.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Browse our curated selection..." rows={2} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`howItWorks.steps.${index}.linkText`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Link Text</FormLabel>
                                <FormControl>
                                  <Input placeholder="Explore Homestays" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name={`howItWorks.steps.${index}.linkUrl`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Link URL</FormLabel>
                                <FormControl>
                                  <Input placeholder="/homestays" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </TabsContent>
      
      {/* Add other sections next */}
      <TabsContent value="destinations" className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Destinations Section</CardTitle>
                <CardDescription>
                  Featured homestay destinations on the homepage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Section Title & Subtitle */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="destinations.title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Section Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Popular Destinations" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="destinations.subtitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Section Subtitle</FormLabel>
                        <FormControl>
                          <Input placeholder="Discover our most sought-after locations" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="destinations.viewAllLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>View All Link URL</FormLabel>
                      <FormControl>
                        <Input placeholder="/homestays" {...field} />
                      </FormControl>
                      <FormDescription>
                        URL for the "View All" button
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Destination Items */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Destinations</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => destinationsArray.append({ 
                        name: "", 
                        imagePath: "", 
                        homestayCount: 0 
                      })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Destination
                    </Button>
                  </div>
                  
                  {destinationsArray.fields.map((field, index) => (
                    <Card key={field.id} className="border-dashed">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <h4 className="text-md font-medium">Destination {index + 1}</h4>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => destinationsArray.remove(index)}
                            disabled={destinationsArray.fields.length === 1}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`destinations.items.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Pokhara" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name={`destinations.items.${index}.homestayCount`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Homestay Count</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="32" 
                                    {...field} 
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name={`destinations.items.${index}.imagePath`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Destination Image</FormLabel>
                              <FormControl>
                                <div className="flex flex-col gap-4">
                                  <div className="flex gap-2">
                                    <Input placeholder="/path/to/image.jpg" {...field} />
                                    <div className="relative">
                                      <Input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => handleImageUpload(e, `destinations.items.${index}.imagePath`)}
                                        disabled={uploadingImage}
                                      />
                                      <Button type="button" variant="outline" disabled={uploadingImage}>
                                        <Upload className="h-4 w-4 mr-2" />
                                        Upload
                                      </Button>
                                    </div>
                                  </div>
                                  {field.value && (
                                    <div className="relative h-32 w-full rounded-md overflow-hidden border">
                                      <Image
                                        src={field.value}
                                        alt="Destination Preview"
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
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </TabsContent>
      
      {/* Add remaining sections here */}
      <TabsContent value="join" className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Join Network Section</CardTitle>
                <CardDescription>
                  Section for encouraging homestay owners to join your platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Title & Description */}
                <FormField
                  control={form.control}
                  name="join.title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Join Our Network of Homestays" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="join.description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Connect with travelers from around the world..." 
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Background Image */}
                <FormField
                  control={form.control}
                  name="join.backgroundImage"
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
                                onChange={(e) => handleImageUpload(e, 'join.backgroundImage')}
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
                
                {/* Features */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Features</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => featuresArray.append({ 
                        icon: "", 
                        title: "", 
                        description: "" 
                      })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Feature
                    </Button>
                  </div>
                  
                  {featuresArray.fields.map((field, index) => (
                    <Card key={field.id} className="border-dashed">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <h4 className="text-md font-medium">Feature {index + 1}</h4>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => featuresArray.remove(index)}
                            disabled={featuresArray.fields.length === 1}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`join.features.${index}.icon`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Icon Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Shield, Award, etc." {...field} />
                                </FormControl>
                                <FormDescription>
                                  Use icon names like Shield, Award, Star, Users
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name={`join.features.${index}.title`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                  <Input placeholder="Free Registration" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name={`join.features.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Input placeholder="Easy setup process with no upfront costs" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </TabsContent>
      
      {/* CTA Section */}
      <TabsContent value="cta" className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Call to Action Section</CardTitle>
                <CardDescription>
                  Final section that encourages visitors to take action
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Title & Subtitle */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cta.title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Ready to Experience Authentic Nepal?" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="cta.subtitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subtitle</FormLabel>
                        <FormControl>
                          <Input placeholder="Start your journey today..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Background Image */}
                <FormField
                  control={form.control}
                  name="cta.backgroundImage"
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
                                onChange={(e) => handleImageUpload(e, 'cta.backgroundImage')}
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
                
                {/* Primary Button */}
                <Card className="border-dashed">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md">Primary Button</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="cta.primaryButton.text"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Button Text</FormLabel>
                            <FormControl>
                              <Input placeholder="Find Homestays" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="cta.primaryButton.link"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Button Link</FormLabel>
                            <FormControl>
                              <Input placeholder="/homestays" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                {/* Secondary Button */}
                <Card className="border-dashed">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md">Secondary Button</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="cta.secondaryButton.text"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Button Text</FormLabel>
                            <FormControl>
                              <Input placeholder="List Your Property" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="cta.secondaryButton.link"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Button Link</FormLabel>
                            <FormControl>
                              <Input placeholder="/register" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
            
            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </TabsContent>
    </Tabs>
  );
} 