<script setup lang="ts">
/**
 * This component demonstrates basic usage of the composition API and TypeScript.
 * The randomly initialized data is plotted with D3.js.
 * D3 rendering is suitable for more complicated interactions and enabling animations.
 * This example initializes the static components and set up a timer for changes.
 */
import { assert } from '@vue/compiler-core';
import * as d3 from 'd3';
import { defineProps, watch, onMounted, onBeforeUnmount } from 'vue';

interface DataPoint {
  name: string;
  value: number;
}

// svg configurations
let svg: any | null = null;
let svgHeight: number = 0;
let svgWidth: number = 0;
let svgMargin = { top: 20, right: 0, bottom: 30, left: 40 };

// data configurations
let data: DataPoint[] = [];
let dataMax: number = 100;
let refreshInterval: any | null = null;

// chart configurations
let x: any | null = null;
let y: any | null = null;
let barChartContainer: any | null = null;

// props from parent
const props = defineProps({
  playAnimation: Boolean,
});

// watch the reactive props
watch(
  () => props.playAnimation,
  (_play) => {
    if (_play) setChanges();
    else clearChanges();
  }
);

onMounted(() => {
  // init and render bar chart
  generateData();
  initBarChart();
  renderBarChart();

  // setup the timer for animations
  if (props.playAnimation) setChanges();
});
onBeforeUnmount(() => {
  // clear the timer for animations
  clearChanges();
});

function generateData() {
  data.length = 0; // clear the array
  for (let i = 0; i < 10; i++) {
    data.push({
      name: String.fromCharCode(97 + i),
      value: Math.floor(Math.random() * dataMax),
    });
  }
}

function initBarChart() {
  // find the div in the template
  svg = d3.select('#composition-d3-bar');
  assert(svg.node() !== null, 'Cannot find #composition-d3-bar');

  // configure the svg
  let rect: DOMRect = svg.node().getBoundingClientRect(); // optain the bounding box's attributes dynamically
  svgHeight = rect.height;
  svgWidth = rect.width;
  svg = svg.append('svg').attr('viewBox', [0, 0, svgWidth, svgHeight]);

  // define scales
  x = d3
    .scaleBand()
    .domain(data.map((d) => d.name))
    .range([svgMargin.left, svgWidth - svgMargin.right])
    .padding(0.1);
  // define and draw axes
  let xAxis = (g: any) =>
    g
      .attr('transform', `translate(0,${svgHeight - svgMargin.bottom})`)
      .call(d3.axisBottom(x).tickSizeOuter(0));
  svg.append('g').call(xAxis);

  y = d3
    .scaleLinear()
    .domain([0, dataMax])
    .nice()
    .range([svgHeight - svgMargin.bottom, svgMargin.top]);
  let yAxis = (g: any) =>
    g
      .attr('transform', `translate(${svgMargin.left},0)`)
      .call(d3.axisLeft(y))
      .call((g: any) => g.select('.domain').remove());
  svg.append('g').call(yAxis);

  barChartContainer = svg.append('g');
}

function renderBarChart() {
  // draw the bars
  barChartContainer
    .selectAll('rect')
    .data(data)
    .join('rect')
    .transition(100) // the animation is done in this single line
    .attr('x', (d: any) => x(d.name))
    .attr('y', (d: any) => y(d.value))
    .attr('height', (d: any) => y(0) - y(d.value))
    .attr('width', x.bandwidth())
    .attr('fill', 'steelblue');
}

function setChanges() {
  refreshInterval = setInterval(() => {
    generateData();
    renderBarChart();
  }, 1000);
}

function clearChanges() {
  clearInterval(refreshInterval);
  refreshInterval = null;
}
</script>

<template>
  <div id="composition-d3-bar"></div>
</template>

<style scoped>
#composition-d3-bar {
  height: calc(100% - 2px);
  width: 100%;
  border: 1px solid black;
}
</style>
