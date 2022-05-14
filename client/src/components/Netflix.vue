<script setup lang="ts">
/**
 * This component demonstrates basic usage of the composition API and typescript with Pinia store.
 * The data from DatasaurusDozen is plotted on the intuitive v-for SVG rendering.
 * SVG rendering is suitable for simple static visualizations where complex interactions and animations are unnecessary (e.g., legend).
 * For simple animations, visit https://vuejs.org/guide/built-ins/transition-group.html.
 */
import { ref, onMounted } from 'vue';
import { useConfig } from '../stores/vaConfig';
import { useNetflixStore } from '../stores/netflix';
import { storeToRefs } from 'pinia';

const vaConfig = useConfig(); // define colors
const netflixStore = useNetflixStore(); // define data source
const { billBurr } = storeToRefs(netflixStore); // obtain reactive variables

onMounted(() => {
  netflixStore.get_bill_burr();
});
</script>

<template>
  <div class="netflix">
    {{ billBurr }}
  </div>
</template>

<style scoped>
.netflix {
  height: calc(100% - 2px);
  width: 100%;
  border: 1px solid black;
}

.noselect {
  user-select: none;
}
</style>
