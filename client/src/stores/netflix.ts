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

export const useNetflixStore = defineStore({
  id: 'netflix',
  state: () => {
    return {
      // from API
      netflix: [],
      billBurr: [],
    };
  },
  getters: {},
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
    get_bill_burr() {
      this.get('get_bill_burr', (data: any) => {
        console.log(data);
      });
    },
    // the async and await version if you do not use generic requests
    async get_bill_burr_async() {
      try {
        this.billBurr = await axios.get(`${DATA_SERVER_URL}/get_bill_burr`);
        console.log(this.billBurr);
      } catch (error) {
        alert(error);
      }
    },
  },
});
