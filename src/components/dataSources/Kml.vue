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
  layers.addImageryProvider(new Cesium.UrlTemplateImageryProvider ({
    name:"img_urlTemplate",
    url:"https://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineStreetPurplishBlue/MapServer/tile/{z}/{y}/{x}"
  }));
  let options = {
    camera: viewer.scene.camera,
    canvas: viewer.scene.canvas
  };
  //加载kml
  let dataSourcePromise = viewer.dataSources.add(
      Cesium.KmlDataSource.load("/data/facilities.kml", options)
  );
  dataSourcePromise.then(function(dataSource) {
    //格式化图元 start
    var geocacheEntities = dataSource.entities.values;

    for (var i = 0; i < geocacheEntities.length; i++) {
      var entity = geocacheEntities[i];
      if (Cesium.defined(entity.billboard)) {
        //格式化 billboard，颜色及字体配置
        if (
            entity.billboard.image.getValue().url.indexOf("1.png") > -1
        ) {
          entity.label.fillColor = Cesium.Color.fromCssColorString(
              "#00BB3D"
          );
          entity.label.font = "700 16px Helvetica";
        } else if (
            entity.billboard.image.getValue().url.indexOf("2.png") > -1
        ) {
          entity.label.fillColor = Cesium.Color.fromCssColorString(
              "#09F0FE"
          );
          entity.label.font = "700 16px Helvetica";
        }
      }
    }
    //格式化图元 end

    var pixelRange = 40; //像素范围
    var minimumClusterSize = 2; //最小群集大小
    var enabled = true;

    dataSource.clustering.enabled = enabled;
    dataSource.clustering.pixelRange = pixelRange;
    dataSource.clustering.minimumClusterSize = minimumClusterSize;

    var removeListener;

    //自定义地图图钉样式
    var pinBuilder = new Cesium.PinBuilder();
    var pin50 = pinBuilder
        .fromText("50+", Cesium.Color.RED, 48)
        .toDataURL();
    var pin40 = pinBuilder
        .fromText("40+", Cesium.Color.ORANGE, 48)
        .toDataURL();
    var pin30 = pinBuilder
        .fromText("30+", Cesium.Color.YELLOW, 48)
        .toDataURL();
    var pin20 = pinBuilder
        .fromText("20+", Cesium.Color.GREEN, 48)
        .toDataURL();
    var pin10 = pinBuilder
        .fromText("10+", Cesium.Color.BLUE, 48)
        .toDataURL();

    var singleDigitPins = new Array(8);
    for (var i = 0; i < singleDigitPins.length; ++i) {
      singleDigitPins[i] = pinBuilder
          .fromText("" + (i + 2), Cesium.Color.VIOLET, 48)
          .toDataURL();
    }
    //自定义聚合图形样式
    function customStyle() {
      if (Cesium.defined(removeListener)) {
        removeListener();
        removeListener = undefined;
      } else {
        removeListener = dataSource.clustering.clusterEvent.addEventListener(
            function(clusteredEntities, cluster) {
              cluster.label.show = false;
              cluster.billboard.show = true;
              cluster.billboard.id = cluster.label.id;
              cluster.billboard.verticalOrigin = Cesium.VerticalOrigin.BOTTOM;

              if (clusteredEntities.length >= 50) {
                cluster.billboard.image = pin50;
              } else if (clusteredEntities.length >= 40) {
                cluster.billboard.image = pin40;
              } else if (clusteredEntities.length >= 30) {
                cluster.billboard.image = pin30;
              } else if (clusteredEntities.length >= 20) {
                cluster.billboard.image = pin20;
              } else if (clusteredEntities.length >= 10) {
                cluster.billboard.image = pin10;
              } else {
                //低于10的聚合规则
                cluster.billboard.image =
                    singleDigitPins[clusteredEntities.length - 2];
              }
            }
        );
      }

      // 强制使用新样式重新组合
      var pixelRange = dataSource.clustering.pixelRange;
      dataSource.clustering.pixelRange = 0;
      dataSource.clustering.pixelRange = pixelRange;
    }

    // 自定义样式开始
    customStyle();
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
