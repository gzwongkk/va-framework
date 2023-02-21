<script setup lang="ts">
/**
 * This component implements a-tables for fast data demo.
 * It uses tags and tooltips to provide essential UI components for many VA systems.
 */
import { ref, onMounted } from 'vue';
import type { TableColumnsType } from 'ant-design-vue';
import { useConfig } from '../stores/vaConfig';
import { useNetflixStore, type Show } from '../stores/netflix';
import { useStaticNetflixStore } from '../stores/netflixStatic';
import { storeToRefs } from 'pinia';

const vaConfig = useConfig(); // define colors
const netflixStore = vaConfig.hasServer
  ? useNetflixStore()
  : useStaticNetflixStore(); // define data source according to the environment
const { billBurr } = storeToRefs(netflixStore); // obtain reactive variables

const tableScrollHeight = ref<number>(240); // 300 total height - 60 from header

// define the table columns
const columns: TableColumnsType = [
  { title: 'Title', dataIndex: 'title', key: 'title' },
  {
    title: 'Year',
    dataIndex: 'release_year',
    key: 'release_year',
    defaultSortOrder: 'descend',
    sorter: (a: Show, b: Show) => a.release_year - b.release_year, // define sorting order
  },
  { title: 'Country', dataIndex: 'country', key: 'country' },
  { title: 'Genre', dataIndex: 'listed_in', key: 'genre' },
];

// list the color used for each genre
const genreColor = (tag: string): string => {
  tag = tag.toLowerCase();
  return tag.includes('comed')
    ? vaConfig.color.type_one
    : tag.includes('movie')
    ? vaConfig.color.type_two
    : vaConfig.color.type_three;
};

// list the flag used for each country
const countryTag = (tag: string): string => {
  switch (tag) {
    case 'United States':
      tag = 'US';
      break;
    case 'United Kingdom':
      tag = 'GB';
      break;
    case 'Canada':
      tag = 'CA';
      break;
    case 'France':
      tag = 'FR';
      break;
  }
  // convert ISO 3166-1 alpha-2 string into country flag emoji
  // refer to https://github.com/thekelvinliu/country-code-emoji/blob/main/src/index.js
  const OFFSET = 127397;
  const codePoints = [...tag].map((c) => (c.codePointAt(0) as number) + OFFSET);
  return String.fromCodePoint(...codePoints);
};

// define the tooltip container
const getPopupContainer = (trigger: HTMLElement) => {
  return trigger.parentElement;
};

onMounted(() => {
  netflixStore.get_bill_burr(); // get the data after the component is mounted
});
</script>

<template>
  <div class="netflix noselect">
    <a-table
      :columns="columns"
      :data-source="billBurr"
      :scroll="{ y: tableScrollHeight }"
      :pagination="false"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'genre'">
          <span>
            <!-- Show tags in different colors for each genre -->
            <a-tag
              v-for="tag in record.listed_in.split(', ')"
              :key="tag"
              :color="genreColor(tag)"
            >
              {{ tag }}
            </a-tag>
          </span>
        </template>
        <template v-else-if="column.key === 'country'">
          <span v-for="tag in record.country.split(', ')" :key="tag">
            <!-- Show tooltip for hovering over country flag -->
            <a-tooltip :title="tag" :get-popup-container="getPopupContainer">
              {{ countryTag(tag) }}
            </a-tooltip>
          </span>
        </template>
      </template>
    </a-table>
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
