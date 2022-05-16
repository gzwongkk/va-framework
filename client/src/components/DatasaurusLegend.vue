<script setup lang="ts">
/**
 * This component demonstrates the advantage of using composition API.
 * Plotting legends is tedious but absolutely appropriate with v-for SVG rendering.
 * The communication with parent component is through "props" and "emit".
 * It is suitable for simple cases that involve only a few components.
 * You may also use pinia for state management across components (see stores/datasaurus.ts).
 */

import { useConfig } from '../stores/vaConfig';
import { ref } from 'vue';

// acquire color from pinia store
const vaConfig = useConfig();
const selectedColor = ref<string>(vaConfig.color.type_one);

// inherit properties from parent component
const props = defineProps<{
  height: number;
  width: number;
}>();

// emit events to parent component
const emit = defineEmits<{
  (e: 'select-color', color: string): void;
}>();

// declare the legend items
interface legendAttr {
  text: string;
  text_x?: number;
  text_y?: number;
  text_fill: string;
  rect_x?: number;
  rect_y?: number;
  rect_fill: string;
  rect_stroke?: string;
}
// define the legend items
const legend: legendAttr[] = [
  {
    text: 'Green',
    text_x: 108,
    text_fill: vaConfig.color.type_one,
    rect_x: 84,
    rect_fill: vaConfig.color.type_one,
    rect_stroke: vaConfig.color.type_one_dark,
  },
  {
    text: 'Red',
    text_x: 188,
    text_fill: vaConfig.color.type_two,
    rect_x: 164,
    rect_fill: vaConfig.color.type_two,
    rect_stroke: vaConfig.color.type_two_dark,
  },
  {
    text: 'Purple',
    text_x: 268,
    text_fill: vaConfig.color.type_three,
    rect_x: 244,
    rect_fill: vaConfig.color.type_three,
    rect_stroke: vaConfig.color.type_three_dark,
  },
];

function selectColor(item: legendAttr): void {
  selectedColor.value = item.rect_fill;
  emit('select-color', item.rect_fill);
}
</script>

<template>
  <g v-for="item in legend" :key="item.text" @click="selectColor(item)">
    <rect
      :x="item.rect_x"
      :y="props.height * 2 - 24"
      width="20"
      height="20"
      :fill="item.rect_fill"
      :stroke="selectedColor === item.rect_fill ? item.rect_stroke : ''"
      stroke-width="3"
    />
    <text
      :x="item.text_x"
      :y="props.height * 2 - 24 + 16"
      font-size="16px"
      :font-weight="selectedColor === item.rect_fill ? 'bold' : ''"
      :fill="item.text_fill"
      class="noselect"
    >
      {{ item.text }}
    </text>
  </g>
</template>

<style scoped>
.noselect {
  user-select: none;
}
</style>
