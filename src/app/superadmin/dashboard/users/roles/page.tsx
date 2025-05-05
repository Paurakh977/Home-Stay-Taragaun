'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Shield, Users, Pencil, Check, X, Loader2, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

interface User {
  _id: string;
  username: string;
  email: string;
  contactNumber: string;
  role: string;
  createdAt: string;
}

export default function RolesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usersByRole, setUsersByRole] = useState<{[key: string]: User[]}>({
    superadmin: [],
    admin: [],
    officer: []
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/superadmin/users');
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setUsers(data.users);
      
      // Group users by role
      const grouped = data.users.reduce((acc: {[key: string]: User[]}, user: User) => {
        const role = user.role;
        if (!acc[role]) {
          acc[role] = [];
        }
        acc[role].push(user);
        return acc;
      }, {superadmin: [], admin: [], officer: []});
      
      setUsersByRole(grouped);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'officer':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'superadmin':
        return <Shield className="h-4 w-4" />;
      case 'admin':
        return <Users className="h-4 w-4" />;
      case 'officer':
        return <Users className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'Super Administrators have complete system access';
      case 'admin':
        return 'Administrators manage homestays and content';
      case 'officer':
        return 'Officers handle field verifications and basic operations';
      default:
        return '';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Roles</h1>
          <p className="text-muted-foreground mt-1">
            Manage system users by their assigned roles
          </p>
        </div>
        <Button onClick={fetchUsers} disabled={isLoading} variant="outline" size="sm">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="mr-2 h-4 w-4" />
          )}
          Refresh List
        </Button>
      </div>

      {/* Roles Overview */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span>Role Management</span>
          </CardTitle>
          <CardDescription>
            User roles determine access permissions and capabilities within the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="superadmin">
            <TabsList className="mb-4">
              <TabsTrigger value="superadmin" className="flex items-center gap-1.5">
                <Badge variant="outline" className={getRoleBadgeColor('superadmin')}>
                  {usersByRole.superadmin?.length || 0}
                </Badge>
                Super Admins
              </TabsTrigger>
              <TabsTrigger value="admin" className="flex items-center gap-1.5">
                <Badge variant="outline" className={getRoleBadgeColor('admin')}>
                  {usersByRole.admin?.length || 0}
                </Badge>
                Admins
              </TabsTrigger>
              <TabsTrigger value="officer" className="flex items-center gap-1.5">
                <Badge variant="outline" className={getRoleBadgeColor('officer')}>
                  {usersByRole.officer?.length || 0}
                </Badge>
                Officers
              </TabsTrigger>
            </TabsList>

            {['superadmin', 'admin', 'officer'].map((role) => (
              <TabsContent key={role} value={role} className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b">
                  <Badge variant="outline" className={getRoleBadgeColor(role)}>
                    {getRoleIcon(role)}
                    <span className="ml-1.5 capitalize">{role}</span>
                  </Badge>
                  <p className="text-sm text-muted-foreground">{getRoleDescription(role)}</p>
                </div>

                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : error ? (
                  <div className="text-center py-6 text-red-500">
                    <p>{error}</p>
                    <Button variant="outline" onClick={fetchUsers} className="mt-4">
                      Try Again
                    </Button>
                  </div>
                ) : !usersByRole[role] || usersByRole[role].length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    No users with {role} role found
                  </div>
                ) : (
                  <div className="divide-y">
                    {usersByRole[role].map((user) => (
                      <div key={user._id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{user.username}</span>
                            <span className="text-xs text-muted-foreground">({user.email})</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {user.contactNumber || 'No contact number'} • Created: {formatDate(user.createdAt)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2 sm:mt-0">
                          <Link href={`/superadmin/dashboard/users/edit/${user._id}`}>
                            <Button size="sm" variant="outline" className="h-8 gap-1">
                              <Pencil className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
        <CardFooter className="border-t pt-4 flex justify-between">
          <Link href="/superadmin/dashboard/users">
            <Button variant="outline">Back to All Users</Button>
          </Link>
          <Link href="/superadmin/dashboard/users/create">
            <Button>Add New User</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
} 