/**
 * This pinia store loads static json resources.
 * The dataset is adopted from https://www.autodesk.com/research/publications/same-stats-different-graphs.
 * It contains data points that are "identical over a number of statistical properties, yet produce dissimilar graphs".
 **/

import { defineStore } from 'pinia';
import * as d3 from 'd3';

import DatasaurusDozenJson from '../assets/DatasaurusDozen.json';

/**
 * We define interface or types for Typescript to enhance type inference and readability.
 */
export interface DataPoint {
  x: number;
  y: number;
}

export type DatasaurusDozen = DataPoint & {
  dataset: string;
};

export const useDatasaurusStore = defineStore({
  id: 'datasaurus',
  state: () => {
    return {
      // from JSON files
      datasaurusDozen: DatasaurusDozenJson as DatasaurusDozen[],

      // storing variables in pinia is more convenient when we need to communicate various components.
      // see DatasaurusLegend.vue for props-emit pattern
      selectedDataset: 'dino' as string,
    };
  },
  getters: {
    /**
     * Obtain the list of dataset names in DatasaurusDozen.
     * @returns a set of unique data names
     */
    nameList(): string[] {
      return [...new Set(this.datasaurusDozen.map((d) => d.dataset))];
    },
    /**
     * Obtain the DataPoints in the selected dataset. They are centered around mean for better layout.
     * @returns an array of DataPoints centered around mean
     */
    data(): DataPoint[] {
      // Filter the selected data type
      let rawData = this.datasaurusDozen.filter(
        (d) => d.dataset === this.selectedDataset
      );

      // center the points around mean
      let mean_x = d3.mean(rawData, (d) => d.x) || 0,
        mean_y = d3.mean(rawData, (d) => d.y) || 0;
      return rawData.map((d) => {
        return { x: d.x - mean_x, y: d.y - mean_y };
      });
    },
  },
  actions: {
    selectDataType(datum: string): void {
      this.selectedDataset = datum;
    },
  },
});
