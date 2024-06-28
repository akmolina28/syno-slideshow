<script setup lang="ts">
import { onMounted, ref, type Ref, computed, watch } from 'vue'
import axios from 'axios'

class AlbumItem {
    constructor(public id: string, public cacheKey: string) { }
}

class SlideshowImage {
    constructor(public id: string, public base64String: string | null, public isActive = false) { }
}

const sharingId = import.meta.env.VITE_SHARING_ID
const apiBaseUrl = import.meta.env.VITE_SYNOLOGY_BASE_URI
const width = import.meta.env.VITE_WIDTH ?? 600;
const height = import.meta.env.VITE_HEIGHT ?? 400;

let loggedIn = ref(false)
let albumItems: Ref<Array<AlbumItem> | null> = ref(null)
let slideshowImages: Ref<Array<SlideshowImage>> = ref([])
        
let albumLength = ref(0)
let slideshowPosition = ref(0)
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

const apiLoginAsync = async() => {
    const url = `${apiBaseUrl}/webapi/entry.cgi?api=SYNO.Core.Sharing.Login&method=login&version=1&sharing_id=0JDygnhoy`
    return axios({
        url,
        method: 'GET',
        withCredentials: true,
    })
}

const apiBrowseAlbumAsync = async() => {
    const url = `${apiBaseUrl}/webapi/entry.cgi?api=SYNO.Foto.Browse.Album&method=get&version=1`
    return axios({
        url,
        method: 'GET',
        withCredentials: true,
        headers: {
            'X-SYNO-SHARING': sharingId
        }
    })
}

const apiBrowseItemAsync = async(limit: number) => {
    const url = `${apiBaseUrl}/webapi/entry.cgi?api=SYNO.Foto.Browse.Item&method=list&version=1&additional=["thumbnail"]&offset=0&limit=${limit}`
    return axios({
        url,
        method: 'GET',
        withCredentials: true,
        headers: {
            'X-SYNO-SHARING': sharingId
        }
    })
}

const apiThumbnail = async(id: string, cacheKey: string, size = 'xl') => {
    // const url = `${apiBaseUrl}/webapi/entry.cgi?api=SYNO.Foto.Thumbnail&method=get&version=2&type=unit&size=${size}&_sharing_id=${sharingId}&id=${id}&cache_key=${cacheKey}`
    // return axios({
    //     url,
    //     method: 'GET',
    //     withCredentials: true,
    //     headers: {
    //         'X-SYNO-SHARING': sharingId
    //     },
    //     responseType: 'blob'
    // })

    const url = `http://127.0.0.1:1880/image?sharingId=${sharingId}&id=${id}&cacheKey=${cacheKey}`
    return axios({
        url,
        method: 'GET',
        responseType: 'blob'
    })
}

const login = async() => {
    apiLoginAsync().then(() => loggedIn.value = true)
}

const indexAlbum = async() => {
    let response = await apiBrowseAlbumAsync()
    albumLength.value = response.data.data.list[0].item_count

    response = await apiBrowseItemAsync(albumLength.value)
    albumItems.value = response.data.data.list.map((item: any) => new AlbumItem(item.id, item.additional.thumbnail.cache_key))
}

const blobToBase64Async = (blob: Blob) => {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

const next = () => {
    slideshowImages.value[slideshowPosition.value].isActive = false
    if (slideshowPosition.value == albumLength.value - 1) {
        slideshowPosition.value = 0
    }
    else {
        slideshowPosition.value += 1
    }
    slideshowImages.value[slideshowPosition.value].isActive = true
}

const prev = () => {
    if (slideshowImages) {
        slideshowImages.value[slideshowPosition.value].isActive = false
        if (slideshowPosition.value == 0) {
            slideshowPosition.value = albumLength.value - 1
        }
        else {
            slideshowPosition.value -= 1
        }
        slideshowImages.value[slideshowPosition.value].isActive = true
    }
}

const show = async(position: number) => {
    if (albumItems.value) {
        slideshowImages.value = await Promise.all(albumItems.value.map(async (item, i) => {
            let base64Data: string | null = null;
            if ([slideshowPosition.value, nextPosition.value, prevPosition.value].indexOf(i) >= 0) {
                if (slideshowImages.value.length > 0 && slideshowImages.value[i].base64String) {
                    base64Data = slideshowImages.value[i].base64String
                }
                else {
                    const response = await apiThumbnail(item.id, item.cacheKey)
                    base64Data = await blobToBase64Async(response.data) as string
                }
            }
            return new SlideshowImage(item.id, base64Data, i == position)
        }))
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
    }
    else {
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
    <!-- <h1>Sharing ID: {{ sharingId }}</h1> -->
    <!-- <h2 v-show="albumLength > 0">Album Length: {{ albumLength }}</h2> -->
    <!-- <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Cache Key</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="item in albumItems">
                <td>{{ item.id }}</td>
                <td>{{ item.cacheKey }}</td>
            </tr>
        </tbody>
    </table> -->
    <div>
        <button v-show="!loggedIn" type="button" @click="login">Login</button>
        <button v-show="loggedIn" type="button" @click="indexAlbum">Index Album</button>
        <div v-show="albumItems && albumItems.length > 0">
            <button @click="show(0)">Show</button>
            <button @click="prev">Prev</button>
            <button @click="next">Next</button>
            <button @click="play(!playing)">{{ playing ? "Playing" : "Paused" }}</button>
        </div>
    </div>
    <div style="position:relative">
        <Transition v-for="item in slideshowImages" name="fade" :key="item.id">
            <div v-show="item.isActive" style="position:absolute">
                <img :src="item.base64String ?? ''" :width="width" :height="height" />
            </div>
        </Transition>
    </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
