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
]
</script>

<template>
<!--  <el-select v-model="value" placeholder="Select" @change="selectChange">-->
<!--    <el-option-->
<!--        v-for="item in options"-->
<!--        :key="item.value"-->
<!--        :label="item.label"-->
<!--        :value="item.value"-->
<!--        :disabled="item.disabled"-->
<!--    />-->
<!--  </el-select>-->
  <router-link :to="'/'+item.value" v-for="item in options">{{item.label}}</router-link>
  <router-view></router-view>
</template>

<style scoped>
#cesium-viewer {
  width: 100%;
  height: 100%;
}
</style>
