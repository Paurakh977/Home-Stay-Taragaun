import { NextConfig } from 'next';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

// This configuration applies to all API routes
// forcing them to be dynamic and not cached 