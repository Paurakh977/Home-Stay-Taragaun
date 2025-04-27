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

// Define about page interface
interface IAboutPage {
  aboutPage?: any;
  [key: string]: any;
}

export default function AboutPageEditor() {
  const [content, setContent] = useState<IAboutPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingTeamImage, setUploadingTeamImage] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("hero");

  // Initialize the form with React Hook Form
  const form = useForm<z.infer<typeof aboutPageSchema>>({
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
  const teamForm = useForm<z.infer<typeof teamSchema>>({
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
  const onTeamSubmit = async (data: z.infer<typeof teamSchema>) => {
    try {
      setSaving(true);
      
      // Sort members by order
      const sortedMembers = [...data.members].sort((a, b) => a.order - b.order);
      
      // Update the aboutPage.team section
      const response = await fetch('/api/web-content?adminUsername=main&section=aboutPage', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...content?.aboutPage,
          team: {
            title: data.title,
            subtitle: data.subtitle,
            members: sortedMembers
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update team section');
      }
      
      const updatedContent = await response.json();
      setContent({...content, aboutPage: updatedContent});
      toast.success('Team section updated successfully');
    } catch (err) {
      console.error('Error updating team section:', err);
      toast.error('Failed to update team section');
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
        throw new Error('Failed to upload image');
      }
      
      const data = await response.json();
      
      // Set the image path to the form field
      teamForm.setValue(`members.${index}.photoPath`, data.imagePath, { shouldValidate: true });
      toast.success('Image uploaded successfully');
      
    } catch (err) {
      console.error('Error uploading image:', err);
      toast.error('Failed to upload image');
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
          <TabsList className="grid grid-cols-5 mb-6">
            <TabsTrigger value="hero">Hero</TabsTrigger>
            <TabsTrigger value="story">Our Story</TabsTrigger>
            <TabsTrigger value="mission">Mission</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="cta">CTA</TabsTrigger>
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
                  <form onSubmit={teamForm.handleSubmit(onTeamSubmit)} className="space-y-6">
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
                              ...fields.map(field => field.order)
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
                      <Button type="submit" disabled={saving}>
                        {saving ? "Saving..." : "Save Team"}
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
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 