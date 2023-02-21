/**
 * This pinia store loads static json resources.
 * The dataset is adopted from https://www.kaggle.com/datasets/shivamb/netflix-shows.
 * This example is intended for static deployment on github page.
 * For deployment requiring backend processing, please refer to client/src/stores/netflix.ts
 **/

import { defineStore } from 'pinia';
import type { Show, DistCount } from './netflix';
import NetflixBillBurrJson from '../assets/NetflixBillBurr.json';
import NetflixCountryJson from '../assets/NetflixCountry.json';
import NetflixGenreJson from '../assets/NetflixGenre.json';
import NetflixReleaseYearJson from '../assets/NetflixReleaseYear.json';

export const useStaticNetflixStore = defineStore({
  id: 'netflix',
  state: () => {
    return {
      netflixDist: [] as DistCount[],
      billBurr: NetflixBillBurrJson as Show[],

      displayMax: 10 as number,
    };
  },
  getters: {
    netflixDistTopList(): DistCount[] {
      return this.netflixDist
        .sort((a: DistCount, b: DistCount) => b.count - a.count)
        .slice(0, this.displayMax);
    },
  },
  actions: {
    get_bill_burr() {
      this.billBurr = NetflixBillBurrJson;
    },
    get_year_distribution() {
      this.netflixDist = NetflixReleaseYearJson;
    },
    get_country_distribution() {
      this.netflixDist = NetflixCountryJson;
    },
    get_genre_distribution() {
      this.netflixDist = NetflixGenreJson;
    },
  },
});
