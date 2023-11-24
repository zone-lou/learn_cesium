<script setup lang="ts">
import * as Cesium from "cesium";
import {onMounted, ref} from "vue";
import CesiumEntityDraw from "../../utils/CesiumEntityDraw"
const viewerDivRef = ref<HTMLDivElement>()
let viewer: Cesium.Viewer | null = null
const selectValue = ref('')
const options = [
  {
    value: 'view',
    label: 'setView',
  },
  {
    value: 'viewRectangle',
    label: 'setViewRectangle',
  },
  {
    value: 'sandiego',
    label: 'flyto',
  },
  {
    value: 'heading',
    label: 'flyToHeadingPitchRoll',
  },
  {
    value: 'flyToRectangle',
    label: 'flyToRectangle',
  },
  {
    value: 'flyInACity',
    label: 'flyInACity',
  },
  {
    value: 'losAngelesToTokyo',
    label: 'losAngelesToTokyo',
  },
  {
    value: 'draw',
    label: 'draw',
  }

]
onMounted(() => {
  //影像层
  Cesium.Ion.defaultAccessToken ='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3MWFlNDhiYy05Y2I1LTRkYjUtYWJmOS0zNzI0MTU1YmNkYzEiLCJpZCI6MTgwMTM0LCJpYXQiOjE3MDA3MDY2ODd9.XPZK4BJFwtCR4G_gOQSWQzB4HgHMyXIdMkM4JszqRcU'
  viewer = new Cesium.Viewer(viewerDivRef.value as HTMLElement)

})
const selectChange=(value)=>{

  console.log(value)
  switch (value){
    case 'view':
      return setViewer();
    case 'viewRectangle':
      return setViewReatangle();
    case  'sandiego':
      return toSandiego();
    case 'heading':
      return flyToHeadingPitchRoll();
    case 'flyToRectangle':
      return flyToRectangle();
    case 'flyInACity':
      return flyInACity();
    case 'losAngelesToTokyo':
      return losAngelesToTokyo();
    case 'draw':
      return draw();

  }
}
const draw=()=>{
  const drawEntities = new CesiumEntityDraw(viewer!, {});
  drawEntities.startDraw('rectangle');
}
const setViewer=()=>{
  //设置相机位置
  viewer?.camera.setView({
    // 定义相机的目标位置(笛卡尔坐标)
    destination: {
      x: -2349785.4381783823,
      y: 4596905.031779513,
      z: 3743318.751622788
    },
    // 定义相机的方向和角度
    orientation: {
      // 相机的偏转角度（heading表示从正北开始逆时针旋转的角度。其数值是以弧度表示的。一个值为0的heading通常表示正北）
      // 偏航角（飞机向左飞还是向右飞）
      heading: 0.1015029573852555,
      // 相机的上下倾斜角度（一个负的pitch值表示相机是向下倾斜的。）
      // 俯仰角（飞机向上抬头或是向下低头）
      pitch: -0.3482370478292893,
      // 相机围绕其查看方向（或称前进方向）的旋转角度（当roll值为π/2或90°（转换为弧度）时，相机将绕其前进方向旋转90度。这意味着相机的“顶部”现在指向其右侧。）
      // 翻滚角（飞机沿前进方向轴顺时针翻转为正角度）
      roll: 0.00005029594533212389
    }
  });
}
const setViewReatangle=()=>{
  var west = -77.0;
  var south = 38.0;
  var east = -72.0;
  var north = 42.0;

  var rectangle = Cesium.Rectangle.fromDegrees(west, south, east, north);
  viewer?.camera.setView({
    //矩形
    destination: rectangle
  });

  // Show the rectangle.  Not required; just for show.
  viewer?.entities.add({
    rectangle : {
      coordinates : rectangle,
      fill : false,
      outline : true,
      outlineColor : Cesium.Color.WHITE
    }
  });
}
const toSandiego=()=>{
  viewer?.camera.flyTo({
    // 定义相机的目标位置(笛卡尔坐标)
    destination : Cesium.Cartesian3.fromDegrees(-117.16, 32.71, 15000.0)
  })
}
const flyToHeadingPitchRoll=()=>{
  viewer?.camera.flyTo({
    // 定义相机的目标位置(笛卡尔坐标)
    destination : Cesium.Cartesian3.fromDegrees(-122.22, 46.12, 5000.0),
    orientation : {
      // 相机的偏转角度（heading表示从正北开始逆时针旋转的角度。其数值是以弧度表示的。一个值为0的heading通常表示正北）
      // 偏航角（飞机向左飞还是向右飞）
      heading: Cesium.Math.toRadians(20.0),
      // 相机的上下倾斜角度（一个负的pitch值表示相机是向下倾斜的。）
      // 俯仰角（飞机向上抬头或是向下低头）
      pitch: Cesium.Math.toRadians(-35.0),
      // 相机围绕其查看方向（或称前进方向）的旋转角度（当roll值为π/2或90°（转换为弧度）时，相机将绕其前进方向旋转90度。这意味着相机的“顶部”现在指向其右侧。）
      // 翻滚角（飞机沿前进方向轴顺时针翻转为正角度）
      roll: 0.0
    }
  });

}
const flyToRectangle=()=>{
  var west = -90.0;
  var south = 38.0;
  var east = -87.0;
  var north = 40.0;
  var rectangle = Cesium.Rectangle.fromDegrees(west, south, east, north);
  viewer?.camera.flyTo({
    destination : rectangle
  });
  // Show the rectangle.  Not required; just for show.
  viewer?.entities.add({
    rectangle : {
      coordinates : rectangle,
      fill : false,
      outline : true,
      outlineColor : Cesium.Color.WHITE
    }
  });
}
const flyInACity=()=>{
  viewer?.camera.flyTo({
    destination : Cesium.Cartesian3.fromDegrees(-73.98580932617188, 40.74843406689482, 363.34038727246224),
    complete : function() {
      setTimeout(function() {
        viewer?.camera.flyTo({
          destination : Cesium.Cartesian3.fromDegrees(-73.98585975679403, 40.75759944127251, 186.50838555841779),
          orientation : {
            heading : Cesium.Math.toRadians(200.0),
            pitch : Cesium.Math.toRadians(-50.0)
          },
          easingFunction : Cesium.EasingFunction.LINEAR_NONE
        });
      }, 1000);
    }
  });
}
const losAngelesToTokyo=()=>{
  let tokyoOptions = {
    destination : Cesium.Cartesian3.fromDegrees(139.8148, 35.7142, 20000.0),
    orientation: {
      heading : Cesium.Math.toRadians(15.0),
      pitch : Cesium.Math.toRadians(-60),
      roll : 0.0
    },
    duration: 20,
    flyOverLongitude: Cesium.Math.toRadians(60.0)
  };

  let laOptions = {
    destination : Cesium.Cartesian3.fromDegrees(-117.729, 34.457, 10000.0),
    duration: 5,
    orientation: {
      heading : Cesium.Math.toRadians(-15.0),
      pitch : -Cesium.Math.PI_OVER_FOUR,
      roll : 0.0
    }
  };

  laOptions.complete = function() {
    setTimeout(function() {
      viewer?.camera.flyTo(tokyoOptions);
    }, 1000);
  };

  // if (adjustPitch) {
  //   tokyoOptions.pitchAdjustHeight = 1000;
  //   laOptions.pitchAdjustHeight = 1000;
  // }

  viewer?.camera.flyTo(laOptions);
}
</script>
<template>
  <div id="cesium-viewer" ref="viewerDivRef"></div>
  <div class="select">
      <el-select v-model="selectValue" placeholder="Select" @change="selectChange">
        <el-option
            v-for="item in options"
            :key="item.value"
            :label="item.label"
            :value="item.value"
            :disabled="item.disabled"
        />
      </el-select>
  </div>
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
