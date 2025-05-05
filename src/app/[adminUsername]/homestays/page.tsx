"use client";

import { Suspense } from "react";
import { HomestayContent } from "@/app/homestays/page";
import { useParams } from "next/navigation";
import Loading from "@/components/ui/loading";

export default function AdminHomestaysPage() {
  const params = useParams();
  const adminUsername = params.adminUsername as string;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Our Homestays</h1>
      <Suspense fallback={<Loading />}>
        <HomestayContent adminContext={adminUsername} />
      </Suspense>
    </div>
  );
} 