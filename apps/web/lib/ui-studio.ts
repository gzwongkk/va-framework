'use client';

import type { D3ScatterPlotTheme } from '@va/vis-core';

export type UiShellPreset = 'desktop-1440' | 'desktop-1600' | 'workstation';
export type UiThemePreset = 'light-console' | 'cool-lab' | 'warm-paper';
export type UiDensityPreset = 'compact' | 'balanced' | 'comfortable';
export type UiRadiusPreset = 'tight' | 'standard' | 'soft';
export type UiButtonPreset = 'outline' | 'solid-accent' | 'minimal';

export type UiStudioPrefs = {
  buttonPreset: UiButtonPreset;
  densityPreset: UiDensityPreset;
  radiusPreset: UiRadiusPreset;
  shellPreset: UiShellPreset;
  themePreset: UiThemePreset;
};

type LabeledPresetOption<T extends string> = {
  description: string;
  label: string;
  value: T;
};

type ShellPresetConfig = {
  leftRail: number;
  rightRail: number;
  tableHeight: number;
  targetHeight: number;
  targetWidth: number;
};

type ThemePresetConfig = {
  accent: string;
  accentBorder: string;
  accentContrast: string;
  accentSoft: string;
  accentText: string;
  badgeBackground: string;
  badgeBorder: string;
  badgeText: string;
  border: string;
  borderSubtle: string;
  centerBackground: string;
  chart: D3ScatterPlotTheme;
  detailBackground: string;
  divider: string;
  headerBackground: string;
  iconBackground: string;
  iconText: string;
  pageBackground: string;
  panelBackground: string;
  panelMutedBackground: string;
  railBackground: string;
  selectionHighlight: string;
  shellBackground: string;
  shellShadow: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
};

type DensityPresetConfig = {
  bodySize: string;
  bodyLineHeight: string;
  controlHeight: string;
  detailMetricGap: string;
  drawerPadding: string;
  headerPadding: string;
  labelSize: string;
  metricValueSize: string;
  panelGap: string;
  panelPadding: string;
  shellTitleSize: string;
  stagePadding: string;
  statusSize: string;
  tableCellX: string;
  tableCellY: string;
};

type RadiusPresetConfig = {
  control: string;
  panel: string;
  pill: string;
  shell: string;
};

export type UiStudioCssVars = Record<`--${string}`, string>;

export const defaultUiStudioPrefs: UiStudioPrefs = {
  buttonPreset: 'outline',
  densityPreset: 'balanced',
  radiusPreset: 'standard',
  shellPreset: 'desktop-1600',
  themePreset: 'light-console',
};

export const uiShellOptions: LabeledPresetOption<UiShellPreset>[] = [
  {
    description: 'A tighter laptop-class shell for smaller desktop windows.',
    label: '1440×900',
    value: 'desktop-1440',
  },
  {
    description: 'The default desktop browser target with a larger working canvas.',
    label: '1600×1000',
    value: 'desktop-1600',
  },
  {
    description: 'A wider monitor preset with more stage depth and longer rails.',
    label: 'Workstation',
    value: 'workstation',
  },
];

export const uiThemeOptions: LabeledPresetOption<UiThemePreset>[] = [
  {
    description: 'The current light analytical shell with cyan accents.',
    label: 'Light Console',
    value: 'light-console',
  },
  {
    description: 'A cooler lab surface with deeper steel blues.',
    label: 'Cool Lab',
    value: 'cool-lab',
  },
  {
    description: 'A warmer paper-like console with clay accents.',
    label: 'Warm Paper',
    value: 'warm-paper',
  },
];

export const uiDensityOptions: LabeledPresetOption<UiDensityPreset>[] = [
  {
    description: 'Pack more controls and records into the same frame.',
    label: 'Compact',
    value: 'compact',
  },
  {
    description: 'The default balance between density and breathing room.',
    label: 'Balanced',
    value: 'balanced',
  },
  {
    description: 'Loosen spacing for a calmer editorial feel.',
    label: 'Comfortable',
    value: 'comfortable',
  },
];

