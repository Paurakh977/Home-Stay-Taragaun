"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { FilePlus, Upload, X, Plus, Loader2, File, CheckCircle, Eye, Download, ExternalLink, FileText } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation"; // For redirection if not authenticated

interface UserInfo {
  homestayId: string;
  homeStayName: string;
}

interface DocumentItem {
  id: string;
  title: string;
  description: string;
  files: File[];
}

export default function DocumentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [documentItems, setDocumentItems] = useState<DocumentItem[]>([
    { id: crypto.randomUUID(), title: "", description: "", files: [] }
  ]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRefs = useRef<HTMLInputElement[]>([]);
  
  // State for preview functionality
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ file: File; url: string } | null>(null);

  // Check authentication on component mount
  useEffect(() => {
    const userJson = localStorage.getItem("user");
    if (userJson) {
      try {
        const userData = JSON.parse(userJson);
        setUser(userData);
      } catch (err) {
        console.error("Error parsing user data:", err);
        localStorage.removeItem("user");
        router.push("/login");
      }
    } else {
      router.push("/login");
    }
  }, [router]);

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (previewFile?.url && previewFile.url.startsWith('blob:')) {
        URL.revokeObjectURL(previewFile.url);
      }
    };
  }, [previewFile]);

  // Add a new document item
  const addDocumentItem = () => {
    setDocumentItems([
      ...documentItems,
      { id: crypto.randomUUID(), title: "", description: "", files: [] }
    ]);
  };

  // Remove a document item
  const removeDocumentItem = (id: string) => {
    if (documentItems.length === 1) {
      toast.error("You must have at least one document item");
      return;
    }
    setDocumentItems(documentItems.filter(item => item.id !== id));
  };

  // Update document item fields
  const updateDocumentItem = (id: string, field: 'title' | 'description', value: string) => {
    setDocumentItems(
      documentItems.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  // Handle file selection
  const handleFileChange = (id: string, files: FileList | null) => {
    if (!files) return;
    
    setDocumentItems(
      documentItems.map(item => 
        item.id === id 
          ? { 
              ...item, 
              files: [...Array.from(files)]
            } 
          : item
      )
    );
  };

  // Remove a file from a document item
  const removeFile = (documentId: string, fileIndex: number) => {
    setDocumentItems(
      documentItems.map(item => 
        item.id === documentId 
          ? { 
              ...item, 
              files: item.files.filter((_, idx) => idx !== fileIndex)
            } 
          : item
      )
    );
  };

  // Open preview for a file
  const openPreview = (file: File) => {
    // Create object URL for the file
    const url = URL.createObjectURL(file);
    setPreviewFile({ file, url });
    setPreviewOpen(true);
  };

  // Close preview
  const closePreview = useCallback(() => {
    if (previewFile?.url && previewFile.url.startsWith('blob:')) {
      URL.revokeObjectURL(previewFile.url);
    }
    setPreviewFile(null);
    setPreviewOpen(false);
  }, [previewFile]);

  // Check if file is previewable in browser
  const canPreviewInBrowser = (file: File): boolean => {
    const type = file.type.toLowerCase();
    return (
      type.startsWith('image/') || 
      type === 'application/pdf' || 
      type === 'text/plain' || 
      type === 'text/html' || 
      type === 'text/csv'
    );
  };

  // Get the appropriate icon for a file type
  const getFileIcon = (file: File) => {
    const type = file.type.toLowerCase();
    if (type.startsWith('image/')) return '🖼️';
    if (type === 'application/pdf') return '📄';
    if (type.startsWith('text/')) return '📝';
    if (type.startsWith('video/')) return '🎬';
    if (type.startsWith('audio/')) return '🎵';
    return '📎';
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user is logged in
    if (!user) {
      toast.error("Authentication required. Please log in.");
      router.push("/login");
      return;
    }

    // Get homestayId from the user object
    const homestayId = user.homestayId;
    
    // Validate form (title and files)
    const hasEmptyTitle = documentItems.some(item => !item.title.trim());
    if (hasEmptyTitle) {
      toast.error("Please provide titles for all documents");
      return;
    }

    const hasNoFiles = documentItems.some(item => item.files.length === 0);
    if (hasNoFiles) {
      toast.error("Please upload at least one file for each document entry");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();

      // 1. Prepare metadata (titles and descriptions)
      const metadata = documentItems.map(item => ({ 
        title: item.title,
        description: item.description 
      }));
      formData.append("metadata", JSON.stringify(metadata));

      // 2. Append files with structured keys (file_{itemIndex}_{fileIndex})
      documentItems.forEach((item, itemIndex) => {
        item.files.forEach((file, fileIndex) => {
          formData.append(`file_${itemIndex}_${fileIndex}`, file, file.name);
        });
      });
      
      // 3. Send the request to the API endpoint using the retrieved homestayId
      const response = await fetch(`/api/homestays/${homestayId}/documents`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload documents');
      }

      toast.success(result.message || "Documents uploaded successfully");

      // Reset form
      setDocumentItems([
        { id: crypto.randomUUID(), title: "", description: "", files: [] }
      ]);
    } catch (error) {
      console.error("Error uploading documents:", error);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Set up keyboard listeners for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && previewOpen) {
        closePreview();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewOpen, closePreview]);

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-primary/10 to-primary/5">
        <h1 className="text-2xl font-bold text-gray-900">Upload Legal Documents</h1>
        <p className="text-gray-600 mt-1">
          Upload legal documents for verification of your homestay registration
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6">
        {documentItems.map((item, index) => (
          <div 
            key={item.id} 
            className="mb-8 p-6 border border-gray-200 rounded-lg relative"
          >
            {documentItems.length > 1 && (
              <button
                type="button"
                onClick={() => removeDocumentItem(item.id)}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                aria-label="Remove document"
              >
                <X size={20} />
              </button>
            )}
            
            <div className="mb-4">
              <label htmlFor={`title-${item.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                Document Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id={`title-${item.id}`}
                value={item.title}
                onChange={(e) => updateDocumentItem(item.id, 'title', e.target.value)}
                placeholder="e.g., Business Registration Certificate, Tax Clearance Document"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor={`description-${item.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                Document Description
              </label>
              <textarea
                id={`description-${item.id}`}
                value={item.description}
                onChange={(e) => updateDocumentItem(item.id, 'description', e.target.value)}
                placeholder="Briefly describe the document and its purpose for your homestay registration"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent h-24 resize-none"
              />
            </div>
            
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload Files <span className="text-red-500">*</span>
              </label>
              
              <div 
                onClick={() => fileInputRefs.current[index]?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <input
                  type="file"
                  ref={(el) => {
                    if (el) fileInputRefs.current[index] = el;
                  }}
                  onChange={(e) => handleFileChange(item.id, e.target.files)}
                  className="hidden"
                  multiple
                  accept="*/*" // Accept any file type
                />
                
                {item.files.length === 0 ? (
                  <div className="flex flex-col items-center">
                    <Upload className="h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 mb-1">
                      Drag and drop files here, or click to browse
                    </p>
                    <p className="text-xs text-gray-400">
                      You can upload multiple files of any format
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <CheckCircle className="h-8 w-8 text-green-500 mb-1" />
                    <p className="text-sm font-medium text-gray-700">
                      {item.files.length} {item.files.length === 1 ? 'file' : 'files'} selected
                    </p>
                    <p className="text-xs text-blue-500 mt-1 hover:underline">
                      Click to add more files
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Selected Files List with Preview button */}
            {item.files.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Files:</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {item.files.map((file, fileIndex) => (
                    <div 
                      key={fileIndex}
                      className="flex items-center justify-between bg-gray-50 p-3 rounded-md"
                    >
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{getFileIcon(file)}</span>
                        <div>
                          <p className="text-sm text-gray-700 font-medium truncate max-w-xs">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {canPreviewInBrowser(file) && (
                          <button
                            type="button"
                            onClick={() => openPreview(file)}
                            className="text-blue-500 hover:text-blue-700 transition-colors"
                            aria-label="Preview file"
                          >
                            <Eye size={16} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeFile(item.id, fileIndex)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          aria-label="Remove file"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        
        <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8">
          <button
            type="button"
            onClick={addDocumentItem}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            disabled={isUploading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Document
          </button>
          
          <button
            type="submit"
            className="flex items-center justify-center px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors disabled:opacity-70"
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <FilePlus className="h-4 w-4 mr-2" />
                Upload Documents
              </>
            )}
          </button>
        </div>
      </form>

      {/* File Preview Modal */}
      {previewOpen && previewFile && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 truncate max-w-[calc(100%-6rem)]">
                {previewFile.file.name}
              </h3>
              <div className="flex items-center gap-2">
                <a 
                  href={previewFile.url} 
                  download={previewFile.file.name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-700 p-2"
                  title="Download"
                >
                  <Download size={18} />
                </a>
                <button
                  type="button"
                  onClick={closePreview}
                  className="text-gray-500 hover:text-gray-700 p-2"
                  title="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 overflow-auto bg-gray-100 min-h-[400px]">
              {previewFile.file.type.startsWith('image/') ? (
                <div className="flex items-center justify-center h-full p-4">
                  <img
                    src={previewFile.url}
                    alt={previewFile.file.name}
                    className="max-w-full max-h-[70vh] object-contain"
                  />
                </div>
              ) : previewFile.file.type === 'application/pdf' ? (
                <iframe
                  src={`${previewFile.url}#toolbar=0&navpanes=0`}
                  className="w-full h-[70vh]"
                  title={previewFile.file.name}
                ></iframe>
              ) : previewFile.file.type.startsWith('text/') ? (
                <div className="p-4 h-full">
                  <div className="bg-white p-4 rounded border border-gray-200 h-full overflow-auto">
                    <pre className="whitespace-pre-wrap break-all text-sm">
                      Loading text content...
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <FileText className="h-20 w-20 text-gray-300 mb-4" />
                  <h4 className="text-lg font-medium text-gray-700 mb-2">Preview not available</h4>
                  <p className="text-gray-500 max-w-md">
                    This file type ({previewFile.file.type || 'unknown'}) cannot be previewed in the browser.
                  </p>
                  <a
                    href={previewFile.url}
                    download={previewFile.file.name}
                    className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                  >
                    <Download size={16} />
                    Download File
                  </a>
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {(previewFile.file.size / 1024 / 1024).toFixed(2)} MB • {previewFile.file.type || 'Unknown file type'}
                </div>
                <button
                  type="button"
                  onClick={closePreview}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 