/**
 * @descripion:
 * 封装Cesium画笔2.4 配合绘制编辑工具使用
 * @param {_viewer}  可视化窗口对象实例
 * @param {GdrawingMode = "polygon"} 绘制模型（默认绘制多边形）
 */
import * as Cesium from "cesium";
// import { useMapStore } from "@/stores/Map";
// 初始化 内部viewer
let _viewer;
// 方式
let drawingMode;
// 绘制好的实体
let myDraw;
// 点坐标列表
let activeShapePoints = [];
// 正在绘制的实体
let activeShape;
// 浮动点
let floatingPoint;
// 事件
let handler;
// 定义一个上次单击时间变量
let lastClickTime = 0;
// 定义一个阈值变量
let threshold = 300;
// 绘制多边形的节点
let nodeArr = [];
// 绘制的点
let pointArr = [];
// 初始化实体层级
let nextzIndex = 1;
/**
 * 鼠标事件监听
 * @param {_viewer}
 */
const clickListener = (_viewer) => {
  // 获取当前时间
  let currentTime = _viewer.clock.currentTime;
  // 转换为JavaScript的Date对象
  let currentDate = Cesium.JulianDate.toDate(currentTime);
  // 获取毫秒数
  let currentMillis = currentDate.getTime();
  // 计算当前时间和上次单击时间的差值
  let deltaTime = currentMillis - lastClickTime;
  return { deltaTime, currentMillis };
};
/**
 * 定义鼠标事件
 * @param {call}
 */
