import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { visualizationCatalog } from '../lib/visualization-catalog';

const APP_ROOT = resolve(import.meta.dirname);

describe('app route smoke', () => {
  it('ships the main route entry files', () => {
    expect(existsSync(resolve(APP_ROOT, 'page.tsx'))).toBe(true);
    expect(existsSync(resolve(APP_ROOT, 'gallery', 'page.tsx'))).toBe(true);
    expect(existsSync(resolve(APP_ROOT, 'cars', 'page.tsx'))).toBe(true);
    expect(existsSync(resolve(APP_ROOT, 'examples', '[exampleId]', 'page.tsx'))).toBe(true);
  });

  it('maps every registered example route to the dynamic example page', () => {
    for (const example of visualizationCatalog) {
      expect(example.routePath.startsWith('/examples/')).toBe(true);
    }
  });
});
