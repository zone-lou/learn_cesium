<template>
  <div id="mapContainer"></div>
  <div class="toolbar">
    <el-button v-for="(item, index) in plotList" :key="index" class="toolbar-btn" type="primary" @click="start(item)">{{
        item.name }}</el-button>
    <el-button class="toolbar-btn" type="primary" danger @click="clear">清除</el-button>
    <el-table :data="entityObjArr" style="width: 100%">
      <el-table-column prop="name" label="名称"  width="180" />
      <el-table-column prop="type" label="类型"  width="180" />
      <el-table-column prop="distance" label="长度" width="200" >
<!--        <template #default="scope">-->
<!--          <div>{{distanceSum(scope.row)}}<span>米</span></div>-->
<!--        </template>-->
      </el-table-column>
      <el-table-column label="离地高度" width="200" >
        <template #default="scope">
          <el-slider v-model="scope.row.height" v-if="scope.row.type=='polygon'" :max="1000" :min="0" @change="sliderHeightChange(scope.row)" />
        </template>
      </el-table-column>
      <el-table-column label="物体高度" width="200" >
        <template #default="scope">
          <el-slider v-model="scope.row.extrudedHeight" v-if="scope.row.type=='polygon'" :max="1000" :min="0" @change="sliderHeightChange(scope.row)" />
          <el-slider v-model="scope.row.extrudedHeight" v-if="scope.row.type=='polyline'" :max="1000" :min="0" @change="sliderHeightChange(scope.row)" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" >
        <template #default="scope">
          <el-button
              size="small"
              type="danger"
              @click="handleDelete(scope.$index, scope.row)"
          >Delete</el-button
          >
<!--          <el-slider v-model="scope.row.extrudedHeight" v-if="scope.row.type=='polygon'" :max="10000" :min="1000" @change="sliderChange(scope.row)" />-->
<!--          <el-slider v-model="scope.row.extrudedHeight" v-if="scope.row.type=='polyline'" @change="sliderChange(scope.row)" />-->
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
<script setup lang="ts">
import {  ref,reactive, toRefs, onMounted,computed} from "vue";
import * as Cesium from "cesium";
import markerimg from "../../assets/start.png"
import Tool from "../../utils/js/drawTool.js"
import util from "../../utils/util";
let viewer = undefined;
const state = reactive({
  plotList: [{
    "name": "点",
    "type": "point",
    "iconImg": "./easy3d/images/plot/point.png",
    "styleType": "point",
    "children": []
  },
    {
      "name": "线",
      "type": "polyline",
      "iconImg": "./easy3d/images/plot/polyline.png",
      "styleType": "polyline",
      "children": [],
      "style": {
        "clampToGround": true,
        "color": "#ffff00"
      }
    },
    {
      "name": "面",
      "type": "polygon",
      "iconImg": "./easy3d/images/plot/polygon.png",
      "styleType": "polygon",
      "children": [],
      "style": {
        "color": "#00FFFF",
        "colorAlpha": 0.3,
        "outline": true,
        "outlineColor": "#ffffff",
        "heightReference": 0
      }
    },
    {
      "name": "图标",
      "type": "billboard",
      "iconImg": "./easy3d/images/plot/billboard.png",
      "style": {
        "image": markerimg
      },
      "styleType": "billboard",
      "children": []
    },
    {
      "name": "文字",
      "type": "label",
      "iconImg": "./easy3d/images/plot/label.png",
      "style": {
        "text": "Easy3D",
        "fillColor": "#fff",
        "outline": false,
        "outlineWidth": 1,
        "outlineColor": "#ff0000",
        "heightReference": 0,
        "showBackground": true,
        "backgroundColor": "#000",
        "scale": 1
      },
      "styleType": "label",
      "children": []
    }
  ]
})

const { plotList } = toRefs(state);
let plotDrawTool :any=undefined;
let entityObjArr=reactive([])

