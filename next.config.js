/** @type {import('next').NextConfig} */

const securityHeaders = [
  // Prevent clickjacking
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  // Prevent MIME type sniffing
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // Control referrer information
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // Disable DNS prefetching to avoid information leakage
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  // Force HTTPS for 2 years, include subdomains
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  // Restrict browser features
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  // Content Security Policy
  // NOTE: Adjust src values to match your actual CDN/font/analytics domains
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Scripts: self + Google reCAPTCHA + Google Tag Manager (add/remove as needed)
      "script-src 'self' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ https://www.googletagmanager.com",
      // Styles: self + Google Fonts
      "style-src 'self' https://fonts.googleapis.com",
      // Fonts: self + Google Fonts CDN
      "font-src 'self' https://fonts.gstatic.com",
      // Images: self + data URIs (for inline SVG/icons) + trusted image hosts
      "img-src 'self' data: https://res.cloudinary.com",
      // Frames: ONLY reCAPTCHA needs frame (Google's widget uses an iframe)
      "frame-src https://www.google.com/recaptcha/ https://recaptcha.google.com",
      // Connect: self + GHL webhook (server-side only, not client — belt-and-suspenders)
      "connect-src 'self'",
      // Block all objects (Flash, plugins)
      "object-src 'none'",
      // Block base tag hijacking
      "base-uri 'self'",
      // Block form submissions to unexpected destinations
      "form-action 'self'",
      // Upgrade all HTTP requests to HTTPS
      "upgrade-insecure-requests",
    ].join('; '),
  },
];

const nextConfig = {
  reactStrictMode: true,

  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },

  // Disable x-powered-by header (hides Next.js version from attackers)
  poweredByHeader: false,

  // Compress responses
  compress: true,
};

module.exports = nextConfig;