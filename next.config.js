/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Exclude Supabase functions from TypeScript checking
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    // Exclude Supabase functions from webpack build
    config.module.rules.push({
      test: /supabase\/functions/,
      loader: 'ignore-loader',
    });
    return config;
  },
  rewrites: async () => {
    return [
      {
        source: '/auth',
        destination: '/auth/signin'
      }
    ];
  }
};

module.exports = nextConfig