export const uiRadiusOptions: LabeledPresetOption<UiRadiusPreset>[] = [
  {
    description: 'Sharper panel and control geometry.',
    label: 'Tight',
    value: 'tight',
  },
  {
    description: 'The current balanced panel rounding.',
    label: 'Standard',
    value: 'standard',
  },
  {
    description: 'Softer corners across the workspace.',
    label: 'Soft',
    value: 'soft',
  },
];

export const uiButtonOptions: LabeledPresetOption<UiButtonPreset>[] = [
  {
    description: 'Bordered segmented controls with analytical restraint.',
    label: 'Outline',
    value: 'outline',
  },
  {
    description: 'Heavier accent-backed controls for stronger emphasis.',
    label: 'Solid Accent',
    value: 'solid-accent',
  },
  {
    description: 'Low-chrome segmented controls with lighter boundaries.',
    label: 'Minimal',
    value: 'minimal',
  },
];

const shellPresets: Record<UiShellPreset, ShellPresetConfig> = {
  'desktop-1440': {
    leftRail: 260,
    rightRail: 300,
    tableHeight: 270,
    targetHeight: 900,
    targetWidth: 1440,
  },
  'desktop-1600': {
    leftRail: 284,
    rightRail: 324,
    tableHeight: 308,
    targetHeight: 1000,
    targetWidth: 1600,
  },
  workstation: {
    leftRail: 306,
    rightRail: 356,
    tableHeight: 336,
    targetHeight: 1117,
    targetWidth: 1728,
  },
};

