'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  defaultUiStudioPrefs,
  type UiButtonPreset,
  type UiDensityPreset,
  type UiRadiusPreset,
  type UiShellPreset,
  type UiStudioPrefs,
  type UiThemePreset,
} from './ui-studio';

type UiStudioStore = {
  prefs: UiStudioPrefs;
  resetPrefs: () => void;
  setButtonPreset: (buttonPreset: UiButtonPreset) => void;
  setDensityPreset: (densityPreset: UiDensityPreset) => void;
  setRadiusPreset: (radiusPreset: UiRadiusPreset) => void;
  setShellPreset: (shellPreset: UiShellPreset) => void;
  setThemePreset: (themePreset: UiThemePreset) => void;
};

function updatePrefs<K extends keyof UiStudioPrefs>(
  prefs: UiStudioPrefs,
  key: K,
  value: UiStudioPrefs[K],
) {
  if (prefs[key] === value) {
    return prefs;
  }

  return {
    ...prefs,
    [key]: value,
  };
}

export const useUiStudioStore = create<UiStudioStore>()(
  persist(
    (set) => ({
      prefs: defaultUiStudioPrefs,
      resetPrefs: () => set({ prefs: defaultUiStudioPrefs }),
      setButtonPreset: (buttonPreset) =>
        set((state) => ({ prefs: updatePrefs(state.prefs, 'buttonPreset', buttonPreset) })),
      setDensityPreset: (densityPreset) =>
        set((state) => ({ prefs: updatePrefs(state.prefs, 'densityPreset', densityPreset) })),
      setRadiusPreset: (radiusPreset) =>
        set((state) => ({ prefs: updatePrefs(state.prefs, 'radiusPreset', radiusPreset) })),
      setShellPreset: (shellPreset) =>
        set((state) => ({ prefs: updatePrefs(state.prefs, 'shellPreset', shellPreset) })),
      setThemePreset: (themePreset) =>
        set((state) => ({ prefs: updatePrefs(state.prefs, 'themePreset', themePreset) })),
    }),
    {
      name: 'va-ui-studio-store',
      partialize: (state) => ({
        prefs: state.prefs,
      }),
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
