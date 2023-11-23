<script setup lang="ts">
import * as Cesium from "cesium";
import {onMounted, ref} from "vue";
const viewerDivRef = ref<HTMLDivElement>()
let viewer: Cesium.Viewer | null = null
onMounted(() => {
  //影像层
  Cesium.Ion.defaultAccessToken ='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3MWFlNDhiYy05Y2I1LTRkYjUtYWJmOS0zNzI0MTU1YmNkYzEiLCJpZCI6MTgwMTM0LCJpYXQiOjE3MDA3MDY2ODd9.XPZK4BJFwtCR4G_gOQSWQzB4HgHMyXIdMkM4JszqRcU'

  const img_img=new Cesium.WebMapTileServiceImageryProvider({
    url: "http://{s}.tianditu.gov.cn/img_c/wmts?service=wmts&request=GetTile&version=1.0.0" +
        "&LAYER=img&tileMatrixSet=c&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}" +
        "&style=default&format=tiles&tk=5d75e5a863cff113d19d114e31d1bfb2",
    layer: "tdtCva",
    style: "default",
    format: "tiles",
    tileMatrixSetID: "c",
    subdomains: ["t0", "t1", "t2", "t3", "t4", "t5", "t6", "t7"],
    tilingScheme: new Cesium.GeographicTilingScheme(),
    tileMatrixLabels: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19"],
    // maximumLevel: 18,
  });

  //注记层
  const img_cia=new Cesium.WebMapTileServiceImageryProvider({
    url: "http://{s}.tianditu.gov.cn/cia_c/wmts?service=wmts&request=GetTile&version=1.0.0" +
        "&LAYER=cia&tileMatrixSet=c&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}" +
        "&style=default&format=tiles&tk=5d75e5a863cff113d19d114e31d1bfb2",
    layer: "tdtCva",
    style: "default",
    format: "tiles",
    tileMatrixSetID: "c",
    subdomains: ["t0", "t1", "t2", "t3", "t4", "t5", "t6", "t7"],
    tilingScheme: new Cesium.GeographicTilingScheme(),
    tileMatrixLabels: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19"],
    maximumLevel: 18,

  })

  viewer = new Cesium.Viewer(viewerDivRef.value as HTMLElement)
  let layers=viewer.scene.imageryLayers;
  layers.addImageryProvider(img_cia);
  // layers.addImageryProvider(img_img);

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