const themePresets: Record<UiThemePreset, ThemePresetConfig> = {
  'light-console': {
    accent: '#2f607d',
    accentBorder: '#9fc6dc',
    accentContrast: '#f7fbfd',
    accentSoft: '#e6f3f8',
    accentText: '#1b4e69',
    badgeBackground: 'rgba(255,255,255,0.82)',
    badgeBorder: 'rgba(150, 167, 183, 0.48)',
    badgeText: '#526172',
    border: 'rgba(146, 164, 180, 0.46)',
    borderSubtle: 'rgba(165, 180, 194, 0.34)',
    centerBackground: 'rgba(255,255,255,0.97)',
    chart: {
      axisDomainColor: '#8fa3b4',
      axisTickColor: '#526172',
      borderColor: 'rgba(146, 164, 180, 0.46)',
      emptyBackground: 'rgba(243, 247, 250, 0.9)',
      frameBackground: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(246,250,252,0.98) 100%)',
      gridColor: '#d7e0e7',
      headerBackground: 'linear-gradient(180deg, rgba(249,251,252,0.98) 0%, rgba(244,248,250,0.95) 100%)',
      plotBackground: 'linear-gradient(180deg, rgba(251,253,254,0.98) 0%, rgba(246,250,252,0.98) 100%)',
      selectionStroke: '#102331',
      shadow: '0 20px 60px -42px rgba(15,23,42,0.45)',
      textPrimary: '#0f172a',
      textSecondary: '#526172',
    },
    detailBackground: 'rgba(241, 246, 248, 0.96)',
    divider: 'rgba(150, 166, 181, 0.56)',
    headerBackground: 'linear-gradient(180deg, rgba(247,250,252,0.96) 0%, rgba(241,246,248,0.92) 100%)',
    iconBackground: 'rgba(255,255,255,0.76)',
    iconText: '#526172',
    pageBackground:
      'linear-gradient(rgba(146, 167, 186, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(146, 167, 186, 0.08) 1px, transparent 1px), radial-gradient(circle at top, rgba(88, 168, 196, 0.14), transparent 34%), linear-gradient(180deg, #f8fbfc 0%, #f2f6f8 48%, #eef3f5 100%)',
    panelBackground: 'rgba(255,255,255,0.84)',
    panelMutedBackground: 'rgba(246, 249, 251, 0.92)',
    railBackground: 'rgba(241, 246, 248, 0.96)',
    selectionHighlight: 'rgba(222, 244, 250, 0.88)',
    shellBackground: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(246,250,252,0.98) 100%)',
    shellShadow: '0 28px 90px -48px rgba(15,23,42,0.46)',
    textMuted: '#728394',
    textPrimary: '#0f172a',
    textSecondary: '#526172',
  },
  'cool-lab': {
    accent: '#21506b',
    accentBorder: '#8bb5cf',
    accentContrast: '#f6fbfd',
    accentSoft: '#dfeff7',
    accentText: '#17445e',
    badgeBackground: 'rgba(240, 246, 250, 0.9)',
    badgeBorder: 'rgba(120, 149, 170, 0.46)',
    badgeText: '#466072',
    border: 'rgba(120, 147, 166, 0.44)',
    borderSubtle: 'rgba(145, 165, 182, 0.3)',
    centerBackground: 'rgba(247, 251, 253, 0.98)',
    chart: {
      axisDomainColor: '#7f98ab',
      axisTickColor: '#476173',
      borderColor: 'rgba(120, 147, 166, 0.44)',
      emptyBackground: 'rgba(237, 244, 248, 0.94)',
      frameBackground: 'linear-gradient(180deg, rgba(247,251,253,0.98) 0%, rgba(239,246,250,0.98) 100%)',
      gridColor: '#cfdae3',
      headerBackground: 'linear-gradient(180deg, rgba(242,248,251,0.98) 0%, rgba(234,242,247,0.95) 100%)',
      plotBackground: 'linear-gradient(180deg, rgba(248,252,253,0.98) 0%, rgba(239,246,250,0.98) 100%)',
      selectionStroke: '#0e2533',
      shadow: '0 22px 66px -44px rgba(10, 30, 43, 0.42)',
      textPrimary: '#0f1f2d',
      textSecondary: '#476173',
    },
    detailBackground: 'rgba(234, 242, 247, 0.96)',
    divider: 'rgba(123, 148, 166, 0.52)',
    headerBackground: 'linear-gradient(180deg, rgba(242,248,251,0.97) 0%, rgba(232,240,245,0.93) 100%)',
    iconBackground: 'rgba(247, 251, 253, 0.8)',
    iconText: '#456173',
    pageBackground:
      'linear-gradient(rgba(114, 140, 160, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(114, 140, 160, 0.08) 1px, transparent 1px), radial-gradient(circle at top, rgba(91, 151, 191, 0.16), transparent 32%), linear-gradient(180deg, #f3f8fb 0%, #e8f0f5 55%, #e0ebf2 100%)',
    panelBackground: 'rgba(247, 251, 253, 0.86)',
    panelMutedBackground: 'rgba(238, 245, 249, 0.94)',
    railBackground: 'rgba(236, 244, 248, 0.96)',
    selectionHighlight: 'rgba(214, 232, 242, 0.92)',
    shellBackground: 'linear-gradient(180deg, rgba(247,251,253,0.94) 0%, rgba(239,246,250,0.98) 100%)',
    shellShadow: '0 30px 96px -50px rgba(10, 30, 43, 0.42)',
    textMuted: '#698091',
    textPrimary: '#0f1f2d',
    textSecondary: '#466072',
  },
  'warm-paper': {
    accent: '#8a5a35',
    accentBorder: '#d6b28e',
    accentContrast: '#fffaf5',
    accentSoft: '#f6e9dd',
    accentText: '#7b4f2d',
    badgeBackground: 'rgba(255, 249, 242, 0.9)',
    badgeBorder: 'rgba(186, 154, 120, 0.42)',
    badgeText: '#735e49',
    border: 'rgba(187, 160, 132, 0.4)',
    borderSubtle: 'rgba(197, 172, 147, 0.3)',
    centerBackground: 'rgba(255, 251, 247, 0.98)',
    chart: {
      axisDomainColor: '#b39679',
      axisTickColor: '#6f5b47',
      borderColor: 'rgba(187, 160, 132, 0.4)',
      emptyBackground: 'rgba(250, 244, 236, 0.94)',
      frameBackground: 'linear-gradient(180deg, rgba(255,251,247,0.98) 0%, rgba(252,246,240,0.98) 100%)',
      gridColor: '#ead8c7',
      headerBackground: 'linear-gradient(180deg, rgba(255,249,243,0.98) 0%, rgba(250,242,233,0.95) 100%)',
      plotBackground: 'linear-gradient(180deg, rgba(255,252,249,0.98) 0%, rgba(252,246,240,0.98) 100%)',
      selectionStroke: '#5a3f2a',
      shadow: '0 22px 64px -42px rgba(77, 52, 28, 0.25)',
      textPrimary: '#34291f',
      textSecondary: '#6f5b47',
    },
    detailBackground: 'rgba(249, 243, 236, 0.96)',
    divider: 'rgba(186, 158, 132, 0.5)',
    headerBackground: 'linear-gradient(180deg, rgba(255,249,243,0.97) 0%, rgba(248,239,230,0.93) 100%)',
    iconBackground: 'rgba(255, 252, 248, 0.84)',
    iconText: '#6f5b47',
    pageBackground:
      'linear-gradient(rgba(201, 177, 151, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(201, 177, 151, 0.08) 1px, transparent 1px), radial-gradient(circle at top, rgba(214, 170, 116, 0.16), transparent 34%), linear-gradient(180deg, #fbf6ef 0%, #f5ede3 52%, #efe4d7 100%)',
    panelBackground: 'rgba(255, 252, 248, 0.9)',
    panelMutedBackground: 'rgba(249, 242, 233, 0.95)',
    railBackground: 'rgba(250, 243, 236, 0.97)',
    selectionHighlight: 'rgba(247, 233, 218, 0.92)',
    shellBackground: 'linear-gradient(180deg, rgba(255,252,248,0.94) 0%, rgba(250,244,236,0.98) 100%)',
    shellShadow: '0 28px 90px -48px rgba(77, 52, 28, 0.25)',
    textMuted: '#8a7560',
    textPrimary: '#34291f',
    textSecondary: '#6f5b47',
  },
};

