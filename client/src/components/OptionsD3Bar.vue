<script lang="ts">
/**
 * This component demonstrates basic usage of the options API and TypeScript.
 * The randomly initialized data is plotted with D3.js.
 * D3 rendering is suitable for more complicated interactions and enabling animations.
 * This example initializes the static components and set up a timer for changes.
 */
import * as d3 from 'd3';
import { defineComponent } from 'vue';

interface DataPoint {
  name: string;
  value: number;
}

export default defineComponent({
  name: 'OptionsD3Bar',
  data() {
    return {
      // svg configurations
      svg: null as any | null,
      svgHeight: 0 as number,
      svgWidth: 0 as number,
      svgMargin: { top: 20, right: 0, bottom: 30, left: 40 },

      // data configurations
      data: [] as DataPoint[],
      dataMaxX: 26 as number,
      dataMaxY: 100 as number,
      refreshInterval: null as any | null,

      // chart configurations
      x: null as any | null,
      y: null as any | null,
      barChartAxisX: null as any | null,
      barChartContainer: null as any | null,
    };
  },
  props: {
    playAnimation: Boolean,
  },
  watch: {
    playAnimation(_play) {
      if (_play) this.setChanges();
      else this.clearChanges();
    },
  },
  mounted() {
    // init and render bar chart
    this.generateData();
    this.initBarChart();
    this.renderBarChart();

    // setup the timer for animations
    if (this.playAnimation) this.setChanges();
  },
  beforeUnmount() {
    this.clearChanges();
  },
  methods: {
    generateData(): void {
      this.data.length = 0; // clear the array
      let num_cols = Math.random() * this.dataMaxX;
      for (let i = 0; i < num_cols; i++) {
        this.data.push({
          name: String.fromCharCode(97 + i),
          value: Math.floor(Math.random() * this.dataMaxY),
        });
      }
    },
    initBarChart(): void {
      // initialize svg
      this.svgHeight = this.$el.clientHeight;
      this.svgWidth = this.$el.clientWidth;
      this.svg = d3
        .select('#options-d3-bar')
        .append('svg')
        .attr('viewBox', [0, 0, this.svgWidth, this.svgHeight]);

      this.y = d3
        .scaleLinear()
        .domain([0, this.dataMaxY])
        .nice()
        .range([this.svgHeight - this.svgMargin.bottom, this.svgMargin.top]);
      let yAxis = (g: any) =>
        g
          .attr('transform', `translate(${this.svgMargin.left},0)`)
          .call(d3.axisLeft(this.y))
          .call((g: any) => g.select('.domain').remove());
      this.svg.append('g').call(yAxis);

      // append components
      this.barChartAxisX = this.svg.append('g');
      this.barChartContainer = this.svg.append('g');
    },
    renderBarChart(): void {
      // define scales
      this.x = d3
        .scaleBand()
        .domain(this.data.map((d: DataPoint) => d.name))
        .range([this.svgMargin.left, this.svgWidth - this.svgMargin.right])
        .padding(0.1);
      // define and draw x-axis
      let xAxis = (g: any) =>
        g
          .attr(
            'transform',
            `translate(0,${this.svgHeight - this.svgMargin.bottom})`
          )
          .call(d3.axisBottom(this.x).tickSizeOuter(0));
      this.barChartAxisX.call(xAxis);

      // draw the bars
      this.barChartContainer
        .selectAll('rect')
        .data(this.data)
        .join('rect')
        .transition(100) // the animation is done in this single line
        .attr('x', (d: DataPoint) => this.x(d.name))
        .attr('y', (d: DataPoint) => this.y(d.value))
        .attr('height', (d: DataPoint) => this.y(0) - this.y(d.value))
        .attr('width', this.x.bandwidth())
        .attr('fill', 'steelblue');
    },
    setChanges() {
      let _this = this;
      this.refreshInterval = setInterval(() => {
        _this.generateData();
        _this.renderBarChart();
      }, 1000);
    },
    clearChanges() {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    },
  },
});
</script>

<template>
  <div id="options-d3-bar"></div>
</template>

<style scoped>
#options-d3-bar {
  height: calc(100% - 2px);
  width: 100%;
  border: 1px solid black;
}
</style>
