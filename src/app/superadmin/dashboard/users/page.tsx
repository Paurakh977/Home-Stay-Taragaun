'use client';

import { useState, Suspense } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserTable } from '@/components/superadmin/UserTable';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import Link from 'next/link';
// TODO: Import Table components and user fetching logic when ready
// import UserTable from './_components/UserTable'; // Example component

export default function ManageUsersPage() {
  // State to hold users - for future table display
  const [users, setUsers] = useState<any[]>([]);

  // Callback when a user is successfully added via the form
  const handleUserAdded = (newUser: any) => {
    setUsers((prevUsers) => [...prevUsers, newUser]);
    console.log('User added to page state:', newUser);
    // Optionally: Trigger re-fetch of user list if displaying a table
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header with Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-1">
            View and manage all administrative users in the system
          </p>
        </div>
        <Link href="/superadmin/dashboard/users/create">
          <Button className="w-full sm:w-auto">
            <UserPlus className="mr-2 h-4 w-4" />
            Create New User
          </Button>
        </Link>
      </div>

      {/* Users Table Card */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>Complete list of administrative users with their roles and contact information</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
            <UserTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
} 