<script setup lang="ts">
import * as Cesium from "cesium";
import {onMounted, ref} from "vue";
const viewerDivRef = ref<HTMLDivElement>()
let viewer: Cesium.Viewer | null = null
onMounted(() => {
  //影像层
  Cesium.Ion.defaultAccessToken ='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3MWFlNDhiYy05Y2I1LTRkYjUtYWJmOS0zNzI0MTU1YmNkYzEiLCJpZCI6MTgwMTM0LCJpYXQiOjE3MDA3MDY2ODd9.XPZK4BJFwtCR4G_gOQSWQzB4HgHMyXIdMkM4JszqRcU'
  let img_img=new Cesium.WebMapTileServiceImageryProvider({
    url: "tdt/img_c/wmts?tk=5d75e5a863cff113d19d114e31d1bfb2",
    layer:'img',
    style:'default',
    tileMatrixSetID:'c',
    format:'tiles',
    maximumLevel: 18,
  });
  //注记层
  let img_cia=new Cesium.WebMapTileServiceImageryProvider({
    url: "tdt/cva_c/wmts?tk=5d75e5a863cff113d19d114e31d1bfb2",
    layer:'cva',
    style:'default',
    tileMatrixSetID:'c',
    format:'tiles',
    maximumLevel: 18,
  });
  viewer = new Cesium.Viewer(viewerDivRef.value as HTMLElement)
  let layers=viewer.scene.imageryLayers;
  layers.addImageryProvider(img_img);
  layers.addImageryProvider(img_cia);
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
