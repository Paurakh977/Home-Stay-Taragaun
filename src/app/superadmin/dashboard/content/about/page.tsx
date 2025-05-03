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
import { Plus, Trash, Upload, Image as ImageIcon, GripVertical } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";

// Define validation schema for values items
const valuesItemSchema = z.object({
  icon: z.string().min(1, { message: "Icon is required" }),
  title: z.string().min(2, { message: "Value title is required" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" })
});

// Define validation schema for offering features
const offeringFeatureSchema = z.object({
  icon: z.string().min(1, { message: "Icon is required" }),
  title: z.string().min(2, { message: "Feature title is required" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" })
});

// Define validation schema for impact stats
const impactStatSchema = z.string().min(5, { message: "Stat must be at least 5 characters" });

// Define the schema for the About page
const aboutPageSchema = z.object({
  hero: z.object({
    title: z.string().min(2, { message: "Title must be at least 2 characters" }),
    subtitle: z.string().min(10, { message: "Subtitle must be at least 10 characters" }),
    backgroundImage: z.string().min(1, { message: "Background image is required" })
  }),
  story: z.object({
    title: z.string().min(2, { message: "Title must be at least 2 characters" }),
    content: z.string().min(20, { message: "Content must be at least 20 characters" }),
    imagePath: z.string().min(1, { message: "Image is required" })
  }),
  values: z.object({
    title: z.string().min(2, { message: "Title must be at least 2 characters" }),
    subtitle: z.string().min(5, { message: "Subtitle must be at least 5 characters" }),
    items: z.array(valuesItemSchema).min(1, { message: "At least one value is required" })
  }),
  offerings: z.object({
    title: z.string().min(2, { message: "Title must be at least 2 characters" }),
    subtitle: z.string().min(5, { message: "Subtitle must be at least 5 characters" }),
    features: z.array(offeringFeatureSchema).min(1, { message: "At least one feature is required" })
  }),
  impact: z.object({
    title: z.string().min(2, { message: "Title must be at least 2 characters" }),
    content: z.string().min(20, { message: "Content must be at least 20 characters" }),
    stats: z.array(impactStatSchema).min(1, { message: "At least one impact stat is required" }),
    imagePath: z.string().min(1, { message: "Image is required" })
  }),
  mission: z.object({
    statement: z.string().min(20, { message: "Mission statement must be at least 20 characters" })
  }),
  cta: z.object({
    title: z.string().min(5, { message: "Title must be at least 5 characters" }),
    subtitle: z.string().min(10, { message: "Subtitle must be at least 10 characters" }),
    primaryButton: z.object({
      text: z.string().min(2, { message: "Button text is required" }),
      link: z.string().min(1, { message: "Button link is required" })
    }),
    secondaryButton: z.object({
      text: z.string().min(2, { message: "Button text is required" }),
      link: z.string().min(1, { message: "Button link is required" })
    })
  })
});

// Define team member schema
const teamMemberSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  position: z.string().min(2, { message: "Position must be at least 2 characters" }),
  photoPath: z.string().min(1, { message: "Photo is required" }),
  order: z.number().min(0, { message: "Order must be a positive number" })
});

// Define team schema
const teamSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters" }),
  subtitle: z.string().min(5, { message: "Subtitle must be at least 5 characters" }),
  members: z.array(teamMemberSchema).min(1, { message: "At least one team member is required" })
});

// Available icon options
const availableIcons = [
  "Heart", "Users", "Shield", "Award", "Sparkles", "GraduationCap"
];

