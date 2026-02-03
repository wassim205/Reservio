import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable environment variable loading from project root
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  
  // Turbopack configuration (empty to silence webpack config warning)
  turbopack: {},
  
  // Development configuration
  ...(process.env.NODE_ENV === 'development' && {
    // Enable source maps in development
    webpack: (config) => {
      config.devtool = 'cheap-module-source-map';
      return config;
    },
  }),
};

export default nextConfig;
