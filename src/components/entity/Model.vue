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
  // 加载模型
  let palaceTilesetLine = new Cesium.Cesium3DTileset({
    url: "/3DTiles/model/tileset.json"
  });

 viewer.scene.primitives.add(palaceTilesetLine);
  //加载模型数据并定位到模型
  var params = {
    tx: 108.94670, //模型中心X轴坐标（经度，单位：十进制度）
    ty: 34.26197, //模型中心Y轴坐标（纬度，单位：十进制度）
    tz: 500, //模型中心Z轴坐标（高程，单位：米）
    rx: 10, //X轴（经度）方向旋转角度（单位：度）
    ry: 20, //Y轴（纬度）方向旋转角度（单位：度）
    rz: 30, //Z轴（高程）方向旋转角度（单位：度）
    scale: 1 //放大倍数
  };
 palaceTilesetLine.readyPromise.then(function(argument) {
    //经纬度、高转笛卡尔坐标
    var position = Cesium.Cartesian3.fromDegrees(
        params.tx,
        params.ty,
        params.tz
    );
    var mat = Cesium.Transforms.eastNorthUpToFixedFrame(position);
    //缩放 start
    var scale = Cesium.Matrix4.fromUniformScale(params.scale);
    Cesium.Matrix4.multiply(mat, scale, mat);
    //缩放 end
    //旋转 start
    var mx = Cesium.Matrix3.fromRotationX(Cesium.Math.toRadians(params.rx));
    var my = Cesium.Matrix3.fromRotationY(Cesium.Math.toRadians(params.ry));
    var mz = Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(params.rz));
    var rotationX = Cesium.Matrix4.fromRotationTranslation(mx);
    var rotationY = Cesium.Matrix4.fromRotationTranslation(my);
    var rotationZ = Cesium.Matrix4.fromRotationTranslation(mz);
    Cesium.Matrix4.multiply(mat, rotationX, mat);
    Cesium.Matrix4.multiply(mat, rotationY, mat);
    Cesium.Matrix4.multiply(mat, rotationZ, mat);
    //旋转 end

    palaceTilesetLine._root.transform = mat;
  });

  //相机定位
  viewer.zoomTo(palaceTilesetLine);

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
