<script setup lang="ts">
/**
 * This component demonstrates basic usage of the composition API and typescript with Pinia store.
 * The data from DatasaurusDozen is plotted on the intuitive v-for SVG rendering.
 * SVG rendering is suitable for simple static visualizations where complex interactions and animations are unnecessary (e.g., legend).
 * For simple animations, visit https://vuejs.org/guide/built-ins/transition-group.html.
 */
import { ref, onMounted } from 'vue';
import { useConfig } from '../stores/vaConfig';
import { useDatasaurusStore } from '../stores/datasaurus';
import { storeToRefs } from 'pinia';
import * as d3 from 'd3';

import DataSaurusLegend from './DatasaurusLegend.vue';

const vaConfig = useConfig(); // define colors
const datasaurusStore = useDatasaurusStore(); // define data source
const { nameList, data } = storeToRefs(datasaurusStore); // obtain reactive variables

/**
 * To place the data points around center, we need the center's coordinate.
 * Since the svg's width and height are automatically calculated by CSS flex,
 * we can get them dynamically after the Datasaurus component is mounted to DOM.
 * If you know other workarounds, please let me know.
 */
// create reactive variables to reflect SVG element's size
const height = ref<number>(0);
const width = ref<number>(0);

// scale the original datapoints horizontally and vertically
const h_ratio: number = 4;
const v_ratio: number = 3;

const selectedColor = ref<string>(vaConfig.color.type_one);

onMounted(() => {
  // initialize svg
  // optain the bounding box's attributes dynamically
  const svg: d3.Selection<SVGSVGElement, {}, HTMLElement, {}> =
    d3.select('#datasaurus-svg');
  const svgNode = svg.node() as SVGSVGElement;
  const rect: DOMRect = svgNode.getBoundingClientRect(); // optain the bounding box's attributes dynamically
  height.value = rect.height / 2;
  width.value = rect.width / 2;
});
</script>

<template>
  <div class="datasaurus">
    <div class="button-group">
      <a-button
        class="button"
        v-for="name in nameList"
        :key="name"
        :type="name === datasaurusStore.selectedDataset ? 'primary' : ''"
        @click="datasaurusStore.selectDataType(name)"
      >
        {{ name }}
      </a-button>
    </div>
    <svg id="datasaurus-svg">
      <!-- datapoint refers to the "class" in CSS, and g refers to the tag in DOM -->
      <TransitionGroup name="datapoint" tag="g">
        <circle
          v-for="(d, i) in data"
          :key="i"
          :r="5"
          :cx="width + d.x * h_ratio"
          :cy="height - d.y * v_ratio"
          :fill="selectedColor"
        />
      </TransitionGroup>
      <!-- legend graphic element -->
      <DataSaurusLegend
        :height="height"
        :width="width"
        @select-color="(color) => (selectedColor = color)"
      />
    </svg>
  </div>
</template>

<style scoped>
.datasaurus {
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

#datasaurus-svg {
  flex: 1 0 auto;
  /* border: 1px solid black; */
}

.datapoint-move,
.datapoint-enter-active,
.datapoint-leave-active {
  transition: all 0.5s ease;
}
.datapoint-enter-from,
.datapoint-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.noselect {
  user-select: none;
}
</style>
