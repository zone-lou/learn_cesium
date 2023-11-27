<script setup lang="ts">
import * as Cesium from "cesium";
window.Cesium = Cesium;
import {onMounted, ref} from "vue";
import CesiumEntityDraw from "../../utils/CesiumEntityDrawDemo"
// import cesiumDraw from 'cesium-draw'
// import 'cesium-draw/dist/theme/default.css'
const viewerDivRef = ref<HTMLDivElement>()
let drawManager = ref(null);
let viewer= null
const selectValue = ref('')
const options = [
  {
    value: 'point',
    label: '点',
  },
  {
    value: 'line',
    label: '线',
  },
  {
    value: 'rectangle',
    label: '矩形',
  },
  {
    value: 'polygon',
    label: '多边形',
  },
  {
    value: 'circle',
    label: '圆',
  },
]
onMounted(() => {
  //影像层
  Cesium.Ion.defaultAccessToken ='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3MWFlNDhiYy05Y2I1LTRkYjUtYWJmOS0zNzI0MTU1YmNkYzEiLCJpZCI6MTgwMTM0LCJpYXQiOjE3MDA3MDY2ODd9.XPZK4BJFwtCR4G_gOQSWQzB4HgHMyXIdMkM4JszqRcU'
  viewer = new Cesium.Viewer(viewerDivRef.value as HTMLElement)
  // drawManager.value?.init(viewer)
})
const buttonClick=(value)=>{
  const drawEntities = new CesiumEntityDraw(viewer!, {});
  drawEntities.startDraw(value);
}
</script>
<template>
  <el-button round v-for="item in options" @click="buttonClick(item.value)">{{item.label}}</el-button>
  <div id="cesium-viewer" ref="viewerDivRef"></div>
<!--  <cesium-draw ref='drawManager' :viewer="viewer"></cesium-draw>-->
</template>

<style scoped>
#cesium-viewer {
  width: 100%;
  height: 95%;
}
.select{
  position: absolute;
  left: 20px;
  top: 20px;
}
</style>
