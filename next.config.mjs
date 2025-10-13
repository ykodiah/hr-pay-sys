/** @type {import('next').NextConfig} */
const securityHeaders = [
  // Enforce HTTPS for 2 years with preload (only enable if your domain is HSTS-preload ready)
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Prevent MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Clickjacking protection
  { key: 'X-Frame-Options', value: 'DENY' },
  // Improve referrer privacy
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Limit powerful browser APIs
  {
    key: 'Permissions-Policy',
    value: [
      'accelerometer=()',
      'autoplay=()',
      'camera=()',
      'display-capture=()',
      'encrypted-media=()',
      'fullscreen=(self)',
      'geolocation=()',
      'gyroscope=()',
      'microphone=()',
      'midi=()',
      'payment=()',
      'usb=()'
    ].join(', '),
  },
  // Baseline CSP - adjust as integrations require. Avoids unsafe-inline for scripts.
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      // Next.js and third-party scripts may require https: and 'unsafe-eval' during development.
      // In production, prefer removing 'unsafe-eval' if possible.
      "script-src 'self' https: 'unsafe-eval'",
      "style-src 'self' https: 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https:",
      "font-src 'self' data: https:",
      "object-src 'none'",
      "form-action 'self'",
    ].join('; '),
  },
]

const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
}

export default nextConfig