export default function AboutPageEditor() {
  const [content, setContent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingTeamImage, setUploadingTeamImage] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("hero");
  
  // For impact stats, use a simple array state
  const [impactStats, setImpactStats] = useState<string[]>([""]);

  // Initialize the form with React Hook Form
  const form = useForm<any>({
    resolver: zodResolver(aboutPageSchema),
    defaultValues: {
      hero: {
        title: "",
        subtitle: "",
        backgroundImage: ""
      },
      story: {
        title: "",
        content: "",
        imagePath: ""
      },
      values: {
        title: "",
        subtitle: "",
        items: []
      },
      offerings: {
        title: "",
        subtitle: "",
        features: []
      },
      impact: {
        title: "",
        content: "",
        stats: [""],
        imagePath: ""
      },
      mission: {
        statement: ""
      },
      cta: {
        title: "",
        subtitle: "",
        primaryButton: {
          text: "",
          link: ""
        },
        secondaryButton: {
          text: "",
          link: ""
        }
      }
    }
  });

  // Initialize team form
  const teamForm = useForm<any>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      title: "Meet Our Team",
      subtitle: "The passionate individuals behind Nepal StayLink who work tirelessly to connect travelers with authentic Nepali experiences.",
      members: [
        { name: "", position: "", photoPath: "", order: 0 }
      ]
    },
  });

  // Set up field array for team members
  const { fields, append, remove } = useFieldArray({
    control: teamForm.control,
    name: "members"
  });
  
  // Set up field array for values items
  const { 
    fields: valueFields, 
    append: appendValue, 
    remove: removeValue 
  } = useFieldArray({
    control: form.control,
    name: "values.items"
  });
  
  // Set up field array for offerings features
  const { 
    fields: offeringFields, 
    append: appendOffering, 
    remove: removeOffering 
  } = useFieldArray({
    control: form.control,
    name: "offerings.features"
  });

  // Update impact stats when form data changes
  useEffect(() => {
    const stats = form.getValues().impact?.stats;
    if (stats && stats.length > 0) {
      setImpactStats(stats);
    }
  }, [form]);

  // Function to add a new impact stat
  const addImpactStat = () => {
    const newStats = [...impactStats, ""];
    setImpactStats(newStats);
    form.setValue("impact.stats", newStats, { shouldValidate: true });
  };

  // Function to remove an impact stat
  const removeImpactStat = (index: number) => {
    if (impactStats.length <= 1) return;
    
    const newStats = impactStats.filter((_, i) => i !== index);
    setImpactStats(newStats);
    form.setValue("impact.stats", newStats, { shouldValidate: true });
  };

  // Function to update an impact stat
  const updateImpactStat = (index: number, value: string) => {
    const newStats = [...impactStats];
    newStats[index] = value;
    setImpactStats(newStats);
    form.setValue("impact.stats", newStats, { shouldValidate: true });
  };

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
        if (data.aboutPage) {
          form.reset(data.aboutPage);
          
          // Populate team form if team data exists
          if (data.aboutPage.team) {
            const { title, subtitle, members } = data.aboutPage.team;
            
            // Sort members by order
            const sortedMembers = [...members].sort((a, b) => a.order - b.order);
            
            teamForm.reset({ 
              title, 
              subtitle, 
              members: sortedMembers.length > 0 ? sortedMembers : [{ name: "", position: "", photoPath: "", order: 0 }]
            });
          }
        }
      } catch (err) {
        console.error('Error fetching content:', err);
        toast.error('Failed to load about page content');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [form, teamForm]);

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof aboutPageSchema>) => {
    try {
      setSaving(true);
      
      // Ensure we have default items if arrays are empty
      if (!data.values.items || data.values.items.length === 0) {
        data.values.items = [{
          icon: "Heart",
          title: "Authentic Experiences",
          description: "We believe in facilitating genuine cultural exchanges and immersive experiences."
        }];
      }
      
      if (!data.offerings.features || data.offerings.features.length === 0) {
        data.offerings.features = [{
          icon: "Award",
          title: "Verified Homestays",
          description: "Every homestay in our network is personally verified to ensure quality."
        }];
      }
      
      if (!data.impact.stats || data.impact.stats.length === 0) {
        data.impact.stats = ["Over 200 families have gained sustainable income through homestay hosting"];
      }
      
      const response = await fetch('/api/web-content?adminUsername=main&section=aboutPage', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update about page content');
      }
      
      const updatedContent = await response.json();
      setContent(updatedContent);
      toast.success('About page content updated successfully');
    } catch (err) {
      console.error('Error updating content:', err);
      toast.error('Failed to update about page content');
    } finally {
      setSaving(false);
    }
  };
  
  // Handle team form submission
  const handleManualTeamSubmit = async () => {
    try {
      setSaving(true);
      
      // Validate team form data
      const isValid = await teamForm.trigger();
      if (!isValid) {
        toast.error("Please fix the errors in the team form");
        setSaving(false);
        return;
      }
      
      const teamData = teamForm.getValues();
      console.log("Submitting team data:", teamData);
      
      // Sort members by order
      const sortedMembers = [...teamData.members].sort((a, b) => a.order - b.order);
      
      // Get current aboutPage content
      const currentAboutPage = content?.aboutPage || {};
      console.log("Current aboutPage content:", currentAboutPage);
      
      // Send direct request to update team section
      const response = await fetch('/api/web-content?adminUsername=main&section=aboutPage', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...currentAboutPage,
          team: {
            title: teamData.title,
            subtitle: teamData.subtitle,
            members: sortedMembers
          }
        }),
      });
      
      const responseText = await response.text();
      console.log("Server response text:", responseText);
      
      if (!response.ok) {
        throw new Error(`Failed to update team section: ${response.status} ${response.statusText} - ${responseText}`);
      }
      
      try {
        // Try to parse the response as JSON
        const updatedContent = JSON.parse(responseText);
        console.log('Team update successful, parsed response:', updatedContent);
        setContent({...content, aboutPage: updatedContent});
        toast.success('Team section updated successfully');
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        // Even though we couldn't parse the response, the update may have succeeded
        toast.success('Team section likely updated, but please refresh the page to see changes');
      }
    } catch (err) {
      console.error('Error updating team section:', err);
      toast.error(`Failed to update team section: ${err instanceof Error ? err.message : String(err)}`);
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
      formData.append('folder', 'about'); // Specify folder to save in
      
      // Use fetch to upload the image
      const response = await fetch('/api/superadmin/uploads/image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Image upload failed:', errorData);
        throw new Error(`Failed to upload image: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data || !data.imagePath) {
        throw new Error('Invalid response format from image upload API');
      }
      
      console.log('Image uploaded successfully:', data.imagePath);
      
      // Set the image path to the form field
      form.setValue(fieldName as any, data.imagePath, { shouldValidate: true });
      toast.success('Image uploaded successfully');
      
    } catch (err) {
      console.error('Error uploading image:', err);
      toast.error(`Failed to upload image: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUploadingImage(false);
    }
  };

  // Team image upload handler
  const handleTeamImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setUploadingTeamImage(index);
      
      // Create a FormData instance
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'team'); // Specify folder to save in
      
      // Use fetch to upload the image
      const response = await fetch('/api/superadmin/uploads/image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Team image upload failed:', errorData);
        throw new Error(`Failed to upload team member image: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data || !data.imagePath) {
        throw new Error('Invalid response format from image upload API');
      }
      
      console.log('Team image uploaded successfully:', data.imagePath);
      
      // Set the image path to the form field
      teamForm.setValue(`members.${index}.photoPath`, data.imagePath, { shouldValidate: true });
      toast.success('Team member image uploaded successfully');
      
    } catch (err) {
      console.error('Error uploading team image:', err);
      toast.error(`Failed to upload team image: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUploadingTeamImage(null);
    }
  };

  // Handle reordering
  const handleReorder = (index: number, newOrder: number) => {
    teamForm.setValue(`members.${index}.order`, newOrder, { shouldValidate: true });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading about page content...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="hero" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap gap-2 mb-6">
            <TabsTrigger value="hero" className="px-3 py-1.5 text-sm">Hero</TabsTrigger>
            <TabsTrigger value="story" className="px-3 py-1.5 text-sm">Story</TabsTrigger>
            <TabsTrigger value="values" className="px-3 py-1.5 text-sm">Values</TabsTrigger>
            <TabsTrigger value="offerings" className="px-3 py-1.5 text-sm">Offerings</TabsTrigger>
            <TabsTrigger value="impact" className="px-3 py-1.5 text-sm">Impact</TabsTrigger>
            <TabsTrigger value="mission" className="px-3 py-1.5 text-sm">Mission</TabsTrigger>
            <TabsTrigger value="team" className="px-3 py-1.5 text-sm">Team</TabsTrigger>
            <TabsTrigger value="cta" className="px-3 py-1.5 text-sm">CTA</TabsTrigger>
          </TabsList>
          
          {/* Hero Section */}
          <TabsContent value="hero" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Hero Section</CardTitle>
                <CardDescription>
                  Edit the hero section at the top of the about page
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
                        <Input placeholder="About Us" {...field} />
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
                          placeholder="Learn about our mission and vision" 
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
          
          {/* Story Section */}
          <TabsContent value="story" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Our Story</CardTitle>
                <CardDescription>
                  Share your company's journey and history
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="story.title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Our Story" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="story.content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Story Content</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Nepal StayLink was born from a passion for authentic travel experiences..." 
                          rows={8}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="story.imagePath"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Story Image</FormLabel>
                      <FormControl>
                        <div className="flex flex-col gap-4">
                          <div className="flex gap-2">
                            <Input placeholder="/path/to/image.jpg" {...field} />
                            <div className="relative">
                              <Input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => handleImageUpload(e, 'story.imagePath')}
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
                                alt="Story Image Preview"
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
          
          {/* Values Section */}
          <TabsContent value="values" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Values</CardTitle>
                <CardDescription>
                  Define your company's core values
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="values.title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Our Values" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="values.subtitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subtitle</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Our core values guide our actions and decisions" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Value Items</h3>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        appendValue({ 
                          icon: "Heart", 
                          title: "", 
                          description: ""
                        });
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Value Item
                    </Button>
                  </div>
                  
                  {valueFields.map((field, index) => (
                    <Card key={field.id} className="border-dashed">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg">Item {index + 1}</CardTitle>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="icon" 
                            onClick={() => removeValue(index)}
                            disabled={valueFields.length === 1}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Icon */}
                          <FormField
                            control={form.control}
                            name={`values.items.${index}.icon`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Icon</FormLabel>
                                <FormControl>
                                  <Input placeholder="Heart" {...field} />
                                </FormControl>
                                <FormDescription>
                                  Available icons: {availableIcons.join(", ")}
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {/* Title */}
                          <FormField
                            control={form.control}
                            name={`values.items.${index}.title`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                  <Input placeholder="Authenticity" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        {/* Description */}
                        <FormField
                          control={form.control}
                          name={`values.items.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="We prioritize authentic travel experiences" 
                                  {...field} 
                                />
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
          </TabsContent>
          
          {/* Offerings Section */}
          <TabsContent value="offerings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Offerings</CardTitle>
                <CardDescription>
                  Describe your company's offerings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="offerings.title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Our Offerings" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="offerings.subtitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subtitle</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="We offer a range of services to meet your travel needs" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Features</h3>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        appendOffering({ 
                          icon: "Award", 
                          title: "", 
                          description: ""
                        });
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Feature
                    </Button>
                  </div>
                  
                  {offeringFields.map((field, index) => (
                    <Card key={field.id} className="border-dashed">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg">Feature {index + 1}</CardTitle>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="icon" 
                            onClick={() => removeOffering(index)}
                            disabled={offeringFields.length === 1}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Icon */}
                          <FormField
                            control={form.control}
                            name={`offerings.features.${index}.icon`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Icon</FormLabel>
                                <FormControl>
                                  <Input placeholder="Award" {...field} />
                                </FormControl>
                                <FormDescription>
                                  Available icons: {availableIcons.join(", ")}
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {/* Title */}
                          <FormField
                            control={form.control}
                            name={`offerings.features.${index}.title`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                  <Input placeholder="Verified Homestays" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        {/* Description */}
                        <FormField
                          control={form.control}
                          name={`offerings.features.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Every homestay in our network is personally verified to ensure quality." 
                                  {...field} 
                                />
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
          </TabsContent>
          
          {/* Impact Section */}
          <TabsContent value="impact" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Impact</CardTitle>
                <CardDescription>
                  Describe the impact of your company's work
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="impact.title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Our Impact" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="impact.content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Impact Content</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="We have connected thousands of travelers with authentic Nepali experiences..." 
                          rows={8}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Impact Stats</h3>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addImpactStat}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Stat
                    </Button>
                  </div>
                  
                  {impactStats.map((stat, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="Over 1000 travelers connected with homestays"
                            value={stat}
                            onChange={(e) => updateImpactStat(index, e.target.value)}
                          />
                        </FormControl>
                        <FormMessage>
                          {typeof form.formState.errors?.impact === 'object' && 
                           form.formState.errors.impact && 
                           Array.isArray((form.formState.errors.impact as any).stats) ? 
                           (form.formState.errors.impact as any).stats[index]?.message : ''}
                        </FormMessage>
                      </FormItem>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon" 
                        onClick={() => removeImpactStat(index)}
                        disabled={impactStats.length <= 1}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                <FormField
                  control={form.control}
                  name="impact.imagePath"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Impact Image</FormLabel>
                      <FormControl>
                        <div className="flex flex-col gap-4">
                          <div className="flex gap-2">
                            <Input placeholder="/path/to/image.jpg" {...field} />
                            <div className="relative">
                              <Input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => handleImageUpload(e, 'impact.imagePath')}
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
                                alt="Impact Image Preview"
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
          
          {/* Mission Section */}
          <TabsContent value="mission" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Mission Statement</CardTitle>
                <CardDescription>
                  Define your company's purpose and goals
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="mission.statement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mission Statement</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="To connect travelers with authentic Nepali experiences..." 
                          rows={4}
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        A concise statement describing your organization's purpose
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Team Section */}
          <TabsContent value="team" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  Manage your team section with team members, roles, and photos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...teamForm}>
                  <form onSubmit={teamForm.handleSubmit(handleManualTeamSubmit)} className="space-y-6">
                    {/* Team Section Title and Subtitle */}
                    <div className="space-y-4">
                      <FormField
                        control={teamForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Section Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Meet Our Team" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={teamForm.control}
                        name="subtitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Section Subtitle</FormLabel>
                            <FormControl>
                              <Input placeholder="The passionate individuals behind Nepal StayLink" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Team Members</h3>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const highestOrder = Math.max(
                              0, 
                              ...fields.map(field => (field as any).order || 0)
                            );
                            append({ 
                              name: "", 
                              position: "", 
                              photoPath: "", 
                              order: highestOrder + 1 
                            });
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" /> Add Team Member
                        </Button>
                      </div>
                      
                      {fields.map((field, index) => (
                        <Card key={field.id} className="border-dashed">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-lg">Member {index + 1}</CardTitle>
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="icon" 
                                onClick={() => remove(index)}
                                disabled={fields.length === 1}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Name */}
                              <FormField
                                control={teamForm.control}
                                name={`members.${index}.name`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                      <Input placeholder="John Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              {/* Position */}
                              <FormField
                                control={teamForm.control}
                                name={`members.${index}.position`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Position</FormLabel>
                                    <FormControl>
                                      <Input placeholder="CEO" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Order */}
                              <FormField
                                control={teamForm.control}
                                name={`members.${index}.order`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Display Order</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        min="0" 
                                        placeholder="1" 
                                        {...field}
                                        onChange={(e) => {
                                          const value = parseInt(e.target.value);
                                          field.onChange(value);
                                          handleReorder(index, value);
                                        }}
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      Lower numbers appear first
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            {/* Photo */}
                            <FormField
                              control={teamForm.control}
                              name={`members.${index}.photoPath`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Photo</FormLabel>
                                  <FormControl>
                                    <div className="flex flex-col gap-4">
                                      <div className="flex gap-2">
                                        <Input placeholder="/path/to/photo.jpg" {...field} />
                                        <div className="relative">
                                          <Input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={(e) => handleTeamImageUpload(e, index)}
                                            disabled={uploadingTeamImage !== null}
                                          />
                                          <Button type="button" variant="outline" disabled={uploadingTeamImage !== null}>
                                            <Upload className="h-4 w-4 mr-2" />
                                            {uploadingTeamImage === index ? "Uploading..." : "Upload"}
                                          </Button>
                                        </div>
                                      </div>
                                      {field.value && (
                                        <div className="relative h-36 w-36 bg-gray-50 border rounded-full overflow-hidden">
                                          <Image
                                            src={field.value}
                                            alt="Team Member Photo"
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
                    
                    {/* Submit Button */}
                    <div className="flex justify-end">
                      <Button 
                        type="button" 
                        onClick={handleManualTeamSubmit}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={saving}
                      >
                        {saving ? "Saving..." : "Save Team Section"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* CTA Section */}
          <TabsContent value="cta" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Call to Action</CardTitle>
                <CardDescription>
                  Encourage visitors to take action
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="cta.title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Join the Nepal StayLink Community" {...field} />
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
                        <Textarea 
                          placeholder="Whether you're a traveler seeking authentic experiences or a homeowner..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Primary Button */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-md p-4">
                  <FormField
                    control={form.control}
                    name="cta.primaryButton.text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Button Text</FormLabel>
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
                        <FormLabel>Primary Button Link</FormLabel>
                        <FormControl>
                          <Input placeholder="/homestays" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Secondary Button */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-md p-4">
                  <FormField
                    control={form.control}
                    name="cta.secondaryButton.text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Secondary Button Text</FormLabel>
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
                        <FormLabel>Secondary Button Link</FormLabel>
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
          </TabsContent>
        </Tabs>
        
        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={saving} size="lg" className="px-8">
            {saving ? "Saving..." : "Save All Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 