const densityPresets: Record<UiDensityPreset, DensityPresetConfig> = {
  compact: {
    bodyLineHeight: '1.45rem',
    bodySize: '0.9rem',
    controlHeight: '2.4rem',
    detailMetricGap: '0.45rem',
    drawerPadding: '1rem',
    headerPadding: '1rem 1.125rem',
    labelSize: '0.66rem',
    metricValueSize: '1.28rem',
    panelGap: '1rem',
    panelPadding: '1rem',
    shellTitleSize: '1.6rem',
    stagePadding: '1rem',
    statusSize: '0.7rem',
    tableCellX: '0.7rem',
    tableCellY: '0.6rem',
  },
  balanced: {
    bodyLineHeight: '1.55rem',
    bodySize: '0.94rem',
    controlHeight: '2.5rem',
    detailMetricGap: '0.55rem',
    drawerPadding: '1.1rem',
    headerPadding: '1rem 1.25rem',
    labelSize: '0.68rem',
    metricValueSize: '1.45rem',
    panelGap: '1.25rem',
    panelPadding: '1.1rem',
    shellTitleSize: '1.7rem',
    stagePadding: '1.1rem',
    statusSize: '0.72rem',
    tableCellX: '0.75rem',
    tableCellY: '0.65rem',
  },
  comfortable: {
    bodyLineHeight: '1.65rem',
    bodySize: '1rem',
    controlHeight: '2.7rem',
    detailMetricGap: '0.65rem',
    drawerPadding: '1.25rem',
    headerPadding: '1.15rem 1.35rem',
    labelSize: '0.72rem',
    metricValueSize: '1.56rem',
    panelGap: '1.4rem',
    panelPadding: '1.2rem',
    shellTitleSize: '1.84rem',
    stagePadding: '1.2rem',
    statusSize: '0.76rem',
    tableCellX: '0.85rem',
    tableCellY: '0.72rem',
  },
};

const radiusPresets: Record<UiRadiusPreset, RadiusPresetConfig> = {
  soft: {
    control: '1.3rem',
    panel: '1.85rem',
    pill: '999px',
    shell: '2.9rem',
  },
  standard: {
    control: '1.15rem',
    panel: '1.6rem',
    pill: '999px',
    shell: '2.45rem',
  },
  tight: {
    control: '0.9rem',
    panel: '1.3rem',
    pill: '999px',
    shell: '1.95rem',
  },
};

