'use client';

import { useState, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserManagementForm } from '@/components/superadmin/UserManagementForm';
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from 'next/navigation';

export default function CreateUserPage() {
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);

  const handleUserAdded = (user: any) => {
    console.log('User created:', user);
    setIsSuccess(true);
    
    // Optional: Redirect back to the users list after a short delay
    setTimeout(() => {
      router.push('/superadmin/dashboard/users');
    }, 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New User</h1>
        <p className="text-muted-foreground">
          Add a new user to the system with the appropriate role.
        </p>
      </div>

      {/* Create User Card */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>User Details</CardTitle>
          <CardDescription>
            Fill in the details below to create a new user. All fields are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <UserManagementForm onUserAdded={handleUserAdded} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
} 