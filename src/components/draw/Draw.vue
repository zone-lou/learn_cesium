<script setup lang="ts">
import * as Cesium from "cesium";
import {onMounted, ref} from "vue";
import CesiumEntityDraw from "../../utils/CesiumEntityDraw"
const viewerDivRef = ref<HTMLDivElement>()
let viewer: Cesium.Viewer | null = null
const selectValue = ref('')
const options = [
  {
    value: 'point',
    label: '点',
  },
  {
    value: 'line',
    label: '先',
  },
  {
    value: 'rectangle',
    label: '矩形',
  },
  {
    value: 'polygon',
    label: '多边形',
  },
]
onMounted(() => {
  //影像层
  Cesium.Ion.defaultAccessToken ='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3MWFlNDhiYy05Y2I1LTRkYjUtYWJmOS0zNzI0MTU1YmNkYzEiLCJpZCI6MTgwMTM0LCJpYXQiOjE3MDA3MDY2ODd9.XPZK4BJFwtCR4G_gOQSWQzB4HgHMyXIdMkM4JszqRcU'
  viewer = new Cesium.Viewer(viewerDivRef.value as HTMLElement)
})
const buttonClick=(value)=>{
  const drawEntities = new CesiumEntityDraw(viewer!, {});
  drawEntities.startDraw(value);
}
</script>
<template>
  <el-button round v-for="item in options" @click="buttonClick(item.value)">{{item.label}}</el-button>
  <div id="cesium-viewer" ref="viewerDivRef"></div>
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
