<template>
    <div id="echarts-bar"></div>
</template>

<script>
  /*
  This component demonstrates one way to construct Echarts visualization.
  Echarts example source: https://echarts.apache.org/examples/en/editor.html?c=bar-animation-delay
  Documentation for option: https://www.echartsjs.com/en/option.html
   */
  import * as echarts from "echarts";

  export default {
    name: "EchartsBar",
    props:{
      getData: Object,
    },
    data() {
      return {
        barChart: null,
      }
    },
    watch:{
      getData: function() {
        // When data is changed in parent, render this component
        this.renderBarChart();
      },
    },
    mounted:function(){
      this.initBarChart();
      this.renderBarChart();
    },
    methods: {
      initBarChart() {
        // Initialize echarts
        this.barChart = echarts.init(document.getElementById('echarts-bar'));

        // Axis categories
        let xAxisData = [];
        for (let i = 0; i < 100; i++) {
          xAxisData.push('class' + i);
        }

        // Configure the layout for echarts
        this.barChart.setOption({
          title: {
            text: 'bar chart'
          },
          legend: {
            data: ['bar', 'bar2']
          },
          toolbox: {
            feature: {
              magicType: {
                type: ['stack', 'tiled']
              },
              dataView: {},
            }
          },
          tooltip: {},
          xAxis: {
            data: xAxisData,
            splitLine: {
              show: false
            }
          },
          yAxis: {
          },
          series: [{
            name: 'bar',
            type: 'bar',
            animationDelay: function (idx) {
              return idx * 10;
            }
          }, {
            name: 'bar2',
            type: 'bar',
            animationDelay: function (idx) {
              return idx * 10 + 100;
            }
          }],
          animationEasing: 'elasticOut',
          animationDelayUpdate: function (idx) {
            return idx * 5;
          }
        })
      },
      renderBarChart() {
        // data
        let data1 = [];
        let data2 = [];
        for (let i = 0; i < 100; i++) {
          data1.push((Math.sin(i / 5) * (i / 5 -10) + i / 6) * 5);
          data2.push((Math.cos(i / 5) * (i / 5 -10) + i / 6) * 5);
        }
        this.barChart.setOption({
          series: [{
            name: 'bar',
            data: data1,
          }, {
            name: 'bar2',
            data: data2,
          }],
        });
      }
    }
  }
</script>

<style scoped>

</style>