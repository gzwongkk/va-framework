<script setup lang="ts">
/**
 * This component demonstrates basic usage of the composition API and TypeScript.
 * The randomly initialized data is plotted with D3.js.
 * D3 rendering is suitable for more complicated interactions and enabling animations.
 * This example initializes the static components and set up a timer for changes.
 */
import * as d3 from 'd3';
import { computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useConfig } from '../stores/vaConfig';

interface DataPoint {
  name: string;
  value: number;
}

/**
 * The following code follows the same structure with D3BarOptions.vue to show the differences.
 * Notice that in composition, we can simply declare variables without initializing.
 * It prevents assigning dummy values and ensures a more clear type inference.
 */
// The data option
// svg configurations
let svg: d3.Selection<SVGSVGElement, {}, HTMLElement, {}>;
let svgHeight: number = 0;
let svgWidth: number = 0;
let svgMargin = { top: 40, right: 30, bottom: 30, left: 30 };

// chart configurations
let x: d3.ScaleBand<string>;
let y: d3.ScaleLinear<number, number, never>;
let barChartAxisX: d3.Selection<SVGGElement, {}, HTMLElement, {}>;
let barChartContainer: d3.Selection<SVGGElement, {}, HTMLElement, {}>;

// data configurations
let data: DataPoint[] = [];
let dataMaxX: number = 26;
let dataMaxY: number = 100;

// animation configurations
let refreshInterval: number;
let refreshSpeed: number = 2000;
let refreshAnimationSpeed: number = 1500;

// The props option
// props from parent
const props = defineProps({
  playAnimation: Boolean,
});

// The computed option
// Using pinia stores in composition is much simpler, just use it as is
const vaConfig = useConfig(); // define colors
const svgStyle = computed(() => `viewbox: [0, 0, ${svgWidth}, ${svgHeight}]`);

// The watch option
// watch the reactive props
watch(
  () => props.playAnimation,
  (_play): void => {
    if (_play) setChanges();
    else clearChanges();
  }
);

// The mounted option
onMounted(() => {
  // init and render bar chart
  generateData();
  initBarChart();
  renderBarChart();

  // setup the timer for animations
  if (props.playAnimation) setChanges();
});

// The beforeUnmount option
onBeforeUnmount(() => {
  // clear the timer for animations
  clearChanges();
});

// The method option
function generateData() {
  data.length = 0; // clear the array
  let num_cols = Math.random() * dataMaxX;
  for (let i = 0; i < num_cols; i++) {
    data.push({
      name: String.fromCharCode(97 + i),
      value: Math.floor(Math.random() * dataMaxY),
    });
  }
}

function initBarChart() {
  // find the svg in the template
  svg = d3.select('#d3-bar-composition') as d3.Selection<
    SVGSVGElement,
    {},
    HTMLElement,
    {}
  >;

  // initialize svg
  // optain the bounding box's attributes dynamically
  const svgNode = svg.node() as SVGSVGElement;
  svgHeight = svgNode.getBoundingClientRect().height;
  svgWidth = svgNode.getBoundingClientRect().width;

  // define and draw y-axis
  y = d3
    .scaleLinear()
    .domain([0, dataMaxY])
    .nice()
    .range([svgHeight - svgMargin.bottom, svgMargin.top]);
  let yAxis = (g: d3.Selection<SVGGraphicsElement, {}, HTMLElement, {}>) =>
    g
      .attr('transform', `translate(${svgMargin.left},0)`)
      .call(d3.axisLeft(y))
      .call((g: d3.Selection<SVGGraphicsElement, {}, HTMLElement, {}>) =>
        g.select('.domain').remove()
      );
  svg.append('g').call(yAxis);

  // append components
  barChartAxisX = svg.append('g');
  barChartContainer = svg.append('g');
}

function renderBarChart() {
  // define scales
  x = d3
    .scaleBand()
    .domain(data.map((d: DataPoint) => d.name))
    .range([svgMargin.left, svgWidth - svgMargin.right])
    .padding(0.1);
  // define and draw x-axis
  let xAxis = (g: d3.Selection<SVGGraphicsElement, {}, HTMLElement, {}>) =>
    g
      .attr('transform', `translate(0,${svgHeight - svgMargin.bottom})`)
      .call(d3.axisBottom(x).tickSizeOuter(0));
  barChartAxisX.call(xAxis);

  // draw the bars
  const rects = barChartContainer.selectAll('rect') as d3.Selection<
    SVGRectElement,
    DataPoint,
    SVGGElement,
    {}
  >;
  rects
    .data(data)
    // or pass a key function to enforce aligned data assignment to the same dom element across rendering
    // .data(data, (d: DataPoint) => d.name)
    // .join('rect') // can be as simple as this for default behaviors
    .join(
      // let n = num of items in the data array
      // enter: creates new svg elements for increased number of items
      // run max(n_new - n_old, 0) times
      (enter: d3.Selection<d3.EnterElement, DataPoint, SVGGElement, {}>) =>
        enter
          .append('rect')
          .attr('fill', vaConfig.color.type_three)
          .attr('y', (d: DataPoint) => y(d.value)) // x is default at 0
          .attr('height', (d: DataPoint) => y(0) - y(d.value))
          .attr('width', x.bandwidth()),
      // update: updates existing svg elements to fit new data value/order
      // run min(n_old, n_new) times
      (update: d3.Selection<SVGRectElement, DataPoint, SVGGElement, {}>) =>
        update.attr('fill', vaConfig.color.type_one),
      // exit: update existing svg elements before removing them
      // run max(n_old - n_new, 0) times
      (exit: d3.Selection<SVGRectElement, DataPoint, SVGGElement, {}>) => {
        exit
          .attr('fill', vaConfig.color.type_two)
          .transition()
          .duration(refreshAnimationSpeed)
          .ease(d3.easeExpIn)
          .attr('x', svgWidth)
          .remove();
      }
    )
    .transition()
    .duration(refreshAnimationSpeed)
    .ease(d3.easeExpIn)
    .attr('x', (d: DataPoint) => x(d.name) as number) // possibly undefined from scaleBand, assert number
    .attr('y', (d: DataPoint) => y(d.value))
    .attr('height', (d: DataPoint) => y(0) - y(d.value))
    .attr('width', x.bandwidth());
}

function setChanges() {
  refreshInterval = setInterval(() => {
    generateData();
    renderBarChart();
  }, refreshSpeed);
}

function clearChanges() {
  clearInterval(refreshInterval as number);
}
</script>

<template>
  <svg id="d3-bar-composition" :style="svgStyle"></svg>
</template>

<style scoped>
#d3-bar-composition {
  height: calc(100% - 2px);
  width: 100%;
  border: 1px solid black;
}
</style>
