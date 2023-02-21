<script setup lang="ts">
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useConfig } from './stores/vaConfig';
import Datasaurus from './components/Datasaurus.vue';
import D3BarButton from './components/D3BarButton.vue';
import D3BarComposistion from './components/D3BarComposition.vue';
import D3BarOptions from './components/D3BarOptions.vue';
import NetflixTable from './components/NetflixTable.vue';
import NetflixGraph from './components/NetflixGraph.vue';
import NetflixDistBar from './components/NetflixDistBar.vue';

const vaConfig = useConfig(); // define data source
const { isComposition } = storeToRefs(vaConfig); // obtain reactive variables

const playAnimation = ref<boolean>(true);
</script>

<template>
  <a-row>
    <a-col :span="6">
      <a-row class="row-half">
        <D3BarButton
          :play-animation="playAnimation"
          @update:play-animation="playAnimation = $event"
        />
        <!-- The following implements the same bar chart in different API to serve as a migration guide -->
        <D3BarComposistion
          v-if="isComposition"
          :playAnimation="playAnimation"
        />
        <D3BarOptions v-if="!isComposition" :playAnimation="playAnimation" />
      </a-row>
      <a-row class="row-half">
        <Datasaurus id="datasaurus_container" />
      </a-row>
    </a-col>
    <a-col :span="18">
      <a-row class="row-two-third">
        <NetflixGraph />
      </a-row>
      <a-row class="row-one-third">
        <a-col :span="12">
          <NetflixDistBar />
        </a-col>
        <a-col :span="12">
          <NetflixTable />
        </a-col>
      </a-row>
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

.row-one-third {
  height: 300px;
}

.row-half {
  height: 450px;
}

.row-two-third {
  height: 600px;
}

.noselect {
  user-select: none;
}
</style>
