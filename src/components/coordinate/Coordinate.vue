<script setup lang="ts">
import * as Cesium from "cesium";
import {onMounted, ref} from "vue";
const viewerDivRef = ref<HTMLDivElement>()
let viewer: Cesium.Viewer | null = null
onMounted(() => {
  //影像层
  Cesium.Ion.defaultAccessToken ='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3MWFlNDhiYy05Y2I1LTRkYjUtYWJmOS0zNzI0MTU1YmNkYzEiLCJpZCI6MTgwMTM0LCJpYXQiOjE3MDA3MDY2ODd9.XPZK4BJFwtCR4G_gOQSWQzB4HgHMyXIdMkM4JszqRcU'
  viewer = new Cesium.Viewer(viewerDivRef.value as HTMLElement)
  let  layers= viewer.scene.imageryLayers;
  layers.addImageryProvider(new Cesium.BingMapsImageryProvider({
    key :"Av63hPkCmH18oGGn5Qg3QhLBJvknZ97xbhyw3utDLRtFv7anHjXNOUQbyWBL5fK5",//可至官网（https://www.bingmapsportal.com/）申请key
    url : "//dev.virtualearth.net"
  }));

  //角度传弧度
})
</script>
<template>
  <div id="cesium-viewer" ref="viewerDivRef"></div>
</template>

<style scoped>
#cesium-viewer {
  width: 100%;
  height: 100%;
}
</style>
