import { defineStore } from "pinia";

// import axios from "axios";
// const DATA_SERVER_URL = "http://127.0.0.1:5000";

import DatasaurusDozen from "../assets/DatasaurusDozen.json";

export const useStore = defineStore("datasaurus", {
  state: () => {
    return {
      // from JSON files
      datasaurusDozen: DatasaurusDozen,

      selectedData: "dino",
    };
  },
  getters: {
    datasets() {
      return [...new Set(this.datasaurusDozen.map((d) => d.dataset))];
    },
    datasaurus() {
      return this.datasaurusDozen.filter(
        (d) => d.dataset === this.selectedData
      );
    },
  },
  actions: {
    selectData(datum) {
      this.selectedData = datum;
    },
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
