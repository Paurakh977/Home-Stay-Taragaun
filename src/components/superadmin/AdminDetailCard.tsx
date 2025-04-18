'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { EditIcon, BoxIcon, ImageIcon, UsersIcon, FileTextIcon, LockIcon, Globe } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Image from "next/image";
import { getImageUrl } from "@/lib/utils";
import { AdminBrandingEditForm } from "./AdminBrandingEditForm";
import Link from "next/link";

interface AdminDetailCardProps {
  admin: any;
  onRefresh: () => void;
}

export function AdminDetailCard({ admin, onRefresh }: AdminDetailCardProps) {
  const [editingPassword, setEditingPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdatePassword = async () => {
    if (!password.trim()) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/superadmin/users/${admin._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update password');
      }
      
      setPassword('');
      setEditingPassword(false);
      onRefresh();
    } catch (error) {
      console.error('Failed to update password:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Admin Details</CardTitle>
        <Link href={`/superadmin/dashboard/users/edit/${admin._id}`}>
          <Button
            variant="outline"
            size="sm"
          >
            <EditIcon className="h-4 w-4 mr-2" />
            Edit Branding
          </Button>
        </Link>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">Basic Information</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-500">Username</p>
                    <p className="font-medium">{admin.username}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Role</p>
                    <Badge variant="outline" className="bg-primary/10">{admin.role}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm">{admin.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Contact</p>
                    <p className="text-sm">{admin.contactNumber}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-gray-500">Security</h3>
                  {!editingPassword ? (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setEditingPassword(true)}
                    >
                      <LockIcon className="h-3.5 w-3.5 mr-1" />
                      Change Password
                    </Button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <input 
                        type="password"
                        className="h-8 px-2 text-sm rounded-md border"
                        placeholder="New password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <Button 
                        size="sm" 
                        variant="default" 
                        disabled={isSubmitting}
                        onClick={handleUpdatePassword}>
                        Save
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => {
                          setEditingPassword(false);
                          setPassword('');
                        }}>
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500">Created At</p>
                  <p className="text-sm">{new Date(admin.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Last Updated</p>
                  <p className="text-sm">{new Date(admin.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="branding">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-shrink-0">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Logo</h3>
                  <div className="relative h-20 w-20 rounded-md overflow-hidden border bg-gray-50">
                    {admin.branding?.logoPath ? (
                      <Image 
                        src={getImageUrl(admin.branding.logoPath)} 
                        alt={admin.branding.brandName || 'Logo'} 
                        fill 
                        className="object-cover" 
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400">
                        <BoxIcon className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex-grow">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Brand Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Brand Name</p>
                      <p className="font-medium">{admin.branding?.brandName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Description</p>
                      <p className="text-sm line-clamp-2">{admin.branding?.brandDescription || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {admin.branding?.sliderImages && admin.branding.sliderImages.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Slider Images</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {admin.branding.sliderImages.map((image: string, index: number) => (
                      <div key={index} className="relative h-16 rounded-md overflow-hidden border bg-gray-50">
                        <Image 
                          src={getImageUrl(image)} 
                          alt={`Slider ${index + 1}`} 
                          fill 
                          className="object-cover" 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Contact Information</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500">Address</p>
                      <p className="text-sm">{admin.branding?.contactInfo?.address || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm">{admin.branding?.contactInfo?.email || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-sm">{admin.branding?.contactInfo?.phone || '-'}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Social Media</h3>
                  <div className="flex flex-wrap gap-2">
                    {admin.branding?.contactInfo?.socialLinks?.facebook && (
                      <Badge variant="outline" className="bg-blue-50">
                        <Globe className="h-3 w-3 mr-1" />
                        Facebook
                      </Badge>
                    )}
                    {admin.branding?.contactInfo?.socialLinks?.instagram && (
                      <Badge variant="outline" className="bg-pink-50">
                        <Globe className="h-3 w-3 mr-1" />
                        Instagram
                      </Badge>
                    )}
                    {admin.branding?.contactInfo?.socialLinks?.twitter && (
                      <Badge variant="outline" className="bg-blue-50">
                        <Globe className="h-3 w-3 mr-1" />
                        Twitter
                      </Badge>
                    )}
                    {admin.branding?.contactInfo?.socialLinks?.youtube && (
                      <Badge variant="outline" className="bg-red-50">
                        <Globe className="h-3 w-3 mr-1" />
                        YouTube
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {admin.branding?.aboutUs?.team && admin.branding.aboutUs.team.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Team Members</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {admin.branding.aboutUs.team.map((member: any, index: number) => (
                      <div key={index} className="flex items-center space-x-3 p-2 rounded-md border bg-gray-50">
                        {member.photoPath ? (
                          <div className="relative h-10 w-10 rounded-full overflow-hidden">
                            <Image 
                              src={getImageUrl(member.photoPath)} 
                              alt={member.name} 
                              fill 
                              className="object-cover" 
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <UsersIcon className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium">{member.name}</p>
                          <p className="text-xs text-gray-500">{member.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="permissions">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Admin Permissions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { key: 'adminDashboardAccess', label: 'Admin Dashboard Access' },
                    { key: 'homestayApproval', label: 'Homestay Approval' },
                    { key: 'homestayEdit', label: 'Homestay Edit' },
                    { key: 'homestayDelete', label: 'Homestay Delete' },
                    { key: 'documentUpload', label: 'Document Upload' },
                    { key: 'imageUpload', label: 'Image Upload' },
                  ].map(({ key, label }) => (
                    <div 
                      key={key} 
                      className="flex items-center justify-between py-2 px-3 rounded-md border"
                    >
                      <span className="text-sm">{label}</span>
                      <Badge 
                        variant={admin.permissions?.[key] ? "default" : "outline"} 
                        className={admin.permissions?.[key] ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-red-100 text-red-800 hover:bg-red-100"}
                      >
                        {admin.permissions?.[key] ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 