onMounted(() => {
  viewer = new Cesium.Viewer('mapContainer', {
    imageryProvider: new Cesium.BingMapsImageryProvider({
      key :"Av63hPkCmH18oGGn5Qg3QhLBJvknZ97xbhyw3utDLRtFv7anHjXNOUQbyWBL5fK5",//可至官网（https://www.bingmapsportal.com/）申请key
      url : "//dev.virtualearth.net"
    }),
    animation: false,  // 设置动画小组件关闭展示
    timeline: false, // 时间轴关闭展示
    infoBox: false, // 信息盒子关闭展示
    geocoder: false, // 地理编码搜索关闭展示
    baseLayerPicker: false, // 基础图层选择器关闭展示
    sceneModePicker: false, // 场景选择器关闭展示
    fullscreenButton: false, // 全屏按钮关闭展示
    navigationInstructionsInitiallyVisible: false, // 导航说明是否最初展示
    navigationHelpButton: false, // 导航帮助按钮关闭展示
    homeButton: false
  });

  document.getElementsByClassName("cesium-viewer-bottom")[0].style.display = "none";
  viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
      Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
  );
  util.setCameraView({
    "x": 116.30737298856594,
    "y": 31.157848537028933,
    "z": 1716.1274826753247,
    "heading": 248.7107277792296,
    "pitch": -20.656432783262787,
    "roll": 359.99918274478455,
    "duration": 0
  }, viewer);

  plotDrawTool = new Tool(viewer, {
    canEdit: true,
  });
  //添加事件监听
  plotDrawTool.on("endCreate", endCreate)
  plotDrawTool.on("remove",remove)
  plotDrawTool.on('editing',editing)

});
const endCreate=(entObj:any,ent:any)=>{
  entityObjArr.push({
    id:entObj.attr.id,
    name:entObj.name,
    type:entObj.type,
    objId:entObj.objId,
    height:0,
    extrudedHeight:0,
    distance:entObj.distances.reduce((total:any, num:any) => total + num, 0)
  })
}
const remove=(entObj:any,ent:any)=>{
  entityObjArr.splice(entObj.index, 1);
}
const editing=(entObj:any,ent:any)=>{
  // console.log(entObj,'编辑实体')
  entityObjArr.forEach((item)=>{
    if(item.id==entObj.attr.id){
      item.distance=entObj.distances.reduce((total:any, num:any) => total + num, 0)
    }
  })
}
const start = (item: any) => {
  item = JSON.parse(JSON.stringify(item)); // 数据隔离
  plotDrawTool.start(item)
}
const clear = () => {
  if (!plotDrawTool) return;
  plotDrawTool.removeAll();
}
const handleDelete =(index:any,item:any)=>{
   let removeObj=plotDrawTool.removeById(item.id)
}
// const sliderChange=(item:any)=>{
//   let obj=plotDrawTool.getEntityObjById(item.id)
//   console.log(obj,5555)
//   //修改多边形
//   obj.entityObj.entity.polygon.height=item.extrudedHeight/2
//   obj.entityObj.entity.polygon.extrudedHeight=item.extrudedHeight
//   obj.entityObj.modelHeight=item.extrudedHeight/2
//   // //修改拖拽点高度
//   // obj.entityObj.controlPoints.forEach((point:any)=>{
//   //   var lnglat = Cesium.Cartographic.fromCartesian(point.position._value);
//   //   var lat = Cesium.Math.toDegrees(lnglat.latitude);
//   //   var lng = Cesium.Math.toDegrees(lnglat.longitude);
//   //   var hei = lnglat.height+item.extrudedHeight/2;
//   //   console.log(lat,lng,hei ,'点属性')
//   //   let cartesian3=  Cesium.Cartesian3.fromDegrees(lng,lat,hei)
//   //   point.position=cartesian3
//   //
//   // })
//   // let  test=obj.entityObj.controlPoints
//
//
// }
const distanceSum=(item:any)=>{
  let obj=plotDrawTool.getEntityObjById(item.id)
  if(item.type=='polyline'){
    let distance=0
    return item.distances.reduce((total:any, num:any) => total + num, 0)
  }
  else{
    return 0
  }
}
const sliderHeightChange=(item:any)=>{
  let obj=plotDrawTool.getEntityObjById(item.id)
  if(item.type=='polygon'){
    obj.entityObj.entity.polygon.height=item.height;
    obj.entityObj.entity.polygon.extrudedHeight=item.height+item.extrudedHeight;
  }
  if(item.type=='polyline'){
    if(item.extrudedHeight>0){
      //隐藏线
      obj.entityObj.entity.polyline.show=false;
      //判断有没有墙
      if(obj.entityObj.wall){
        obj.entityObj.modelHeight=item.extrudedHeight;
      }
      else{
        //创建墙
        obj.entityObj.createWall(item.extrudedHeight);
      }
    }
    else{
      //显示线
      obj.entityObj.entity.polyline.show=true;
      //隐藏墙
      obj.entityObj.wall.wall.show=true;
    }
  }
}
</script>

<style scoped>
#mapContainer {
  height: 100%;
  margin: 0;
  padding: 0;
}

.toolbar {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 99;
}

.toolbar-btn {
  margin: 10px;
}
</style>
