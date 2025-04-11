'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Key, Lock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PermissionsPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Permissions</h1>
        <p className="text-muted-foreground">
          Configure and manage detailed user permissions by role.
        </p>
      </div>

      {/* Permissions Card */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              <span>Permission Controls</span>
            </CardTitle>
            <ShieldAlert className="h-5 w-5 text-amber-500" />
          </div>
          <CardDescription>
            Fine-grained permission management for system roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md p-4 mb-6">
            <div className="flex gap-2 items-center text-amber-800 dark:text-amber-500 font-medium mb-1">
              <Lock className="h-4 w-4" />
              <span>Under Development</span>
            </div>
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Detailed permission management is currently under development. In the current system version, 
              permissions are tied to roles and cannot be individually configured.
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">Permission Groups</h3>
              <p className="text-sm text-muted-foreground">
                Future functionality will allow managing permissions in these groups:
              </p>
              
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                <li className="flex items-center gap-2 text-sm p-2 bg-muted/30 rounded-md">
                  <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                  User Management
                </li>
                <li className="flex items-center gap-2 text-sm p-2 bg-muted/30 rounded-md">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  Content Management
                </li>
                <li className="flex items-center gap-2 text-sm p-2 bg-muted/30 rounded-md">
                  <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                  Homestay Management
                </li>
                <li className="flex items-center gap-2 text-sm p-2 bg-muted/30 rounded-md">
                  <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                  System Settings
                </li>
                <li className="flex items-center gap-2 text-sm p-2 bg-muted/30 rounded-md">
                  <span className="h-2 w-2 rounded-full bg-red-500"></span>
                  Booking Management
                </li>
                <li className="flex items-center gap-2 text-sm p-2 bg-muted/30 rounded-md">
                  <span className="h-2 w-2 rounded-full bg-slate-500"></span>
                  Financial Operations
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" disabled>
            Configure Permissions (Coming Soon)
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 