<script setup lang="ts">
import { ref } from 'vue'
//cesium样式
import 'cesium/Build/CesiumUnminified/Widgets/widgets.css'

const options = [
  {
    value: '',
    label: 'ArcGIS地图',
  },
  {
    value: 'tianditu',
    label: '天地图',
  },
  {
    value: 'bing',
    label: 'Bing地图',
  },
  {
    value: 'camera',
    label: '相机',
  },
  {
    value: 'point',
    label: '点',
  },
  {
    value: 'polyline',
    label: '线',
  },
  {
    value: 'plane',
    label: '面',
  },
  {
    value: 'polygon',
    label: '多边形',
  },
  {
    value: 'draw',
    label: '绘图',
  },
  {
    value: 'model',
    label: '模型',
  },
  {
    value: 'kml',
    label: 'kml数据',
  },
]
</script>
<template>
  <router-link :to="'/'+item.value" v-for="item in options" style="margin-right: 10px">{{item.label}}</router-link>
  <router-view></router-view>
</template>

<style scoped>
#cesium-viewer {
  width: 100%;
  height: 100%;
}
</style>
