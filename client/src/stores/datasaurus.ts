/**
 * This pinia store loads static json resources.
 * The dataset is adopted from https://www.autodesk.com/research/publications/same-stats-different-graphs.
 * It contains data points that are "identical over a number of statistical properties, yet produce dissimilar graphs".
 **/

import { defineStore } from 'pinia';

import DatasaurusDozenJson from '../assets/DatasaurusDozen.json';

export interface dataPoint {
  x: number;
  y: number;
}

export type DatasaurusDozen = dataPoint & {
  dataset: string;
};

export const useDatasaurusStore = defineStore({
  id: 'datasaurus',
  state: () => {
    return {
      // from JSON files
      datasaurusDozen: DatasaurusDozenJson as DatasaurusDozen[],

      selectedDataType: 'dino' as string,
    };
  },
  getters: {
    nameList(): string[] {
      return [...new Set(this.datasaurusDozen.map((d) => d.dataset))];
    },
    data(): dataPoint[] {
      return this.datasaurusDozen.filter(
        (d) => d.dataset === this.selectedDataType
      );
    },
  },
  actions: {
    selectDataType(datum: string) {
      this.selectedDataType = datum;
    },
  },
});
