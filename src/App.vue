<script setup lang="ts">
//cesium样式
import 'cesium/Build/CesiumUnminified/Widgets/widgets.css'

</script>

<template>
  <router-view></router-view>
</template>

<style scoped>
#cesium-viewer {
  width: 100%;
  height: 100%;
}
</style>
