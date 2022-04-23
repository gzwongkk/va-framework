<script setup lang="ts">
import Datasaurus from './components/Datasaurus.vue';
import CompositionD3BarVue from './components/CompositionD3Bar.vue';
import OptionsD3Bar from './components/OptionsD3Bar.vue';

import { ref } from 'vue';
import { Row, Col, Button } from 'ant-design-vue';

const isComposition = ref(false);
const playAnimation = ref(true);
</script>

<template>
  <a-row :gutter="16" class="row">
    <a-col :span="6">
      <div class="button_group composition">
        <a-button
          :type="isComposition ? 'primary' : ''"
          @click="isComposition = !isComposition"
        >
          {{ isComposition ? 'Composition' : 'Options' }}
        </a-button>
        <a-button
          :type="playAnimation ? 'primary' : ''"
          @click="playAnimation = !playAnimation"
        >
          {{ playAnimation ? 'Play' : 'Pause' }}
        </a-button>
      </div>
      <!-- The following implements the same bar chart in different API to serve as a migration guide -->
      <CompositionD3BarVue
        v-if="isComposition"
        :playAnimation="playAnimation"
      />
      <OptionsD3Bar v-if="!isComposition" :playAnimation="playAnimation" />
    </a-col>
  </a-row>

  <a-row :gutter="16" class="row">
    <a-col :span="6">
      <Datasaurus id="datasaurus_container" />
    </a-col>
    <a-col :span="18"> </a-col>
  </a-row>

  <a-row> </a-row>
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

.button_group.composition {
  position: absolute;
  margin-top: 5px;
  right: 10px;
  margin-right: 5px;
}

.row {
  height: 450px;
}

.noselect {
  user-select: none;
}
</style>
