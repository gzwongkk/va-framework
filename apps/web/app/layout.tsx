import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { Providers } from '@/components/providers';
import '@fontsource-variable/roboto/index.css';

import './globals.css';

export const metadata: Metadata = {
  title: 'va-framework v2.2.9',
  description: 'Final v2.2 single-view workspace with a shadcn/ui + Radix component baseline.',
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
