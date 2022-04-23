<script setup lang="ts">
import { useConfig } from '../stores/vaConfig';

const color = useConfig().color;

const strips = [
  { id: 'stripe_type_one', stroke: color.type_one_light },
  { id: 'stripe_type_two', stroke: color.type_two_light },
  { id: 'stripe_type_three', stroke: color.type_three_light },
];

const strips_wide = [
  { id: 'stripe_type_one_wide', stroke: color.type_one_light },
  { id: 'stripe_type_two_wide', stroke: color.type_two_light },
  { id: 'stripe_type_three_wide', stroke: color.type_three_light },
];

const markers = [
  { id: 'arrow', fill: color.type_one_dark, size: 20 },
  { id: 'type_oneAnchor', fill: color.type_one_dark, size: 3 },
  { id: 'type_twoAnchor', fill: color.type_two_dark, size: 3 },
  { id: 'type_threeAnchor', fill: color.type_three_dark, size: 3 },
];
</script>

<template>
  <svg width="0" height="0" style="position: absolute">
    <defs>
      <pattern
        v-for="strip in strips"
        :key="strip.id"
        :id="strip.id"
        width="5"
        height="5"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <line :stroke="strip.stroke" stroke-width="4" y2="20" />
      </pattern>

      <pattern
        v-for="strip in strips_wide"
        :key="strip.id"
        :id="strip.id"
        width="18"
        height="18"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <line :stroke="strip.stroke" stroke-width="4" y2="20" />
      </pattern>

      <marker
        v-for="marker in markers"
        :key="marker.id"
        :id="marker.id"
        viewBox="[0, 0, 12, 12]"
        refX="6"
        refY="6"
        :fill="marker.fill"
        :markerWidth="marker.size"
        :markerHeight="marker.size"
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 12 6 L 0 12 L 6 6 L 6 6" class="anchorHead" />
      </marker>
    </defs>
  </svg>
</template>

<style scoped></style>
