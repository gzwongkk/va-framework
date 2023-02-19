<script setup lang="ts">
/**
 * This component implements the tooltip with v-show. Another way of drawing tooltip is through a-tooltip (see NetflixTable.vue).
 * However, a-tooltip cannot wrap a shape element in SVG.
 * Certain workarounds are available, such as overlaying another div on the svg.
 * Yet, they are too complicated and less practical than this simple tooltip.
 */
import { ref, computed } from 'vue';
import { useConfig } from '../stores/vaConfig';

const vaConfig = useConfig();

const props = defineProps<{
  svgWidth: number;
  tooltipMouseY: number;
  tooltipDisplay: any;
  x: any;
  y: any;
}>();

// computed variables from the root variables
const tooltipMessage = computed(() => {
  if (props.tooltipDisplay === null) return '';
  return props.tooltipDisplay.dtype + ': ' + props.tooltipDisplay.count;
});
const tooltipWidth = computed(() => {
  return tooltipMessage.value.length * 8; // 16 is the font size
});
const tooltipHeight = ref<number>(16 * 1.5);
const tooltipX = computed(() => {
  if (props.tooltipDisplay === null) return 0;
  const _x = props.x(props.tooltipDisplay.dtype.toString()) as number;
  const rightHandSide = _x + props.x.bandwidth() + 2;
  return rightHandSide + tooltipWidth.value > props.svgWidth
    ? _x - 2 - tooltipWidth.value
    : rightHandSide;
});
const tooltipY = computed(() => {
  return props.tooltipMouseY - tooltipHeight.value / 2;
});
</script>

<template>
  <g>
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
    <text :x="tooltipX + tooltipWidth / 16" :y="tooltipMouseY + 4" fill="white">
      {{ tooltipMessage }}
    </text>
  </g>
</template>
