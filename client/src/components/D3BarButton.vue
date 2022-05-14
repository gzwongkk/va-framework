<script setup lang="ts">
/**
 * This component demonstrates basic usage of the composition API to create simple reusable components.
 * To reduce duplicated definitions of variables, v-model bindings are used here.
 * Read more at https://vuejs.org/guide/components/events.html#usage-with-v-model
 */
import { defineEmits, defineProps, watch } from 'vue';
import { PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons-vue';

const props = defineProps({
  isComposition: Boolean,
  playAnimation: Boolean,
});
const emit = defineEmits(['update:isComposition', 'update:playAnimation']);
watch(
  () => props.isComposition,
  (bool: boolean) => emit('update:isComposition', bool)
);
</script>

<template>
  <div class="button_group">
    <!-- Using switch has simpler syntax support for two options -->
    <a-switch v-model:checked="isComposition">
      <template #checkedChildren>Composition</template>
      <template #unCheckedChildren>Options</template>
    </a-switch>
    <!-- Similar approach with buttons -->
    <a-button
      size="small"
      shape="round"
      :type="playAnimation ? 'primary' : ''"
      @click="$emit('update:playAnimation', !playAnimation)"
    >
      <template #icon>
        <play-circle-outlined v-if="playAnimation" />
        <pause-circle-outlined v-else />
      </template>
    </a-button>
  </div>
</template>

<style scoped>
.button_group {
  position: absolute;
  margin-top: 5px;
  right: 10px;
  margin-right: 5px;
}
</style>
