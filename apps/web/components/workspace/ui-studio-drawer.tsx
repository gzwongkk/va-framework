'use client';

import { useState } from 'react';

import {
  Button,
  ScrollArea,
  Separator,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  ToggleGroup,
  ToggleGroupItem,
} from '@va/ui';
import { LayoutDashboard, Palette, Radius, Rows3, Settings2, SquareDashedMousePointer } from 'lucide-react';

import { useUiStudioStore } from '@/lib/ui-studio-store';
import {
  uiButtonOptions,
  uiDensityOptions,
  uiRadiusOptions,
  uiShellOptions,
  uiThemeOptions,
} from '@/lib/ui-studio';

type UiStudioDrawerProps = {
  buttonPreset: string;
};

type OptionGroupProps<T extends string> = {
  activeValue: T;
  buttonPreset: string;
  description: string;
  icon: typeof Palette;
  onChange: (value: T) => void;
  options: Array<{ description: string; label: string; value: T }>;
  title: string;
};

function OptionGroup<T extends string>({
  activeValue,
  buttonPreset,
  description,
  icon: Icon,
  onChange,
  options,
  title,
}: OptionGroupProps<T>) {
  return (
    <section className="grid gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="ui-studio-label font-semibold uppercase tracking-[0.22em]">{title}</p>
          <p className="ui-studio-body mt-2">{description}</p>
        </div>
        <div className="ui-studio-icon-chip rounded-[var(--ui-radius-control)] border p-2.5 shadow-sm shadow-slate-950/5">
          <Icon className="size-4" />
        </div>
      </div>

      <ToggleGroup
        className="grid gap-2"
        onValueChange={(value) => {
          if (value) {
            onChange(value as T);
          }
        }}
        type="single"
        value={activeValue}
      >
        {options.map((option) => (
          <ToggleGroupItem
            key={option.value}
            className="grid h-auto w-full justify-start gap-1 px-3 py-3 text-left normal-case tracking-normal shadow-sm shadow-slate-950/5"
            data-button-style={buttonPreset}
            value={option.value}
          >
            <span className="text-sm font-semibold">{option.label}</span>
            <span className="text-xs font-normal opacity-80">{option.description}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </section>
  );
}

export function UiStudioDrawer({
  buttonPreset,
}: UiStudioDrawerProps) {
  const [open, setOpen] = useState(false);
  const prefs = useUiStudioStore((state) => state.prefs);
  const resetPrefs = useUiStudioStore((state) => state.resetPrefs);
  const setShellPreset = useUiStudioStore((state) => state.setShellPreset);
  const setThemePreset = useUiStudioStore((state) => state.setThemePreset);
  const setDensityPreset = useUiStudioStore((state) => state.setDensityPreset);
  const setRadiusPreset = useUiStudioStore((state) => state.setRadiusPreset);
  const setButtonPreset = useUiStudioStore((state) => state.setButtonPreset);

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger asChild>
        <Button
          className="ui-studio-toggle gap-2 px-3"
          data-active={open}
          data-button-style={buttonPreset}
          type="button"
          variant={open ? 'default' : 'outline'}
        >
          <Settings2 className="size-4" />
          Devtools
        </Button>
      </SheetTrigger>

      <SheetContent className="ui-studio-drawer p-0" showClose side="right">
        <div className="ui-studio-drawer-shell flex h-full min-h-0 flex-col p-[var(--ui-drawer-padding)]">
          <SheetHeader className="pb-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="ui-studio-badge inline-flex items-center rounded-[var(--ui-radius-pill)] border px-3 py-1 text-xs font-medium uppercase tracking-[0.16em]">
                  Development only
                </span>
              </div>
              <SheetTitle className="mt-3 font-[family-name:var(--font-display)] text-2xl text-[var(--ui-text-primary)]">
                UI Studio
              </SheetTitle>
              <SheetDescription className="ui-studio-body mt-2">
                Quick workspace twists for shell size, theme, density, corner radius, and control treatment.
              </SheetDescription>
            </div>
          </div>
          </SheetHeader>

          <ScrollArea className="min-h-0 flex-1 pr-1">
            <div className="ui-studio-stack grid">
              <OptionGroup
                activeValue={prefs.shellPreset}
                buttonPreset={buttonPreset}
                description="Switch the overall desktop frame and working-canvas footprint."
                icon={LayoutDashboard}
                onChange={setShellPreset}
                options={uiShellOptions}
                title="Shell Size"
              />

              <Separator className="ui-studio-divider" />

              <OptionGroup
                activeValue={prefs.themePreset}
                buttonPreset={buttonPreset}
                description="Swap the shell chrome, surfaces, accents, and analytical canvas tone."
                icon={Palette}
                onChange={setThemePreset}
                options={uiThemeOptions}
                title="Color Scheme"
              />

              <Separator className="ui-studio-divider" />

              <OptionGroup
                activeValue={prefs.densityPreset}
                buttonPreset={buttonPreset}
                description="Tune spacing, control height, and table compactness."
                icon={Rows3}
                onChange={setDensityPreset}
                options={uiDensityOptions}
                title="Density"
              />

              <Separator className="ui-studio-divider" />

              <OptionGroup
                activeValue={prefs.radiusPreset}
                buttonPreset={buttonPreset}
                description="Adjust panel and control corner geometry without changing the layout."
                icon={Radius}
                onChange={setRadiusPreset}
                options={uiRadiusOptions}
                title="Corner Radius"
              />

              <Separator className="ui-studio-divider" />

              <OptionGroup
                activeValue={prefs.buttonPreset}
                buttonPreset={buttonPreset}
                description="Restyle the segmented controls and quick-action buttons used across the shell."
                icon={SquareDashedMousePointer}
                onChange={setButtonPreset}
                options={uiButtonOptions}
                title="Button Style"
              />
            </div>
          </ScrollArea>

          <SheetFooter className="border-t border-[var(--ui-border)] pt-5">
            <Button
              className="ui-studio-toggle"
              data-active={false}
              data-button-style={buttonPreset}
              onClick={resetPrefs}
              type="button"
              variant="outline"
            >
              Reset to Default
            </Button>
            <SheetClose asChild>
              <Button
                className="ui-studio-toggle"
                data-active
                data-button-style={buttonPreset}
                type="button"
                variant="default"
              >
                Close
              </Button>
            </SheetClose>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
