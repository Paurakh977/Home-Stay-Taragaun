import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/api/',
        '/login',
        '/superadmin/',
        '/dashboard',
        '/access-denied',
      ],
    },
    sitemap: 'https://hamrohomestay.com/sitemap.xml',
  };
} 