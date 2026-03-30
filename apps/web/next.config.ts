import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@va/contracts', '@va/ui', '@va/view-system', '@va/vis-core'],
};

export default nextConfig;
