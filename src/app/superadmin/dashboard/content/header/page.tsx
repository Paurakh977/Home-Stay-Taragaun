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
import { Plus, Trash, GripVertical } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";

// Define validation schema
const navLinkSchema = z.object({
  name: z.string().min(1, { message: "Link name is required" }),
  path: z.string().min(1, { message: "Path is required" }),
  order: z.number().min(0, { message: "Order must be a positive number" }),
});

const navigationSchema = z.object({
  links: z.array(navLinkSchema).min(1, { message: "At least one navigation link is required" }),
});

// Define interface for our content type
interface INavigation {
  navigation?: {
    links: Array<{
      name: string;
      path: string;
      order: number;
    }>;
  };
  [key: string]: any;
}

export default function NavigationEditor() {
  const [content, setContent] = useState<INavigation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Initialize the form with React Hook Form
  const form = useForm<z.infer<typeof navigationSchema>>({
    resolver: zodResolver(navigationSchema),
    defaultValues: {
      links: [
        { name: "", path: "", order: 0 }
      ],
    },
  });

  // Setup field arrays for navigation links
  const linksArray = useFieldArray({
    control: form.control,
    name: "links",
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
        if (data.navigation && data.navigation.links && data.navigation.links.length > 0) {
          // Sort links by order
          const sortedLinks = [...data.navigation.links].sort((a, b) => a.order - b.order);
          form.reset({ links: sortedLinks });
        }
      } catch (err) {
        console.error('Error fetching content:', err);
        toast.error('Failed to load navigation content');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [form]);

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof navigationSchema>) => {
    try {
      setSaving(true);
      
      // Sort links by order before saving
      const sortedLinks = [...data.links].sort((a, b) => a.order - b.order);
      
      const response = await fetch('/api/web-content?adminUsername=main&section=navigation', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ links: sortedLinks }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update navigation content');
      }
      
      const updatedContent = await response.json();
      setContent({ ...content, navigation: updatedContent });
      toast.success('Navigation updated successfully');
    } catch (err) {
      console.error('Error updating content:', err);
      toast.error('Failed to update navigation');
    } finally {
      setSaving(false);
    }
  };
  
  // Handle link reordering
  const handleReorder = (index: number, newOrder: number) => {
    const links = form.getValues("links");
    const updatedLinks = links.map((link, i) => {
      if (i === index) {
        return { ...link, order: newOrder };
      }
      return link;
    });
    
    form.setValue("links", updatedLinks);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading navigation content...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Navigation Menu</CardTitle>
          <CardDescription>
            Manage your website's navigation links
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Menu Links</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Get the highest order and add 1
                      const links = form.getValues("links");
                      const highestOrder = links.length > 0 
                        ? Math.max(...links.map(link => link.order)) 
                        : -1;
                      
                      linksArray.append({ 
                        name: "", 
                        path: "", 
                        order: highestOrder + 1 
                      });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Link
                  </Button>
                </div>
                
                {/* Header row */}
                <div className="grid grid-cols-12 gap-4 pb-2 font-medium text-xs text-gray-500">
                  <div className="col-span-1">Order</div>
                  <div className="col-span-4">Name</div>
                  <div className="col-span-5">Path</div>
                  <div className="col-span-2">Actions</div>
                </div>
                
                {linksArray.fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-1">
                      <FormField
                        control={form.control}
                        name={`links.${index}.order`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                {...field}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value);
                                  field.onChange(value);
                                  handleReorder(index, value);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="col-span-4">
                      <FormField
                        control={form.control}
                        name={`links.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Home" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="col-span-5">
                      <FormField
                        control={form.control}
                        name={`links.${index}.path`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="/home" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="col-span-2 flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => linksArray.remove(index)}
                        disabled={linksArray.fields.length === 1}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled
                      >
                        <GripVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="space-y-2">
                <FormDescription>
                  Tips:
                </FormDescription>
                <ul className="list-disc pl-5 text-sm text-gray-500 space-y-1">
                  <li>The "Order" number determines the sequence of links in the navigation.</li>
                  <li>Use descriptive names that clearly indicate where the link leads.</li>
                  <li>Paths should start with a forward slash (e.g., "/about").</li>
                </ul>
              </div>
              
              {/* Submit Button */}
              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Navigation"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 