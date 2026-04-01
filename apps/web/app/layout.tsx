import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { Providers } from '@/components/providers';
import '@fontsource-variable/roboto/index.css';

import './globals.css';

export const metadata: Metadata = {
  title: 'va-framework v2.3.11',
  description:
    'Example-gallery foundation for the v2 analytics framework with registry-backed graph and cars workspaces.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
