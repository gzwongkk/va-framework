<script lang="ts">
/**
 * This component demonstrates basic usage of the options API and TypeScript.
 * The randomly initialized data is plotted with D3.js.
 * D3 rendering is suitable for more complicated interactions and enabling animations.
 * This example initializes the static components and set up a timer for changes.
 */
import * as d3 from 'd3';
import { defineComponent } from 'vue';
import { mapState } from 'pinia';
import { useConfig } from '../stores/vaConfig';

interface DataPoint {
  name: string;
  value: number;
}

/**
 * The following code follows the same structure with D3BarComposition.vue to show the differences.
 * Notice that in options, we need to follow certain fixed keywords/options to define the component.
 * It offers higher readability for its format, in cost of lower reuseability compared to composition.
 */
export default defineComponent({
  name: 'D3BarOptions',
  data() {
    return {
      // svg configurations
      svg: {} as d3.Selection<SVGSVGElement, {}, HTMLElement, {}>,
      // svg: null as d3.Selection<SVGSVGElement, {}, HTMLElement, {}> | null, // the more accurate type but having "null" opens potential mis-inference
      svgHeight: 0 as number,
      svgWidth: 0 as number,
      svgMargin: { top: 40, right: 30, bottom: 30, left: 30 },

      // chart configurations
      x: d3.scaleBand() as d3.ScaleBand<string>,
      y: d3.scaleLinear() as d3.ScaleLinear<number, number, never>,
      barChartAxisX: {} as d3.Selection<SVGGElement, {}, HTMLElement, {}>,
      barChartContainer: {} as d3.Selection<SVGGElement, {}, HTMLElement, {}>,

      // data configurations
      data: [] as DataPoint[],
      dataMaxX: 26 as number,
      dataMaxY: 100 as number,

      // animation configurations
      refreshInterval: null as number | null,
      refreshSpeed: 2000 as number,
      refreshAnimationSpeed: 1500 as number,
    };
  },
  props: {
    playAnimation: Boolean,
  },
  computed: {
    // declaring the data in pinia stores
    ...mapState(useConfig, ['color']),
    svgStyle(): string {
      return `viewbox: [0, 0, ${this.svgWidth}, ${this.svgHeight}]`;
    },
  },
  watch: {
    playAnimation(_play): void {
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
    // clear the timer for animations
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
      this.svg = d3.select('#d3-bar-options');

      // initialize svg
      // optain the attributes from "this"
      this.svgHeight = this.$el.clientHeight;
      this.svgWidth = this.$el.clientWidth;

      // define and draw y-axis
      this.y = d3
        .scaleLinear()
        .domain([0, this.dataMaxY])
        .nice()
        .range([this.svgHeight - this.svgMargin.bottom, this.svgMargin.top]);
      // append('g') means append a graphics element => SVGGraphicsElement, a.k.a. SVGGElement
      let yAxis = (g: d3.Selection<SVGGraphicsElement, {}, HTMLElement, {}>) =>
        g
          .attr('transform', `translate(${this.svgMargin.left},0)`)
          .call(d3.axisLeft(this.y))
          .call((g: d3.Selection<SVGGElement, {}, HTMLElement, {}>) =>
            g.select('.domain').remove()
          );
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
      let xAxis = (g: d3.Selection<SVGGraphicsElement, {}, HTMLElement, {}>) =>
        g
          .attr(
            'transform',
            `translate(0,${this.svgHeight - this.svgMargin.bottom})`
          )
          .call(d3.axisBottom(this.x).tickSizeOuter(0));
      this.barChartAxisX.call(xAxis);

      // draw the bars
      // color from vaconfig pinia store
      const rects = this.barChartContainer.selectAll('rect') as d3.Selection<
        SVGRectElement,
        DataPoint,
        SVGGElement,
        {}
      >;
      rects
        .data(this.data)
        // or pass a key function to enforce binding the same data to the dom element across rendering
        // .data(this.data, (d: DataPoint) => d.name)
        // .join('rect') // can be as simple as this for default behaviors
        .join(
          // let n = num of items in the data array
          // enter: creates new svg elements for increased number of items
          // run max(n_new - n_old, 0) times
          (enter: d3.Selection<d3.EnterElement, DataPoint, SVGGElement, {}>) =>
            enter
              .append('rect')
              .attr('fill', this.color.type_three)
              .attr('y', (d: DataPoint) => this.y(d.value)) // x is default at 0
              .attr('height', (d: DataPoint) => this.y(0) - this.y(d.value))
              .attr('width', this.x.bandwidth()),
          // update: updates existing svg elements to fit new data value/order
          // run min(n_old, n_new) times
          (update: d3.Selection<SVGRectElement, DataPoint, SVGGElement, {}>) =>
            update.attr('fill', this.color.type_one),
          // exit: update existing svg elements before removing them
          // run max(n_old - n_new, 0) times
          (exit: d3.Selection<SVGRectElement, DataPoint, SVGGElement, {}>) => {
            exit
              .attr('fill', this.color.type_two)
              .transition()
              .duration(this.refreshAnimationSpeed)
              .ease(d3.easeExpIn)
              .attr('x', this.svgWidth)
              .remove();
          }
        )
        .transition()
        .duration(this.refreshAnimationSpeed)
        .ease(d3.easeExpIn)
        .attr('x', (d: DataPoint) => this.x(d.name) as number) // possibly undefined from scaleBand, assert number
        .attr('y', (d: DataPoint) => this.y(d.value))
        .attr('height', (d: DataPoint) => this.y(0) - this.y(d.value))
        .attr('width', this.x.bandwidth());
    },
    setChanges() {
      let _this = this;
      this.refreshInterval = setInterval(() => {
        _this.generateData();
        _this.renderBarChart();
      }, this.refreshSpeed);
    },
    clearChanges() {
      clearInterval(this.refreshInterval as number);
      this.refreshInterval = null;
    },
  },
});
</script>

<template>
  <svg id="d3-bar-options" :style="svgStyle"></svg>
</template>

<style scoped>
#d3-bar-options {
  height: calc(100% - 2px);
  width: 100%;
  border: 1px solid black;
}
</style>
