import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

interface ImageUploadProps {
  onUploadComplete: (imagePath: string) => void;
  folder?: string;
  accept?: string;
  buttonText?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link';
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onUploadComplete,
  folder = 'general',
  accept = 'image/*',
  buttonText = 'Upload Image',
  className = '',
  variant = 'outline'
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const response = await fetch('/api/images', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Image upload failed');
      }

      const data = await response.json();
      onUploadComplete(data.imagePath);
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={className}>
      <input
        type="file"
        ref={fileInputRef}
        accept={accept}
        onChange={handleUpload}
        className="hidden"
      />
      <Button
        type="button"
        variant={variant}
        onClick={handleButtonClick}
        disabled={isUploading}
        size="sm"
      >
        {isUploading ? 'Uploading...' : buttonText}
      </Button>
    </div>
  );
};

export default ImageUpload; 