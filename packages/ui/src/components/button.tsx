import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';

import { cn } from '../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-[var(--ui-radius-control)] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'border border-[var(--ui-button-solid-border)] bg-[var(--ui-button-solid-bg)] text-[var(--ui-button-solid-fg)] hover:bg-[var(--ui-button-solid-hover)]',
        outline:
          'border border-[var(--ui-button-outline-border)] bg-[var(--ui-button-outline-bg)] text-[var(--ui-button-outline-fg)] hover:bg-[var(--ui-button-outline-hover)]',
        secondary:
          'border border-transparent bg-[var(--ui-button-secondary-bg)] text-[var(--ui-button-secondary-fg)] hover:bg-[var(--ui-button-secondary-hover)]',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  asChild = false,
  className,
  size,
  variant,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button';

  return <Comp className={cn(buttonVariants({ className, size, variant }))} {...props} />;
}
