'use client';

import { useEffect, useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
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
import { Plus, Trash, Upload, Image as ImageIcon } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import Image from "next/image";

// Define the ITestimonial interface
interface ITestimonial {
  name: string;
  location: string;
  quote: string;
  photoPath: string;
}

// Define the IWebContent interface
interface IWebContent {
  testimonials?: ITestimonial[];
  [key: string]: any;
}

// Define validation schema for testimonials
const testimonialSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  location: z.string().min(2, { message: "Location must be at least 2 characters" }),
  quote: z.string().min(10, { message: "Quote must be at least 10 characters" }),
  photoPath: z.string().min(1, { message: "Photo is required" })
});

// Schema for the form
const testimonialsSchema = z.object({
  testimonials: z.array(testimonialSchema).min(1, { message: "At least one testimonial is required" })
});

export default function TestimonialsEditor() {
  const [content, setContent] = useState<IWebContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<number | null>(null);

  // Initialize the form with React Hook Form
  const form = useForm<z.infer<typeof testimonialsSchema>>({
    resolver: zodResolver(testimonialsSchema),
    defaultValues: {
      testimonials: [
        { name: "", location: "", quote: "", photoPath: "" }
      ]
    },
  });

  // Set up field array for testimonials
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "testimonials"
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
        if (data.testimonials && data.testimonials.length > 0) {
          form.reset({ testimonials: data.testimonials });
        }
      } catch (err) {
        console.error('Error fetching content:', err);
        toast.error('Failed to load testimonials');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [form]);

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof testimonialsSchema>) => {
    try {
      setSaving(true);
      const response = await fetch('/api/web-content?adminUsername=main&section=testimonials', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data.testimonials),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update testimonials');
      }
      
      const updatedContent = await response.json();
      setContent({...content, testimonials: data.testimonials});
      toast.success('Testimonials updated successfully');
    } catch (err) {
      console.error('Error updating testimonials:', err);
      toast.error('Failed to update testimonials');
    } finally {
      setSaving(false);
    }
  };
  
  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setUploadingImage(index);
      
      // Create a FormData instance
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'testimonials'); // Specify folder to save in
      
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
      form.setValue(`testimonials.${index}.photoPath`, data.imagePath, { shouldValidate: true });
      toast.success('Image uploaded successfully');
      
    } catch (err) {
      console.error('Error uploading image:', err);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading testimonials...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Testimonials</CardTitle>
          <CardDescription>
            Manage customer testimonials that appear throughout the website
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-6">
                {fields.map((field, index) => (
                  <Card key={field.id} className="border-dashed">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">Testimonial {index + 1}</CardTitle>
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
                      {/* Name */}
                      <FormField
                        control={form.control}
                        name={`testimonials.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter person's name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Location */}
                      <FormField
                        control={form.control}
                        name={`testimonials.${index}.location`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <Input placeholder="E.g., United States" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Quote */}
                      <FormField
                        control={form.control}
                        name={`testimonials.${index}.quote`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Testimonial Quote</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter the testimonial quote" 
                                rows={3}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Photo */}
                      <FormField
                        control={form.control}
                        name={`testimonials.${index}.photoPath`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Person's Photo</FormLabel>
                            <FormControl>
                              <div className="flex flex-col gap-4">
                                <div className="flex gap-2">
                                  <Input placeholder="/path/to/photo.jpg" {...field} />
                                  <div className="relative">
                                    <Input
                                      type="file"
                                      accept="image/*"
                                      className="absolute inset-0 opacity-0 cursor-pointer"
                                      onChange={(e) => handleImageUpload(e, index)}
                                      disabled={uploadingImage !== null}
                                    />
                                    <Button type="button" variant="outline" disabled={uploadingImage !== null}>
                                      <Upload className="h-4 w-4 mr-2" />
                                      {uploadingImage === index ? "Uploading..." : "Upload"}
                                    </Button>
                                  </div>
                                </div>
                                {field.value && (
                                  <div className="relative h-20 w-20 bg-gray-50 border rounded-full overflow-hidden">
                                    <Image
                                      src={field.value}
                                      alt="Person Photo"
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
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => append({ name: "", location: "", quote: "", photoPath: "" })}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Testimonial
                </Button>
              </div>
              
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