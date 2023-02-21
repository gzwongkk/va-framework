import { defineStore } from 'pinia';
import * as d3 from 'd3';

const colorScale = d3
  .scaleSequential()
  .domain([-1, 1])
  .interpolator(d3.interpolateBrBG);

// http://veli.ee/colorpedia/?c=4E6F72
const color: { [id: string]: string } = {
  /**
   * triad colors that complement each other
   */
  type_one_dark: '#526634',
  type_one: '#91B25B',
  type_one_light: '#C8D8AD',

  type_two_dark: '#663336',
  type_two: '#B25960',
  type_two_light: '#D8ADB2',

  type_three_dark: '#473466',
  type_three: '#7D5BB2',
  type_three_light: '#BEADD8',

  /**
   * tetrad colors that complement each other
   */
  bg_dark: '#344B4C', // Limed Spruce
  bg: '#4E6F72', // Cutty Sark
  bg_light: '#689699', // Gothic
  bg_lighter: '#82B9BF', // Neptune
  bg_lightest: '#9CDEE5', // Water Leaf
  bg_very_light: '#ADF6FF', // Anakiwa
  bg_white: '#ECEFF1',
  bg_colorblind: '#656565', //Dove Gray
  bg_colorblind_light: '#E1E1E1', // Mercury

  com_dark: '#4C3434', // Woody Brown
  com: '#724F4E', // Ferra, complement Cutty Sark
  com_light: '#996968', // Copper Rose

  tri_one_dark: '#4B4C34', // Kelp
  tri_one: '#70724E', // Go Ben, Triadic of Cutty Sark
  tri_one_light: '#969968', // Avocado
  tri_one_lighter: '#BBBF82', // Gimblet
  tri_one_lightest: '#E0E59C', // Zombie
  tri_one_very_light: '#F9FFAD', // Tidal

  tri_two_dark: '#4C344B', // Eggplant
  tri_two: '#724E70', // Eggplant, Triadic of Cutty Sark
  tri_two_light: '#996896', // Strikemaster
  tri_two_lighter: '#BF82BB', // Viola
  tri_two_lightest: '#D893D4', // Light Orchid
  tri_two_very_light: '#FFADF9', // Lavender Rose

  /**
   * sequential color
   */
  pos_darker: '#01665e',
  pos_dark: '#35978f',
  pos: '#5ab4ac',
  pos_light: '#80cdc1',
  pos_lighter: '#c7eae5',
  neu: '#f5f5f5',
  neg_lighter: '#f6e8c3',
  neg_light: '#dfc27d',
  neg: '#d8b365',
  neg_dark: '#bf812d',
  neg_darker: '#8c510a',
  // pos_dark: colorScale(0.8),
  // pos: colorScale(0.6),
  // neg: colorScale(-0.6),
  // neg_dark: colorScale(-0.8),

  // '#7FFFF4', '#FF7F8A', Aquamarine, Geraldine
  // '#6DDBD2', '#D86C75', Viking, Japonica
  // '#5AB5AD', '#B25960', Tradewind, Matrix
  // '#478E88', '#8C464B', Smalt Blue, Copper Rust
  // '#346864', '#663336', William, Buccaneer
};

export const useConfig = defineStore('va', {
  state: () => {
    return {
      language: true, // true for English, false for Chinese
      color: color,
      isComposition: false,
      hasServer: false,
    };
  },
});