function mouseEvent(call) {
  // 左键单击绘制
  handler.setInputAction((event) => {
    const { deltaTime, currentMillis } = clickListener(_viewer);
    if (deltaTime < threshold) {
      lastClickTime = 0;
      return;
    } else {
      const earthPosition = _viewer.scene.pickPosition(event.position);
      if (Cesium.defined(earthPosition)) {
        lastClickTime = currentMillis;
        if (drawingMode == "point") {
          let point;
          call((point = createShape(earthPosition)));
          pointArr.push(point); //储存绘制的点 方便删除或撤销操作对应的点
        } else {
          if (activeShapePoints.length === 0) {
            activeShapePoints.push(earthPosition);
            let dynamicPositions = new Cesium.CallbackProperty(() => {
              if (drawingMode === "polygon") {
                // 多边形的position需要用 PolygonHierarchy进行转化
                return new Cesium.PolygonHierarchy(activeShapePoints);
              }
              return activeShapePoints;
            }, false);
            activeShape = createShape(dynamicPositions, 1);
          }
          activeShapePoints.push(earthPosition);
          nodeArr.push(createFloatingPoint(earthPosition));
        }
      }
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  // 左键双击结束绘制
  handler.setInputAction(() => {
    if (drawingMode === "point") {
      terminateShape();
    } else {
      terminateShape();
      call(createShape(myDraw));
    }
  }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

  //右键撤销上一个节点
  handler.setInputAction(() => {
    if (drawingMode === "point") {
      _viewer.entities.remove(pointArr.pop());
    } else {
      if (activeShapePoints.length > 1) {
        activeShapePoints.pop();
        _viewer.entities.remove(nodeArr.pop());
        activeShape && _viewer.entities.remove(activeShape);
        activeShape = createShape(
          new Cesium.CallbackProperty(() => {
            if (drawingMode === "polygon") {
              return new Cesium.PolygonHierarchy(activeShapePoints);
            }
            return activeShapePoints;
          }, false),
          1
        );
        floatingPoint.position.setValue(
          activeShapePoints[activeShapePoints.length - 1]
        );
      }
      // else if (activeShapePoints.length === 1) {
      // }
    }
  }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

  // 鼠标左键移动事件 MOUSE_MOVE
  handler.setInputAction((event) => {
    let newPosition = _viewer.scene.pickPosition(event.endPosition);
    if (Cesium.defined(newPosition)) {
      floatingPoint.position.setValue(newPosition);

      // 判断是否在绘制线或者面
      if (drawingMode != "point" && activeShapePoints.length > 0) {
        // 动态改变活动点的位置与鼠标当前位置保持一致
        activeShapePoints.pop();
        activeShapePoints.push(newPosition);
      }
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
}
/**
 * 创建浮动点
 * @param {positionData, dynamic}
 */
function createFloatingPoint(worldPosition) {
  let point = _viewer.entities.add({
    position: worldPosition,
    point: {
      color: Cesium.Color.RED,
      // 大小
      pixelSize: 10,
      heightReference: Cesium.HeightReference.NONE,
    },
  });
  return point;
}
/**
 * 创建线面
 * @param {positionData, dynamic}
 */
function createShape(positionData, dynamic) {
  let shape;
  switch (drawingMode) {
    case "point":
      const pointPops = {
        color:
          dynamic === 1
            ? Cesium.Color.RED
            : Cesium.Color.fromCssColorString("rgba(0,0,255,1)"),
        pixelSize: dynamic === 1 ? 10 : 14,
        outlineColor: dynamic === 1 ? "" : Cesium.Color.YELLOW,
        outlineWidth: dynamic === 1 ? "" : 3,
        heightReference:
          dynamic === 1
            ? Cesium.HeightReference.NONE
            : Cesium.HeightReference.CLAMP_TO_GROUND,

        verticalOrigin:
          dynamic === 1 ? undefined : Cesium.VerticalOrigin.CENTER,
        disableDepthTestDistance: dynamic === 1 ? undefined : 1000,
      };

      shape = _viewer.entities.add({
        name: "point",
        position: positionData,
        point: pointPops,
      });
      break;
    case "line":
      const lineProps = {
        positions: positionData,
        clampToGround: true,
        width: dynamic === 1 ? 7 : 10,
        material: new Cesium.PolylineGlowMaterialProperty({
          color:
            dynamic === 1
              ? Cesium.Color.fromCssColorString("rgba(35, 182, 180, 1)")
              : Cesium.Color.fromRandom({ alpha: 0.7 }),
        }),
        zIndex: dynamic === 1 ? 1 : 1, // dynamic this as needed
      };

      shape = _viewer.entities.add({
        name: "polyline",
        polyline: lineProps,
      });
      break;
    case "polygon":
      const polygonProps = {
        hierarchy: positionData,
        clampToGround: true,
        material: new Cesium.ColorMaterialProperty(
          dynamic === 1
            ? Cesium.Color.WHITE.withAlpha(0.7)
            : Cesium.Color.fromRandom({ alpha: 0.7 })
        ),
        zIndex: dynamic === 1 ? 999 : nextzIndex++,
      };
      shape = _viewer.entities.add({
        name: "polygon",
        polygon: polygonProps,
      });
      break;
  }
  return shape;
}
/**
 * 绘制
 * @param {viewer, GdrawingMode, call}
 */
function toDraw(viewer, GdrawingMode = "polygon", call) {
  // const { Drawing } = useMapStore();
  // Drawing(1); //修改画笔状态函数 1是绘画状态，禁用右键菜单等冲突功能
  handler && endDraw();
  drawingMode = GdrawingMode;
  _viewer = viewer;
  // 创建鼠标事件
  handler = new Cesium.ScreenSpaceEventHandler(_viewer.canvas);
  // 创建浮动点
  floatingPoint = createFloatingPoint(Cesium.Cartesian3.fromDegrees(0, 0));

  mouseEvent(call);
}
/**
 * 重新绘制形状，使其不是动态的，然后删除动态形状.
 */
function terminateShape() {
  // 删除最后一个点
  activeShapePoints = Array.from(activeShapePoints);
  activeShapePoints.pop();
  // 绘制完整的图形
  myDraw = activeShapePoints;
  endDraw();
}
/**
 * 结束绘制
 */
function endDraw() {
  if (handler) {
    //删除创建的节点
    nodeArr.length &&
      nodeArr.forEach((item) => {
        _viewer.entities.remove(item);
      });

    // 删除创建的浮动点和处于活动状态的实体
    floatingPoint && _viewer.entities.remove(floatingPoint);
    activeShape && _viewer.entities.remove(activeShape);

    // 格式化
    floatingPoint = null;
    activeShape = null;
    activeShapePoints = [];
    nodeArr = [];
    pointArr = [];
    handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK); //移除左键点击事件
    handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK); //移除左键双击事件
    handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE); //移除鼠标移动事件
    handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK); //移除右键点击事件
    handler = undefined;
    // const { Drawing } = useMapStore();
    // Drawing(0);
  }
}
/**
 * 开始编辑
 */
function startEdit() {
  editTool.start();
}
/**
 * 停止编辑
 */
function stopEdit() {
  editTool.stop();
}
export { toDraw, endDraw, startEdit, stopEdit };
