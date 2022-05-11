<script setup lang="ts">
/**
 * This component demonstrates basic usage of the composition API and typescript with Pinia store.
 * The data from DatasaurusDozen is plotted on the intuitive v-for SVG rendering.
 * SVG rendering is suitable for simple static visualizations where complex interactions and animations are unnecessary (e.g., legend). 
 * For simple animations, visit https://vuejs.org/guide/built-ins/transition-group.html.
 */

import { useConfig } from '../stores/vaConfig';
import { useDatasaurusStore } from '../stores/datasaurus';
import { storeToRefs } from 'pinia';
import { ref, onMounted } from 'vue';
import * as d3 from 'd3';

const vaConfig = useConfig(); // define colors
const datasaurusStore = useDatasaurusStore(); // define data source
const { nameList, data } = storeToRefs(datasaurusStore); // obtain reactive variables

/**
 * To place the data points around center, we need the center's coordinate.
 * Since the svg's width and height are automatically calculated by CSS flex,
 * we can get them dynamically after the Datasaurus component is mounted to DOM.
 * If you know other workarounds, please let me know.
 */
const height = ref(0),
  width = ref(0); // create reactive variables to reflect SVG element's size

const h_ratio = 4,
  v_ratio = 3; // scale the original datapoints horizontally and vertically

onMounted(() => {
  let svg: any = d3.select('#datasaurus_svg').node();
  if (svg !== null) {
    let rect: DOMRect = svg.getBoundingClientRect(); // optain the bounding box's attributes dynamically
    height.value = rect.height / 2;
    width.value = rect.width / 2;
  }
});
</script>

<template>
  <div class="datasaurus">
    <div class="button_group">
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
    <svg id="datasaurus_svg">
      <!-- datapoint refers to the "class" in CSS, and g refers to the tag in DOM -->
      <TransitionGroup name="datapoint" tag="g">
        <circle
          v-for="(d, i) in data"
          :key="i"
          :r="5"
          :cx="width + d.x * h_ratio"
          :cy="height - d.y * v_ratio"
          :fill="vaConfig.color.type_one"
        />
      </TransitionGroup>
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

.button_group {
  padding: 5px;
  display: flex;
  flex: 0 1 auto;
  flex-flow: row wrap;
}

.button {
  flex: auto;
}

#datasaurus_svg {
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
</style>
