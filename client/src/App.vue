<template>
  <div>
    <svg width="1600" height="600">
      <g>
        <circle
          v-for="(d, i) in data"
          :key="i"
          :type="d.dataset"
          r="5"
          :cx="1400 - d.x * 5"
          :cy="550 - d.y * 5"
          fill="#ccc"
        />
      </g>
      <g>
        <circle
          v-for="(d, i) in data"
          :key="i"
          :type="d.dataset"
          r="5"
          :cx="200 + d.x * 5"
          :cy="550 - d.y * 5"
          fill="#ccc"
        />
      </g>
    </svg>
    <div
      v-for="dataset in datasets"
      :key="dataset"
      @click="selectData(dataset)"
    >
      {{ dataset }}
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from "pinia";
import { useStore } from "./store/datasaurus.js";
import D3Bar from "./components/d3-bar.vue";

export default {
  name: "App",
  components: {
    D3Bar,
  },
  computed: {
    ...mapState(useStore, {
      data: "datasaurus",
      datasets: "datasets",
    }),
  },
  data() {
    return {};
  },
  mounted() {},
  methods: {
    ...mapActions(useStore, ["selectData"]),
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  width: 1600px;
  height: 900px;
  margin: 2px;
  border: 1px solid lightblue;
}
</style>
