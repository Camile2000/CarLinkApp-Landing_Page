/** @type {import('next').NextConfig} */

const securityHeaders = [
  // Empêche le prefetch DNS involontaire
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  // Bloque l'embedding dans des iframes d'autres origines (anti-clickjacking)
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Empêche le MIME-sniffing (XSS via option)
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Limite les informations transmises dans le Referer
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Désactive les APIs sensibles non utilisées
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
];

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@carlink/shared'],

  // En-têtes de sécurité HTTP sur toutes les routes
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
