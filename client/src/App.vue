<script setup lang="ts">
import { ref } from 'vue';
import Datasaurus from './components/Datasaurus.vue';
import D3BarButton from './components/D3BarButton.vue';
import D3BarComposistion from './components/D3BarComposition.vue';
import D3BarOptions from './components/D3BarOptions.vue';
import Netflix from './components/Netflix.vue';

const isComposition = ref<boolean>(false);
const playAnimation = ref<boolean>(true);
</script>

<template>
  <a-row>
    <a-col :span="6">
      <a-row class="row">
        <D3BarButton
          v-model:is-composition="isComposition"
          v-model:play-animation="playAnimation"
        />
        <!-- The following implements the same bar chart in different API to serve as a migration guide -->
        <D3BarComposistion
          v-if="isComposition"
          :playAnimation="playAnimation"
        />
        <D3BarOptions v-if="!isComposition" :playAnimation="playAnimation" />
      </a-row>
      <a-row class="row">
        <Datasaurus id="datasaurus_container" />
      </a-row>
    </a-col>
    <a-col :span="18">
      <Netflix />
    </a-col>
  </a-row>
</template>

<style>
#app {
  font-family: 'Open Sans', Helvetica, 'PingFang SC', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  width: 1600px;
  height: 900px;
  margin: 10px;
  border: 1px solid #455a64;
}

.row {
  height: 450px;
}

.noselect {
  user-select: none;
}
</style>
