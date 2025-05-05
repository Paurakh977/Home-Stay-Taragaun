import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller, SubmitHandler } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input as BaseInput } from '@/components/ui/input';
import { Textarea as BaseTextarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Trash, Plus, Upload } from 'lucide-react';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

// Custom Input component with label and error handling
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  description?: string;
}

function Input({ className, type, label, error, description, ...props }: InputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={props.id}>{label}</Label>
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-destructive",
          className
        )}
        {...props}
      />
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

// Custom Textarea component with label and error handling
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  description?: string;
}

function Textarea({ className, label, error, description, ...props }: TextareaProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={props.id}>{label}</Label>
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-destructive",
          className
        )}
        {...props}
      />
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

// Simple image upload component
interface ImageUploadProps {
  id: string;
  label: string;
  onUpload: (file: File) => void;
  previewUrl?: string;
  error?: string;
}

function ImageUpload({ id, label, onUpload, previewUrl, error }: ImageUploadProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex flex-col items-center gap-4">
        {previewUrl && (
          <div className="relative w-full h-40 border rounded-md overflow-hidden">
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="w-full">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => document.getElementById(id)?.click()}
          >
            <Upload className="mr-2 h-4 w-4" /> {previewUrl ? 'Replace Image' : 'Upload Image'}
          </Button>
          <input
            id={id}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}

interface ContentEditorProps {
  adminUsername?: string;
  section?: string;
  onUpdate?: () => void;
}

// Define schema for home section content
const homeSchema = z.object({
  hero: z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    subtitle: z.string().min(3, "Subtitle must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    image: z.string().min(1, "Image is required"),
    buttonText: z.string().optional(),
    buttonLink: z.string().optional(),
  }),
  stats: z.array(
    z.object({
      title: z.string().min(1, "Title is required"),
      value: z.string().min(1, "Value is required"),
      icon: z.string().optional(),
    })
  ).default([]),
  contentSections: z.array(
    z.object({
      title: z.string().min(1, "Title is required"),
      content: z.string().min(10, "Content must be at least 10 characters"),
      image: z.string().optional(),
      buttonText: z.string().optional(),
      buttonLink: z.string().optional(),
    })
  ).default([]),
});

export type HomeContent = z.infer<typeof homeSchema>;

