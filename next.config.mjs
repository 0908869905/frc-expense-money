import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // 安全標頭配置
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

// Sentry 配置 - 排除 auth 路由以避免衝突
const sentryWebpackPluginOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  disableLogger: true,
  // 排除 NextAuth 路由
  excludeServerRoutes: [
    "/api/auth/[...nextauth]",
    "/api/auth/providers",
    "/api/auth/csrf",
    "/api/auth/signin",
    "/api/auth/signout",
    "/api/auth/session",
    "/api/auth/callback",
  ],
  // 禁用自動 instrumentation 以避免衝突
  autoInstrumentServerFunctions: false,
  autoInstrumentAppDirectory: false,
};

// ⚠️ 暫時禁用 Sentry - wrapRouteHandlerWithSentry 與 NextAuth 衝突
// 錯誤: TypeError: o5 is not a constructor
// 使用 Vercel Logs 進行錯誤追蹤
export default nextConfig;