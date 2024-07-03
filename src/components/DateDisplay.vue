<script setup lang="ts">
import moment from 'moment'
import { onMounted, ref } from 'vue'

export interface Props {
  format: string
}
const props = withDefaults(defineProps<Props>(), {
  format: 'MMMM Do'
})

const dateStr = ref(moment().format(props.format))

onMounted(() => {
  setInterval(() => {
    dateStr.value = moment().format(props.format)
  }, 1000)
})
</script>

<template>
  <div class="date-display">
    <span>{{ dateStr }}</span>
  </div>
</template>
