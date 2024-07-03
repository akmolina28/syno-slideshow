<script setup lang="ts">
import moment from 'moment'
import { onMounted, ref } from 'vue'

export interface Props {
  format: string
}
const props = withDefaults(defineProps<Props>(), {
  format: 'h:mm:ss A'
})

const timeStr = ref(moment().format(props.format))

onMounted(() => {
  setInterval(() => {
    timeStr.value = moment().format(props.format)
  }, 1000)
})
</script>

<template>
  <div class="digital-clock">
    <span>{{ timeStr }}</span>
  </div>
</template>
