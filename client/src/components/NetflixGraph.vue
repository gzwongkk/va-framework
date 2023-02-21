<script setup lang="ts">
/**
 * This component implements a-tables for fast data demo.
 * It uses tags and tooltips to provide essential UI components for many VA systems.
 */
import { useConfig } from '../stores/vaConfig';
import { useNetflixStore } from '../stores/netflix';
import { useStaticNetflixStore } from '../stores/netflixStatic';
import { storeToRefs } from 'pinia';

const vaConfig = useConfig(); // define colors
const netflixStore = vaConfig.hasServer
  ? useNetflixStore()
  : useStaticNetflixStore(); // define data source according to the environment

const { netflixDist } = storeToRefs(netflixStore); // obtain reactive variables
</script>

<template>
  <div id="netflix-graph-svg">
    {{ netflixDist }}
  </div>
</template>

<style scoped>
#netflix-graph-svg {
  height: calc(100% - 2px);
  width: 100%;
  border: 1px solid black;
}

.noselect {
  user-select: none;
}
</style>
