<script setup lang="ts">
/**
 * This component demonstrates combining d3.js and v-for rendering together to draw a bar chart.
 * It also implements a simple tooltip to reflect actual data records.
 */
import { watch, ref, computed, onMounted } from 'vue';
import * as d3 from 'd3';
import { useConfig } from '../stores/vaConfig';
import { useNetflixStore, type DistCount } from '../stores/netflix';

// acquire color from pinia store
const vaConfig = useConfig();
const netflixStore = useNetflixStore(); // define data source

// button configurations
const buttonList = [
  { name: 'years', get: netflixStore.get_year_distribution },
  { name: 'countries', get: netflixStore.get_country_distribution },
  { name: 'genre', get: netflixStore.get_genre_distribution },
];
const selectedButton = ref<string>('years');
function onSelectButton(button: any) {
  selectedButton.value = button.name;
  button.get();
}

// svg configurations
let svg: d3.Selection<SVGSVGElement, {}, HTMLElement, {}>;
const svgHeight = ref<number>(0);
const svgWidth = ref<number>(0);
const svgMargin = { top: 10, right: 20, bottom: 20, left: 40 };

// chart configurations
let x = ref<d3.ScaleBand<string>>(d3.scaleBand());
let y = ref<d3.ScaleLinear<number, number, never>>(d3.scaleLinear().nice());
let barChartAxisX: d3.Selection<SVGGElement, {}, HTMLElement, {}>;
let barChartAxisY: d3.Selection<SVGGElement, {}, HTMLElement, {}>;

// watch the data state
watch(() => netflixStore.netflixDist, renderScale);

// The mounted option
onMounted(() => {
  // init and render bar chart
  netflixStore.get_year_distribution(); // default with year distribution
  initScale();
  renderScale();
});

/**
 * The scales are drawn with D3.js.
 */
function initScale() {
  // initialize svg
  // find the svg in the template
  svg = d3.select('#netflix-dist-bar');
  // optain the bounding box's attributes dynamically
  const svgNode = svg.node() as SVGSVGElement;
  const rect: DOMRect = svgNode.getBoundingClientRect();
  [svgHeight.value, svgWidth.value] = [rect.height, rect.width];

  // append components
  barChartAxisX = svg.select('#netflix-dist-bar-scale-x');
  barChartAxisY = svg.select('#netflix-dist-bar-scale-y');
}

function renderScale() {
  // draw x-scales
  x.value = x.value
    .domain(
      netflixStore.netflixDistTopList.map((d: DistCount) => d.dtype.toString())
    )
    .range([svgMargin.left, svgWidth.value - svgMargin.right])
    .padding(0.1);
  // define and draw x-axis
  let xAxis = (g: d3.Selection<SVGGraphicsElement, {}, HTMLElement, {}>) =>
    g
      .attr('transform', `translate(0,${svgHeight.value - svgMargin.bottom})`)
      .attr('z-index', '-1')
      .call(d3.axisBottom(x.value).tickSizeOuter(0));
  barChartAxisX.call(xAxis);

  // draw y-scales
  y.value = y.value
    .domain([
      0,
      d3.max(
        netflixStore.netflixDistTopList,
        (d: DistCount) => d.count
      ) as number,
    ])
    .range([svgHeight.value - svgMargin.bottom, svgMargin.top]);
  let yAxis = (g: d3.Selection<SVGGraphicsElement, {}, HTMLElement, {}>) =>
    g
      .attr('transform', `translate(${svgMargin.left},0)`)
      .attr('z-index', '-1')
      .call(d3.axisLeft(y.value));
  barChartAxisY.call(yAxis);
}

/**
 * The tooltip is drawn with v-show.
 */
// root variables that define tooltip container
const tooltipMoustY = ref<number>(0);
const tooltipDisplay = ref<DistCount | null>(null);
function showTooltip(event: MouseEvent, data: DistCount) {
  tooltipMoustY.value = event.offsetY;
  tooltipDisplay.value = data;
}

// computed variables from the root variables
const tooltipMessage = computed(() => {
  if (tooltipDisplay.value === null) return '';
  return tooltipDisplay.value.dtype + ': ' + tooltipDisplay.value.count;
});
const tooltipWidth = computed(() => {
  return tooltipMessage.value.length * 8; // 16 is the font size
});
const tooltipHeight = ref<number>(24);
const tooltipX = computed(() => {
  if (tooltipDisplay.value === null) return 0;
  const _x = x.value(tooltipDisplay.value.dtype.toString()) as number;
  const rightHandSide = _x + x.value.bandwidth() + 2;
  return rightHandSide + tooltipWidth.value > svgWidth.value
    ? _x - 2 - tooltipWidth.value
    : rightHandSide;
});
const tooltipY = computed(() => {
  return tooltipMoustY.value - tooltipHeight.value / 2;
});
</script>

<template>
  <div class="netflix-dist">
    <div class="button-group">
      <a-button
        class="button"
        v-for="button in buttonList"
        :key="button.name"
        :type="button.name === selectedButton ? 'primary' : ''"
        @click="onSelectButton(button)"
      >
        {{ `Top ${netflixStore.displayMax} ${button.name}` }}
      </a-button>
    </div>
    <svg id="netflix-dist-bar">
      <g id="netflix-dist-bar-scale-x" />
      <g id="netflix-dist-bar-scale-y" />
      <!-- bars -->
      <rect
        v-for="data in netflixStore.netflixDistTopList"
        :x="x(data.dtype.toString())"
        :y="y(data.count)"
        :height="Math.abs(y(data.count) - y(0))"
        :width="x.bandwidth()"
        :fill="vaConfig.color.bg"
        @mouseenter="(event) => showTooltip(event, data)"
        @mouseleave="tooltipDisplay = null"
      />
      <!-- tooltip -->
      <g v-show="tooltipDisplay !== null">
        <rect
          :x="tooltipX"
          :y="tooltipY"
          :rx="10"
          :ry="10"
          :height="tooltipHeight"
          :width="tooltipWidth"
          :fill="vaConfig.color.com_dark"
          :fill-opacity="0.95"
        />
        <text
          :x="tooltipX + tooltipWidth / 16"
          :y="tooltipMoustY + 4"
          fill="white"
        >
          {{ tooltipMessage }}
        </text>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.netflix-dist {
  height: calc(100% - 2px);
  width: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid black;
}

.button-group {
  padding: 5px;
  display: flex;
  flex: 0 1 auto;
  flex-flow: row wrap;
}

.button {
  flex: auto;
}

#netflix-dist-bar {
  position: relative;
  flex: 1 0 auto;
}

.noselect {
  user-select: none;
}
</style>
