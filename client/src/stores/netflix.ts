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
    };
  },
  getters: {
  },
  actions: {
    // get(callback) {
    //   axios.get(`${this.dataServerUrl}/get`).then(
    //     (response) => {
    //       callback(response.data);
    //     },
    //     (errResponse) => {
    //       console.log(errResponse);
    //     }
    //   );
    // },
    // getData(callback) {
    //   axios.get(`${this.dataServerUrl}/get_data`).then(
    //     (response) => {
    //       callback(response.data);
    //     },
    //     (errResponse) => {
    //       console.log(errResponse);
    //     }
    //   );
    // },
    // // HTTP POST request
    // post(param, callback) {
    //   axios.post(`${this.dataServerUrl}/post`, param).then(
    //     (response) => {
    //       callback(response.data);
    //     },
    //     (errResponse) => {
    //       console.log(errResponse);
    //     }
    //   );
    // },
  },
});