const ContentEditor: React.FC<ContentEditorProps> = ({ 
  adminUsername = 'main',
  section = 'home',
  onUpdate 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<HomeContent>({
    resolver: zodResolver(homeSchema) as any,
    defaultValues: {
      hero: {
        title: '',
        subtitle: '',
        description: '',
        image: '',
        buttonText: '',
        buttonLink: '',
      },
      stats: [],
      contentSections: [],
    },
  });

  const statsFieldArray = useFieldArray({
    control,
    name: "stats",
  });

  const contentFieldArray = useFieldArray({
    control,
    name: "contentSections",
  });

  useEffect(() => {
    const getContent = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/web-content?adminUsername=${adminUsername}&section=${section}`);
        
        if (!response.ok) {
          throw new Error('Failed to load content');
        }
        
        const data = await response.json();
        
        // Map the API data to our form schema
        // This is necessary because the API might have a different structure
        let contentData: HomeContent = {
          hero: {
            title: data?.hero?.title || '',
            subtitle: data?.hero?.subtitle || '',
            description: data?.hero?.description || '',
            image: data?.hero?.image || '',
            buttonText: data?.hero?.ctaText || '',
            buttonLink: data?.hero?.ctaLink || '',
          },
          stats: data?.stats?.map((item: any) => ({
            title: item.label || '',
            value: item.value || '',
            icon: item.icon || '',
          })) || [],
          contentSections: data?.sections?.map((item: any) => ({
            title: item.title || '',
            content: item.description || '',
            image: item.image || '',
            buttonText: item.buttonText || '',
            buttonLink: item.buttonLink || '',
          })) || [],
        };
        
        // Reset form with fetched data
        reset(contentData);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching content:", error);
        toast.error("Failed to load content");
        setIsLoading(false);
      }
    };

    getContent();
  }, [reset, adminUsername, section]);

  const onSubmit: SubmitHandler<HomeContent> = async (data) => {
    try {
      setIsSaving(true);
      
      // Convert our form data to the API expected format
      const apiData = {
        hero: {
          title: data.hero.title,
          subtitle: data.hero.subtitle,
          description: data.hero.description,
          image: data.hero.image,
          ctaText: data.hero.buttonText,
          ctaLink: data.hero.buttonLink,
        },
        stats: data.stats.map(item => ({
          label: item.title,
          value: item.value,
          icon: item.icon,
        })),
        sections: data.contentSections.map(item => ({
          title: item.title,
          description: item.content,
          image: item.image,
          buttonText: item.buttonText,
          buttonLink: item.buttonLink,
        })),
      };
      
      // Send the update request
      const response = await fetch(`/api/web-content?adminUsername=${adminUsername}&section=${section}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update content');
      }
      
      toast.success("Content updated successfully");
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error updating content:", error);
      toast.error("Failed to update content");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (file: File, fieldName: string) => {
    try {
      setIsLoading(true);
      
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', section); // Specify folder to save in
      
      // Upload the image
      const response = await fetch('/api/superadmin/uploads/image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const data = await response.json();
      const imagePath = data.imagePath;
      
      // Update form value based on fieldName
      const formValues = control._formValues as HomeContent;
      
      // Simple update for hero image
      if (fieldName === 'hero.image') {
        reset({
          ...formValues,
          hero: {
            ...formValues.hero,
            image: imagePath
          }
        });
      } 
      // Update for content section images
      else if (fieldName.startsWith('contentSections.')) {
        const match = fieldName.match(/contentSections\.(\d+)\.image/);
        if (match && match[1]) {
          const index = parseInt(match[1]);
          const newContentSections = [...formValues.contentSections];
          if (newContentSections[index]) {
            newContentSections[index] = {
              ...newContentSections[index],
              image: imagePath
            };
            reset({
              ...formValues,
              contentSections: newContentSections
            });
          }
        }
      }
      
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading content...</div>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Hero Section</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                name="hero.title"
                control={control}
                render={({ field }) => (
                  <Input
                    label="Title"
                    error={errors.hero?.title?.message}
                    placeholder="Enter hero title"
                    {...field}
                  />
                )}
              />
              <Controller
                name="hero.subtitle"
                control={control}
                render={({ field }) => (
                  <Input
                    label="Subtitle"
                    error={errors.hero?.subtitle?.message}
                    placeholder="Enter hero subtitle"
                    {...field}
                  />
                )}
              />
            </div>
            
            <Controller
              name="hero.description"
              control={control}
              render={({ field }) => (
                <Textarea
                  label="Description"
                  error={errors.hero?.description?.message}
                  placeholder="Enter hero description"
                  rows={4}
                  {...field}
                />
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                name="hero.buttonText"
                control={control}
                render={({ field }) => (
                  <Input
                    label="Button Text"
                    error={errors.hero?.buttonText?.message}
                    placeholder="E.g., Learn More"
                    {...field}
                  />
                )}
              />
              <Controller
                name="hero.buttonLink"
                control={control}
                render={({ field }) => (
                  <Input
                    label="Button URL"
                    error={errors.hero?.buttonLink?.message}
                    placeholder="E.g., /about"
                    {...field}
                  />
                )}
              />
            </div>
            
            <Controller
              name="hero.image"
              control={control}
              render={({ field }) => (
                <div>
                  <div className="mt-2">
                    <ImageUpload 
                      id="hero-image"
                      label="Hero Image"
                      onUpload={(file) => handleImageUpload(file, 'hero.image')}
                      previewUrl={field.value}
                      error={errors.hero?.image?.message}
                    />
                  </div>
                </div>
              )}
            />
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Stats</CardTitle>
            <Button type="button" variant="ghost" size="sm" onClick={() => statsFieldArray.append({ title: '', value: '', icon: '' })}>
              <Plus size={16} className="mr-1" /> Add Stat
            </Button>
          </CardHeader>
          <CardContent>
            {statsFieldArray.fields.map((field, index) => (
              <div key={field.id} className="flex items-start mb-4">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Controller
                    name={`stats.${index}.title`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        label={`Stat ${index + 1} Title`}
                        error={errors.stats?.[index]?.title?.message}
                        placeholder="E.g., Homestays"
                        {...field}
                      />
                    )}
                  />
                  <Controller
                    name={`stats.${index}.value`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        label={`Stat ${index + 1} Value`}
                        error={errors.stats?.[index]?.value?.message}
                        placeholder="E.g., 100+"
                        {...field}
                      />
                    )}
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="ml-2 mt-6"
                  onClick={() => statsFieldArray.remove(index)}
                >
                  <Trash size={16} />
                </Button>
              </div>
            ))}
            {statsFieldArray.fields.length === 0 && (
              <p className="text-sm text-muted-foreground">No stats added yet. Click "Add Stat" to add one.</p>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Content Sections</CardTitle>
            <Button type="button" variant="ghost" size="sm" onClick={() => contentFieldArray.append({ title: '', content: '', image: '', buttonText: '', buttonLink: '' })}>
              <Plus size={16} className="mr-1" /> Add Section
            </Button>
          </CardHeader>
          <CardContent>
            {contentFieldArray.fields.map((field, index) => (
              <Card key={field.id} className="mb-4 border-dashed">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-medium">Section {index + 1}</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => contentFieldArray.remove(index)}
                    >
                      <Trash size={16} />
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <Controller
                      name={`contentSections.${index}.title`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          label="Title"
                          error={errors.contentSections?.[index]?.title?.message}
                          placeholder="Enter section title"
                          {...field}
                        />
                      )}
                    />
                    
                    <Controller
                      name={`contentSections.${index}.content`}
                      control={control}
                      render={({ field }) => (
                        <Textarea
                          label="Content"
                          error={errors.contentSections?.[index]?.content?.message}
                          placeholder="Enter section content"
                          rows={3}
                          {...field}
                        />
                      )}
                    />
                    
                    <Controller
                      name={`contentSections.${index}.image`}
                      control={control}
                      render={({ field }) => (
                        <div>
                          <div className="mt-2">
                            <ImageUpload 
                              id={`content-image-${index}`}
                              label="Section Image"
                              onUpload={(file) => handleImageUpload(file, `contentSections.${index}.image`)}
                              previewUrl={field.value}
                              error={errors.contentSections?.[index]?.image?.message}
                            />
                          </div>
                        </div>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
            {contentFieldArray.fields.length === 0 && (
              <p className="text-sm text-muted-foreground">No content sections added yet. Click "Add Section" to add one.</p>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 mt-6">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ContentEditor; 