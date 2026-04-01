'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@va/ui';
import { ChartNoAxesCombined, LayoutGrid, Network } from 'lucide-react';

type WorkspaceRouteNavProps = {
  buttonPreset: string;
};

const ROUTES = [
  {
    href: '/',
    icon: Network,
    label: 'Graph Home',
    match: (pathname: string) => pathname === '/',
  },
  {
    href: '/gallery',
    icon: LayoutGrid,
    label: 'Gallery',
    match: (pathname: string) => pathname.startsWith('/gallery') || pathname.startsWith('/examples'),
  },
  {
    href: '/cars',
    icon: ChartNoAxesCombined,
    label: 'Cars',
    match: (pathname: string) => pathname.startsWith('/cars'),
  },
] as const;

export function WorkspaceRouteNav({ buttonPreset }: WorkspaceRouteNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Workspace routes"
      className="ui-route-switcher flex items-center gap-2 rounded-[var(--ui-radius-panel)] border p-1"
    >
      <span className="ui-studio-label hidden px-2 font-semibold uppercase tracking-[0.18em] sm:inline">
        Views
      </span>
      {ROUTES.map(({ href, icon: Icon, label, match }) => {
        const isActive = match(pathname);

        return (
          <Button
            asChild
            className="ui-studio-toggle gap-2 px-3"
            data-active={isActive}
            data-button-style={buttonPreset}
            key={href}
            variant={isActive ? 'default' : 'outline'}
          >
            <Link aria-current={isActive ? 'page' : undefined} href={href}>
              <Icon className="size-4" />
              {label}
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}
