/**
 * This pinia store demonstrate a way to load dynamic json resources from server.
 * The dataset is adopted from https://www.kaggle.com/datasets/shivamb/netflix-shows.
 * "This tabular dataset consists of listings of all the movies and tv shows available on Netflix, 
 * along with details such as - cast, directors, ratings, release year, duration, etc."
 * Understanding what content is available in different countries
Identifying similar content by matching text-based features
Network analysis of Actors / Directors and find interesting insights
Does Netflix has more focus on TV Shows than movies in recent years.
 **/

import { defineStore } from 'pinia';
import axios from 'axios';
const DATA_SERVER_URL = 'http://127.0.0.1:5000';

/**
 * We define interface or types for Typescript to enhance type inference and readability.
 */
export interface Show {
  show_id: string;
  type: string;
  title: string;
  director: string | null;
  cast: string;
  country: string;
  date_added: string;
  release_year: number;
  rating: string;
  duration: string;
  listed_in: string;
  description: string;
}

export interface DistCount {
  dtype: string | number;
  count: number;
}

export const useNetflixStore = defineStore({
  id: 'netflix',
  state: () => {
    return {
      // from API
      netflixDist: [] as DistCount[],
      billBurr: [] as Show[],

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
    // generic HTTP GET request
    get(api: string, callback: Function) {
      axios.get(`${DATA_SERVER_URL}/${api}`).then(
        (response) => {
          callback(response.data);
        },
        (errResponse) => {
          console.log(errResponse);
        }
      );
    },
    // generic HTTP POST request
    post(api: string, param: object, callback: Function) {
      axios.post(`${DATA_SERVER_URL}/${api}`, param).then(
        (response) => {
          callback(response.data);
        },
        (errResponse) => {
          console.log(errResponse);
        }
      );
    },
    // the async and await version if you do not use generic requests
    async get_bill_burr_async() {
      try {
        let response = await axios.get(`${DATA_SERVER_URL}/get_bill_burr`);
        this.billBurr = response.data;
      } catch (error) {
        alert(error);
      }
    },
    get_bill_burr() {
      this.get('get_bill_burr', (data: Show[]) => {
        this.billBurr = data;
      });
    },
    get_year_distribution() {
      this.get('get_year_distribution', (data: DistCount[]) => {
        this.netflixDist = data;
      });
    },
    get_country_distribution() {
      this.get('get_country_distribution', (data: DistCount[]) => {
        this.netflixDist = data;
      });
    },
    get_genre_distribution() {
      this.get('get_genre_distribution', (data: DistCount[]) => {
        this.netflixDist = data;
      });
    },
  },
});
