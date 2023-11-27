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
  //平面图形
  viewer.entities.add({
    name : 'Red polygon on surface',
    polygon : {
      hierarchy : Cesium.Cartesian3.fromDegreesArray([-115.0, 37.0,
        -115.0, 32.0,
        -107.0, 33.0,
        -102.0, 31.0,
        -102.0, 35.0]),
      material : Cesium.Color.RED
    }
  });
  //立体
  viewer.entities.add({
    name : 'Green extruded polygon',
    polygon : {
      hierarchy : Cesium.Cartesian3.fromDegreesArray([-108.0, 42.0,
        -100.0, 42.0,
        -104.0, 40.0]),
      extrudedHeight: 500000.0,
      material : Cesium.Color.GREEN,
      closeTop : false,
      closeBottom : false
    }
  });
  //高度不同的多边形
  viewer.entities.add({
    name : 'Orange polygon with per-position heights and outline',
    polygon : {
      hierarchy : Cesium.Cartesian3.fromDegreesArrayHeights([-108.0, 25.0, 100000,
        -100.0, 25.0, 100000,
        -100.0, 30.0, 100000,
        -108.0, 30.0, 300000]),
      extrudedHeight: 0,
      perPositionHeight : true,
      material : Cesium.Color.ORANGE.withAlpha(0.5),
      outline : true,
      outlineColor : Cesium.Color.BLACK
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
