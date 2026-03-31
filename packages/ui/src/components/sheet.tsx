'use client';

import type { HTMLAttributes, ReactNode } from 'react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '../lib/utils';

type SheetProps = {
  children: ReactNode;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function Sheet({
  children,
  onOpenChange,
  open,
}: SheetProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenChange, open]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        aria-label="Close panel"
        className="absolute inset-0 bg-slate-950/28 backdrop-blur-[2px] animate-[ui-overlay-fade_180ms_ease-out]"
        onClick={() => onOpenChange(false)}
        type="button"
      />
      {children}
    </div>,
    document.body,
  );
}

export function SheetContent({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'relative z-10 ml-auto flex h-full w-full max-w-[min(440px,100vw)] flex-col border-l border-[var(--ui-border,var(--color-border))] bg-[var(--ui-panel-background,var(--color-card))] shadow-[-24px_0_60px_-36px_rgba(15,23,42,0.4)] animate-[ui-drawer-in_220ms_cubic-bezier(0.22,1,0.36,1)]',
        className,
      )}
      data-side="right"
      role="dialog"
      aria-modal="true"
      {...props}
    >
      {children}
    </div>
  );
}

export function SheetHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('grid gap-2', className)} {...props} />;
}

export function SheetTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-lg font-semibold tracking-tight', className)} {...props} />;
}

export function SheetDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-[var(--ui-text-secondary,var(--color-muted-foreground))]', className)} {...props} />;
}

export function SheetFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-auto flex flex-wrap items-center justify-end gap-2', className)} {...props} />;
}
