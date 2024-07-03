<script setup lang="ts">
import { onMounted, ref, type Ref, computed, watch } from 'vue'
import axios from 'axios'
import DigitalClock from './DigitalClock.vue'
import DateDisplay from './DateDisplay.vue'

class AlbumItem {
  constructor(
    public id: string,
    public cacheKey: string
  ) {}
}

class SlideshowImage {
  constructor(
    public id: string,
    public base64String: string | null,
    public isActive = false
  ) {}
}

let shareUrl: string
let width: string = '600'
let height: string = '400'
let size: string = 'm'
let hideTime = false
let hideDate = false
let random = false

let error = ref('')

onMounted(async () => {
  width = getParamFromQueryString('w', false) ?? width
  height = getParamFromQueryString('h', false) ?? height
  size = getParamFromQueryString('size', false) ?? size
  random = getParamFromQueryString('random') ? true : false
  hideDate = getParamFromQueryString('hideDate') ? true : false
  hideTime = getParamFromQueryString('hideTime') ? true : false

  const shareUrlParam = getParamFromQueryString('shareUrl', true)

  if (shareUrlParam) {
    shareUrl = shareUrlParam
    await indexAlbum()
    await show(0)
    play()
  }
})

const getParamFromQueryString = (param: string, required = false) => {
  const urlParams = new URLSearchParams(window.location.search)
  const val = urlParams.get(param)
  if (required && !val) {
    error.value = 'Missing required query string param ' + param
    console.error(error.value)
  }
  if (val == '') return 'true'
  return val
}

let albumItems: Ref<Array<AlbumItem> | null> = ref(null)
let slideshowImages: Ref<Array<SlideshowImage>> = ref([])
let slideshowPosition = ref(0)

const albumLength = computed(() => {
  if (albumItems.value) return albumItems.value.length
  else return 0
})

const nextPosition = computed(() => {
  if (albumLength.value > 0) {
    if (slideshowPosition.value == albumLength.value - 1) {
      return 0
    }
    return slideshowPosition.value + 1
  }
  return 0
})

const prevPosition = computed(() => {
  if (albumLength.value > 0) {
    if (slideshowPosition.value == 0) {
      return albumLength.value - 1
    }
    return slideshowPosition.value - 1
  }
  return 0
})

const shuffleItems = (arr: Array<AlbumItem>) => {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1))
    var temp = arr[i]
    arr[i] = arr[j]
    arr[j] = temp
  }
}

const getImage = async (id: string, cacheKey: string, size = 'xl') => {
  const url = `/backend/image?shareUrl=${shareUrl}&id=${id}&cacheKey=${cacheKey}&height=${height}&width=${width}&size=${size}`
  return axios({
    url,
    method: 'GET',
    responseType: 'blob'
  })
}

const indexAlbum = async () => {
  const response = await axios({
    url: '/backend/get-album-meta?shareUrl=' + shareUrl,
    method: 'GET'
  })

  albumItems.value = response.data.data.list.map(
    (item: any) => new AlbumItem(item.id, item.additional.thumbnail.cache_key)
  )
  if (albumItems.value && random) {
    shuffleItems(albumItems.value)
  }
}

const blobToBase64Async = (blob: Blob) => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.readAsDataURL(blob)
  })
}

const next = () => {
  slideshowImages.value[slideshowPosition.value].isActive = false
  if (slideshowPosition.value == albumLength.value - 1) {
    slideshowPosition.value = 0
  } else {
    slideshowPosition.value += 1
  }
  slideshowImages.value[slideshowPosition.value].isActive = true
}

const show = async (position: number) => {
  if (albumItems.value) {
    slideshowImages.value = await Promise.all(
      albumItems.value.map(async (item, i) => {
        let base64Data: string | null = null
        if ([slideshowPosition.value, nextPosition.value, prevPosition.value].indexOf(i) >= 0) {
          if (slideshowImages.value.length > 0 && slideshowImages.value[i].base64String) {
            base64Data = slideshowImages.value[i].base64String
          } else {
            const response = await getImage(item.id, item.cacheKey, size)
            base64Data = (await blobToBase64Async(response.data)) as string
          }
        }
        return new SlideshowImage(item.id, base64Data, i == position)
      })
    )
  }
}

const playing = ref(false)
let intervalId = 0

const play = (play = true) => {
  if (play) {
    intervalId = setInterval(() => {
      next()
    }, 15000)
    playing.value = true
  } else {
    clearInterval(intervalId)
    intervalId = 0
    playing.value = false
  }
}

watch(slideshowPosition, (newPosition: number) => {
  console.log(newPosition)
  show(newPosition)
})
</script>

<template>
  <div :style="'position: relative;height: ' + height + 'px;width: ' + width + 'px;'">
    <p v-if="error" class="error">{{ error }}</p>
    <DateDisplay v-if="!hideDate"></DateDisplay>
    <DigitalClock v-if="!hideTime"></DigitalClock>
    <Transition v-for="item in slideshowImages" name="fade" :key="item.id">
      <div v-show="item.isActive" style="position: absolute">
        <img :src="item.base64String ?? ''" />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.error {
  color: red;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.digital-clock,
.date-display {
  color: #f1f1f1;
  position: absolute;
  top: 1em;
  right: 1em;
  z-index: 1;
  font-family: monospace;
  font-size: 58px;
  text-shadow:
    0.05em 0 rgba(0, 0, 0, 0.3),
    0 0.05em rgba(0, 0, 0, 0.3),
    -0.05em 0 rgba(0, 0, 0, 0.3),
    0 -0.05em rgba(0, 0, 0, 0.3),
    -0.05em -0.05em rgba(0, 0, 0, 0.3),
    -0.05em 0.05em rgba(0, 0, 0, 0.3),
    0.05em -0.05em rgba(0, 0, 0, 0.3),
    0.05em 0.05em rgba(0, 0, 0, 0.3);
}
.date-display {
  left: 1em;
}
</style>
