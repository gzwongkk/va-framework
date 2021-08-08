import axios from 'axios'

let DataService = {
  dataServerUrl: 'http://127.0.0.1:5000',
  // HTTP GET request
  get(callback){
    axios.get(`${this.dataServerUrl}/get`)
      .then(response => {
        callback(response.data)
      }, errResponse => {
        console.log(errResponse)
      })
  },
  getData(callback){
    axios.get(`${this.dataServerUrl}/get_data`)
      .then(response => {
        callback(response.data)
      }, errResponse => {
        console.log(errResponse)
      })
  },
  // HTTP POST request
  post(param, callback){
    axios.post(`${this.dataServerUrl}/post`, param)
      .then(response => {
        callback(response.data)
      }, errResponse => {
        console.log(errResponse)
      })
  },
}

export default DataService;
