<script setup lang="ts">
import * as Cesium from "cesium";
import {onMounted, ref} from "vue";
const viewerDivRef = ref<HTMLDivElement>()
let viewer: Cesium.Viewer | null = null
onMounted(() => {
  //影像层
  Cesium.Ion.defaultAccessToken ='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3MWFlNDhiYy05Y2I1LTRkYjUtYWJmOS0zNzI0MTU1YmNkYzEiLCJpZCI6MTgwMTM0LCJpYXQiOjE3MDA3MDY2ODd9.XPZK4BJFwtCR4G_gOQSWQzB4HgHMyXIdMkM4JszqRcU'
  viewer = new Cesium.Viewer(viewerDivRef.value as HTMLElement, {
    geocoder: false, // 地名查找,默认true
    homeButton: false, // 主页按钮，默认true
    sceneModePicker: false, //二三维切换按钮
    baseLayerPicker: false, // 地图切换控件(底图以及地形图)是否显示,默认显示true
    navigationHelpButton: false, // 问号图标，导航帮助按钮，显示默认的地图控制帮助
    animation: false, // 动画控制，默认true .
    shouldAnimate: false, // 是否显示动画控制，默认true .
    shadows: true, // 阴影
    timeline: false, // 时间轴,默认true .
    CreditsDisplay: false, // 展示数据版权属性
    fullscreenButton: false, // 全屏按钮,默认显示true
    infoBox: true, // 点击要素之后显示的信息,默认true
    selectionIndicator: true, // 选中元素显示,默认true
    contextOptions: {
      webgl: {
        preserveDrawingBuffer: true //cesium状态下允许canvas转图片convertToImage
      }
    }
  })
  viewer._cesiumWidget._creditContainer.style.display = "none";  //去除左下角logo
  let  layers= viewer.scene.imageryLayers;
  layers.addImageryProvider(new Cesium.ArcGisMapServerImageryProvider({
    name:"img_arcgis",
    url:"https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer"
  }));
  viewer.entities.add({
    //坐标
    position : Cesium.Cartesian3.fromDegrees(-75.59777, 40.03883),
    //
    point : {
      show : true,
      //点大小
      pixelSize : 10,
      //点颜色
      color : Cesium.Color.SKYBLUE,
      //外圈颜色
      outlineColor : Cesium.Color.YELLOW,
      //外圈宽度
      outlineWidth : 3
    }
  });

})
</script>
<template>
  <div id="cesium-viewer" ref="viewerDivRef"></div>
</template>

<style scoped>
#cesium-viewer {
  width: 100%;
  height: 90%;
}
</style>
