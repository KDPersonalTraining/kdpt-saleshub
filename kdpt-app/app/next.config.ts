import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // The repo root holds another project (the sales hub); build from this folder.
  turbopack: { root: __dirname },
};

export default nextConfig;
