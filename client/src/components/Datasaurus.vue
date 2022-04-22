<template>
  <div style='height: 100%'>
    <div v-for='name in nameList' :key='name' class='item' @click='datasaurusStore.selectDataType(name)'>
      {{ name }}
    </div>
    <svg width='1200' height='380'>
      <g>
        <circle v-for='(d, i) in data' :key='i' r='5' :cx='1200 - d.x * 4' :cy='350 - d.y * 3' fill='#455a64' />
      </g>
      <g>
        <circle v-for='(d, i) in data' :key='i' r='5' :cx='d.x * 4' :cy='350 - d.y * 3' fill='#455a64' />
      </g>
    </svg>
  </div>
</template>

<script setup lang='ts'>
import { useDatasaurusStore } from '../stores/datasaurus';
import { storeToRefs } from 'pinia'

const datasaurusStore = useDatasaurusStore();
const { nameList, data } = storeToRefs(datasaurusStore);
</script>

<style>
.item {
  display: inline;
  margin: 10px;
}
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>