export function resolveUiStudioVars(prefs: UiStudioPrefs): UiStudioCssVars {
  const shell = shellPresets[prefs.shellPreset];
  const theme = themePresets[prefs.themePreset];
  const density = densityPresets[prefs.densityPreset];
  const radius = radiusPresets[prefs.radiusPreset];

  return {
    '--ui-accent': theme.accent,
    '--ui-accent-border': theme.accentBorder,
    '--ui-accent-contrast': theme.accentContrast,
    '--ui-accent-soft': theme.accentSoft,
    '--ui-accent-text': theme.accentText,
    '--ui-badge-background': theme.badgeBackground,
    '--ui-badge-border': theme.badgeBorder,
    '--ui-badge-text': theme.badgeText,
    '--ui-body-line-height': density.bodyLineHeight,
    '--ui-body-size': density.bodySize,
    '--ui-border': theme.border,
    '--ui-border-subtle': theme.borderSubtle,
    '--ui-button-outline-bg': theme.panelBackground,
    '--ui-button-outline-border': theme.border,
    '--ui-button-outline-fg': theme.textSecondary,
    '--ui-button-outline-hover': theme.panelMutedBackground,
    '--ui-button-secondary-bg': theme.panelMutedBackground,
    '--ui-button-secondary-fg': theme.textSecondary,
    '--ui-button-secondary-hover': theme.panelBackground,
    '--ui-button-solid-bg': theme.accent,
    '--ui-button-solid-border': theme.accent,
    '--ui-button-solid-fg': theme.accentContrast,
    '--ui-button-solid-hover': theme.accentText,
    '--ui-center-background': theme.centerBackground,
    '--ui-control-height': density.controlHeight,
    '--ui-detail-background': theme.detailBackground,
    '--ui-detail-metric-gap': density.detailMetricGap,
    '--ui-divider': theme.divider,
    '--ui-drawer-padding': density.drawerPadding,
    '--ui-header-background': theme.headerBackground,
    '--ui-header-padding': density.headerPadding,
    '--ui-icon-background': theme.iconBackground,
    '--ui-icon-text': theme.iconText,
    '--ui-label-size': density.labelSize,
    '--ui-metric-value-size': density.metricValueSize,
    '--ui-page-background': theme.pageBackground,
    '--ui-panel-background': theme.panelBackground,
    '--ui-panel-gap': density.panelGap,
    '--ui-panel-muted-background': theme.panelMutedBackground,
    '--ui-panel-padding': density.panelPadding,
    '--ui-radius-control': radius.control,
    '--ui-radius-panel': radius.panel,
    '--ui-radius-pill': radius.pill,
    '--ui-radius-shell': radius.shell,
    '--ui-rail-background': theme.railBackground,
    '--ui-selection-highlight': theme.selectionHighlight,
    '--ui-shell-background': theme.shellBackground,
    '--ui-shell-left-rail': `${shell.leftRail}px`,
    '--ui-shell-right-rail': `${shell.rightRail}px`,
    '--ui-shell-shadow': theme.shellShadow,
    '--ui-shell-table-height': `${shell.tableHeight}px`,
    '--ui-shell-target-height': `${shell.targetHeight}px`,
    '--ui-shell-target-width': `${shell.targetWidth}px`,
    '--ui-shell-title-size': density.shellTitleSize,
    '--ui-stage-padding': density.stagePadding,
    '--ui-status-size': density.statusSize,
    '--ui-table-cell-x': density.tableCellX,
    '--ui-table-cell-y': density.tableCellY,
    '--ui-text-muted': theme.textMuted,
    '--ui-text-primary': theme.textPrimary,
    '--ui-text-secondary': theme.textSecondary,
  };
}

export function resolveChartTheme(prefs: UiStudioPrefs): D3ScatterPlotTheme {
  return themePresets[prefs.themePreset].chart;
}
