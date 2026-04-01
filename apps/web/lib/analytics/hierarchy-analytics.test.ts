import { describe, expect, it } from 'vitest';

import { limitHierarchyDepth, resolveHierarchyVariant } from './hierarchy-analytics';

describe('hierarchy analytics', () => {
  it('maps hierarchy variants onto tree renderer settings', () => {
    expect(resolveHierarchyVariant('tidy-tree')).toEqual({
      alignment: 'axis-parallel',
      mode: 'node-link',
    });
    expect(resolveHierarchyVariant('treemap')).toEqual({
      alignment: 'axis-parallel',
      mode: 'treemap',
    });
  });

  it('limits hierarchy depth without mutating the original root shape', () => {
    const root = {
      attributes: {},
      children: [
        {
          attributes: {},
          children: [
            {
              attributes: {},
              children: [],
              degree: 0,
              depth: 2,
              group: 1,
              id: 'leaf',
              label: 'Leaf',
              value: 1,
              weightedDegree: 0,
            },
          ],
          degree: 0,
          depth: 1,
          group: 1,
          id: 'child',
          label: 'Child',
          value: 1,
          weightedDegree: 0,
        },
      ],
      degree: 0,
      depth: 0,
      group: 0,
      id: 'root',
      label: 'Root',
      value: 2,
      weightedDegree: 0,
    };

    const trimmed = limitHierarchyDepth(root, 1);

    expect(trimmed?.children).toHaveLength(1);
    expect(trimmed?.children[0]?.children).toHaveLength(0);
    expect(root.children[0]?.children).toHaveLength(1);
  });
});
