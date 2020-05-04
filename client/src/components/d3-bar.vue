<template>
    <div id="d3-bar"></div>
</template>

<script>
  /*
  This component demonstrates one way to construct d3 visualization.
  d3 example source: https://observablehq.com/@d3/sortable-bar-chart
   */
  import * as d3 from "d3";
  import EventService from "../utils/event-service";

  export default {
    name: "D3Bar",
    props: {
      loadData: Object,
    },
    data() {
      return {
        svg: null,
      }
    },
    watch: {
      loadData: function () {
        // When data is changed in parent, render this component
        this.renderBarChart();
      },
    },
    mounted: function () {
      this.initBarChart();
      this.renderBarChart();
    },
    methods: {
      initBarChart() {
        // Initialize svg
        let width = this.$el.clientWidth;
        let height = this.$el.clientHeight;
        this.svg = d3.select(this.$el).append('svg').attr("viewBox", [0, 0, width, height]);
      },
      renderBarChart() {
        // Remove all groups in svg
        this.svg.selectAll("g").remove();

        // Configuration
        let width = this.$el.clientWidth;
        let height = this.$el.clientHeight;
        let margin = ({top: 20, right: 0, bottom: 30, left: 40});
        let xAxis = g => g
          .attr("transform", `translate(0,${height - margin.bottom})`)
          .call(d3.axisBottom(x).tickSizeOuter(0));
        let yAxis = g => g
          .attr("transform", `translate(${margin.left},0)`)
          .call(d3.axisLeft(y))
          .call(g => g.select(".domain").remove());

        // Data
        let data = [];
        for (let i = 0; i < 26; i++) {
          data.push({
            name: String.fromCharCode(97 + i),
            value: Math.floor(Math.random() * 100)
          });
        }

        let x = d3.scaleBand()
          .domain(data.map(d => d.name))
          .range([margin.left, width - margin.right])
          .padding(0.1);
        let y = d3.scaleLinear()
          .domain([0, d3.max(data, d => d.value)]).nice()
          .range([height - margin.bottom, margin.top]);

        this.svg.append("g")
          .attr("fill", "steelblue")
          .selectAll("rect")
          .data(data)
          .join("rect")
          .style("mix-blend-mode", "multiply")
          .attr("x", d => x(d.name))
          .attr("y", d => y(d.value))
          .attr("height", d => y(0) - y(d.value))
          .attr("width", x.bandwidth())
          .on('click', d => EventService.emitSelected(d.name, d.value));    // communication bus across components

        this.svg.append("g").call(xAxis);
        this.svg.append("g").call(yAxis);
      }
    }
  }
</script>

<style scoped>
</style>