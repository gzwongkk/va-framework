import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';

import { cn } from '../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-[var(--ui-radius-pill)] border px-3 py-1 text-xs font-medium uppercase tracking-[0.16em]',
  {
    variants: {
      variant: {
        default: 'border-[var(--ui-badge-border)] bg-[var(--ui-badge-background)] text-[var(--ui-badge-text)]',
        secondary:
          'border-[var(--ui-accent-border)] bg-[var(--ui-accent-soft)] text-[var(--ui-accent-text)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]',
        outline: 'border-[var(--ui-border)] bg-transparent text-[var(--ui-text-secondary)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({
  className,
  variant,
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ className, variant }))}
      {...props}
    />
  );
}
