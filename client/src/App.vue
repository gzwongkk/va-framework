<template>
  <a-row :gutter="[2, 2]">
    <a-col :span="6">
      <div class="top_container">
        {{ get }}
        <br>
        {{ getData }}
        <br>
        {{ loadData }}
      </div>
    </a-col>
    <a-col :span="12">
      <div class="top_container">
        <img alt="Vue logo" src="./assets/logo.png">
      </div>
    </a-col>
    <a-col :span="6">
      <div class="top_container">
        {{dataName && dataValue? dataName + ' : ' + dataValue: 'click on bars in d3 to initiate events'}}
      </div>
    </a-col>
  </a-row>
  <a-row :gutter="[2, 2]">
    <a-col :span="12">
      <div id="echarts_container">
        <echarts-bar
            class="echarts"
            :get-data="getData"></echarts-bar>
      </div>
    </a-col>
    <a-col :span="12">
      <div id="d3_container">
        <d3-bar
            class="d3"
            :load-data="loadData"
            @selected="onSelected"></d3-bar>
      </div>
    </a-col>
  </a-row>
</template>

<script>
import DataService from "./utils/data-service";
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
      get: null,
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
    DataService.get(data => {
      this.get = data;
    });

    DataService.getData(data => {
      this.getData = data;
    });

    // HTTP POST request
    DataService.post(this.loadParam, (data) => {
      this.loadData = data;
    });
  },
  methods: {
    // Event handling for d3-bar
    onSelected(name, value) {
      this.dataName = name;
      this.dataValue = value;
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  width: 1600px;
  height: 900px;
  margin: 2px;
  border: 1px solid lightblue;
}

.top_container{
  box-sizing: border-box;
  height: 300px;
  width: 100%;
  margin-bottom: 2px;
  border: 1px solid darkred;
}

#echarts_container{
  box-sizing: border-box;
  height: 600px;
  width: 100%;
  border: 1px solid darkblue;
}

#d3_container{
  box-sizing: border-box;
  height: 600px;
  width: 100%;
  border: 1px solid darkgreen;
}
</style>
