import { describe, expect, it } from 'vitest';

import {
  defaultUiStudioPrefs,
  resolveChartTheme,
  resolveUiStudioVars,
} from './ui-studio';

describe('ui studio presets', () => {
  it('exposes the 1600x1000 shell as the default preset', () => {
    const vars = resolveUiStudioVars(defaultUiStudioPrefs);

    expect(defaultUiStudioPrefs).toEqual({
      buttonPreset: 'outline',
      densityPreset: 'balanced',
      radiusPreset: 'standard',
      shellPreset: 'desktop-1600',
      themePreset: 'light-console',
    });
    expect(vars['--ui-shell-target-width']).toBe('1600px');
    expect(vars['--ui-shell-target-height']).toBe('1000px');
    expect(vars['--ui-shell-left-rail']).toBe('284px');
    expect(vars['--ui-shell-right-rail']).toBe('324px');
  });

  it('maps the workstation preset into a larger desktop frame', () => {
    const vars = resolveUiStudioVars({
      ...defaultUiStudioPrefs,
      shellPreset: 'workstation',
    });

    expect(vars['--ui-shell-target-width']).toBe('1728px');
    expect(vars['--ui-shell-target-height']).toBe('1117px');
    expect(vars['--ui-shell-table-height']).toBe('336px');
  });

  it('switches theme tokens and chart colors together', () => {
    const vars = resolveUiStudioVars({
      ...defaultUiStudioPrefs,
      buttonPreset: 'solid-accent',
      densityPreset: 'comfortable',
      radiusPreset: 'soft',
      themePreset: 'warm-paper',
    });
    const chartTheme = resolveChartTheme({
      ...defaultUiStudioPrefs,
      themePreset: 'warm-paper',
    });

    expect(vars['--ui-accent']).toBe('#8a5a35');
    expect(vars['--ui-control-height']).toBe('2.7rem');
    expect(vars['--ui-radius-shell']).toBe('2.9rem');
    expect(vars['--ui-radius-panel']).toBe('1.85rem');
    expect(chartTheme.selectionStroke).toBe('#5a3f2a');
    expect(chartTheme.textPrimary).toBe('#34291f');
  });
});
