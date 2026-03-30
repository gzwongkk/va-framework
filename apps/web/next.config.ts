import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@va/contracts', '@va/ui', '@va/view-system', '@va/vis-core'],
  webpack: (config) => {
    config.experiments = {
      ...(config.experiments ?? {}),
      asyncWebAssembly: true,
    };

    return config;
  },
};

export default nextConfig;
