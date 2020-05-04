<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
    <br>
    {{ getData }}
    <br>
    {{ loadData }}
    <br>
    <br>
    {{dataName && dataValue? dataName + ' : ' + dataValue: 'click on bars in d3 to initiate events'}}
    <br>
    <br>
    <echarts-bar class="echarts" :get-data="getData"></echarts-bar>
    <d3-bar class="d3" :load-data="loadData"></d3-bar>
  </div>
</template>

<script>
  import DataService from "./utils/data-service";
  import EventService from "./utils/event-service";
  import EchartsBar from "./components/echarts-bar";
  import D3Bar from "./components/d3-bar";

  export default {
    name: 'App',
    components: {
      D3Bar,
      EchartsBar
    },
    data() {
      return {
        // data for HTTP requests in DataService
        getData: null,
        loadParam: {'data': 'load'},
        loadData: null,

        // data for event handling in EventService
        dataName: null,
        dataValue: null
      }
    },
    mounted () {
      // HTTP GET request
      DataService.loadGet((data) => {
        this.getData = data;
      });

      // HTTP POST request
      DataService.loadPost(this.loadParam, (data) => {
        this.loadData = data;
      });

      // Event handling for d3-bar
      EventService.onSelected((name, value) => {
        this.dataName = name;
        this.dataValue = value;
      });
    }
  }
</script>

<style>
  #app {
    font-family: Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
  }

  .echarts{
    position:absolute;
    left: 3%;
    width: 45%;
    height: 400px;
    border: 2px solid steelblue;
    border-radius: 4px;
  }

  .d3{
    position:absolute;
    right: 3%;
    width: 45%;
    height: 400px;
    border: 2px solid darkred;
    border-radius: 4px;
  }
</style>
