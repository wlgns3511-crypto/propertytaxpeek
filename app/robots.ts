import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/embed/', '/api/', '/_next/'],
      },
    ],
    sitemap: 'https://propertytaxpeek.com/sitemap.xml',
  };
}
