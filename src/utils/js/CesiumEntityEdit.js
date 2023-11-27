/**
 * cesium 实体编辑：拖拽、旋转、修改
 */
import * as turf from "@turf/turf";
class CesiumEntityEdit {
  constructor(viewer, options) {
    this.viewer = viewer;
    this.options = options || {};
    this.selectedEntity = null; // 被选择的实体对象
    this.handler = null; // 事件捕获
    this.mouseStatus = null; // 当前鼠标状态 LEFT_DOWN：左键按下;LEFT_UP: 左键抬起；MOVE: 鼠标移动
    this.coordinates = []; // 当前被选中的实体组成的点集合
    this.entityType = "polygon"; // 当前被选中实体的类型
    this.entityCenter = []; // 多边形中心点
    this.strecthPointIds = []; // 拉伸点Id集合
    this.strecthObj = null; // 被选中的拉伸点
    this.isStrecth = false; // 当前是否点击拉伸点
  }
  start() {
    if (!this.handler) {
      this.handler = new Cesium.ScreenSpaceEventHandler(
        this.viewer.scene.canvas
      );
    }
    // 监听鼠标左键按下事件

    this.handler.setInputAction(
      (e) => this.handleLeftDown(e),
      Cesium.ScreenSpaceEventType.LEFT_DOWN
    );
    // 监听鼠标左键抬起事件
    this.handler.setInputAction(
      (e) => this.handleLeftUp(e),
      Cesium.ScreenSpaceEventType.LEFT_UP
    );
    // 监听鼠标移动事件
    this.handler.setInputAction(
      (e) => this.handleMouseMove(e),
      Cesium.ScreenSpaceEventType.MOUSE_MOVE
    );
  }
  handleLeftDown(e) {
    // 更新鼠标状态
    this.mouseStatus = "LEFT_DOWN";
    // 获取当前点击位置的实体对象
    const obj = this.viewer.scene.pick(e.position);
    if (!obj) {
      this.strecthObj = null;
      this.selectedEntity = null;
      this.viewer.scene.screenSpaceCameraController.enableRotate = true;
      this.removeStretchPoint();
      return;
    }
    if (obj && obj.id.name === "stretch_point") {
      const index = this.strecthPointIds.findIndex((p) => p === obj.id.id);
      this.strecthObjId_index = index;
      this.strecthObj = obj;
      this.isStrecth = true;
    } else {
      this.removeStretchPoint();
      this.strecthObj = null;
      this.selectedEntity = obj;
    }

    //锁定相机
    this.viewer.scene.screenSpaceCameraController.enableRotate = false;
    if (obj.id.polygon) {
      this.entityType = "polygon";
      this.coordinates =
        this.selectedEntity.id.polygon.hierarchy.getValue().positions;
      this.entityCenter = this.getEntityCenter();
      this.addStrecthPoint(this.selectedEntity.id.polygon);
    }
    if (obj.id.rectangle) {
      this.entityType = "rectangle";
      this.coordinates =
        this.selectedEntity.id.rectangle.coordinates.getValue();
      this.addStrecthPoint(this.selectedEntity.id.rectangle);
    }
    if (obj.id.point) {
      this.entityType = "point";
    }
  }
  handleLeftUp(e) {
    // 更新鼠标状态
    this.mouseStatus = "LEFT_UP";
  }
  handleMouseMove(e) {
    if (this.mouseStatus === "LEFT_DOWN" && this.selectedEntity) {
      // 拖拽实体
      if (this.strecthObj) {
        this.handleDrag(e, this.strecthObj);
        this.handleStretch(this.selectedEntity);
        return;
      }
      this.removeStretchPoint();
      this.handleDrag(e, this.selectedEntity);
    }
  }
  /**
   * 拖拽移动实体
   * @param {e, selectedEntity}
   */
  handleDrag(e, selectedEntity) {
    if (!selectedEntity) return;
    let coordinates = this.coordinates;
    // 获取开始位置坐标
    let startPosition = this.viewer.scene.camera.pickEllipsoid(
      e.startPosition,
      this.viewer.scene.globe.ellipsoid
    );
    // 获取结束位置坐标
    let endPosition = this.viewer.scene.camera.pickEllipsoid(
      e.endPosition,
      this.viewer.scene.globe.ellipsoid
    );
    selectedEntity.id.position = new Cesium.CallbackProperty(function () {
      return endPosition;
    }, false);
    let changed_x = endPosition.x - startPosition.x;
    let changed_y = endPosition.y - startPosition.y;
    let changed_z = endPosition.z - startPosition.z;
    if (this.entityType === "point") {
      let ray = this.viewer.camera.getPickRay(e.endPosition);
      let cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
      selectedEntity.id.position = new Cesium.CallbackProperty(() => {
        return cartesian;
      }, false);
    }
    if (this.entityType === "polygon") {
      let currentsPoint = [];
      for (let i = 0; i < coordinates.length; i++) {
        coordinates[i].x = coordinates[i].x + changed_x;
        coordinates[i].y = coordinates[i].y + changed_y;
        coordinates[i].z = coordinates[i].z + changed_z;
        currentsPoint.push(coordinates[i]);
      }
      selectedEntity.id.polygon.hierarchy = new Cesium.CallbackProperty(() => {
        return { positions: currentsPoint };
      }, false); // 防止闪烁
    }
    if (this.entityType === "rectangle") {
      let position_start = startPosition;
      let cartographic_start =
        Cesium.Cartographic.fromCartesian(position_start);
      let longitude_start = Cesium.Math.toDegrees(cartographic_start.longitude);
      let latitude_start = Cesium.Math.toDegrees(cartographic_start.latitude);

      let position_end = endPosition;
      let cartographic_end = Cesium.Cartographic.fromCartesian(position_end);
      let longitude_end = Cesium.Math.toDegrees(cartographic_end.longitude);
      let latitude_end = Cesium.Math.toDegrees(cartographic_end.latitude);

      let changer_lng = longitude_end - longitude_start;
      let changer_lat = latitude_end - latitude_start;
      coordinates.west = Cesium.Math.toRadians(
        Cesium.Math.toDegrees(coordinates.west) + changer_lng
      );
      coordinates.east = Cesium.Math.toRadians(
        Cesium.Math.toDegrees(coordinates.east) + changer_lng
      );
      coordinates.south = Cesium.Math.toRadians(
        Cesium.Math.toDegrees(coordinates.south) + changer_lat
      );
      coordinates.north = Cesium.Math.toRadians(
        Cesium.Math.toDegrees(coordinates.north) + changer_lat
      );
      selectedEntity.id.rectangle.coordinates = new Cesium.CallbackProperty(
        () => {
          return coordinates;
        },
        false
      );
    }
  }
  /**
   * 旋转实体
   * @param {angle}
   */
  handleRotation(angle) {
    if (!this.selectedEntity) return;
    // 旋转时清除辅助拉伸的点
    if (this.strecthPointIds.length) {
      this.removeStretchPoint();
    }
    if (this.entityType === "rectangle") {
      // 旋转图形
      this.selectedEntity.id.rectangle.rotation = new Cesium.CallbackProperty(
        function () {
          return angle;
        },
        false
      );
      // 旋转图形材质
      this.selectedEntity.id.rectangle.stRotation = new Cesium.CallbackProperty(
        function () {
          return angle;
        },
        false
      );
    }
    if (this.entityType === "polygon") {
      // let previousCoordinates = this.selectedEntity.id.polygon.hierarchy.getValue().positions
      // let coors = this.getWGS84FromDKR(previousCoordinates)
      // console.log(coors)
      // let poly = turf.polygon([coors])
      // let centroid = turf.centroid(poly)
      // let rotatedPoly = turf.transformRotate(poly, angle, { pivot: centroid.geometry.coordinates})
      // let newCoors = rotatedPoly.geometry.coordinates[0]
      // let positions = []
      // newCoors.forEach(item => {
      //  positions.push(item[0], item[1])
      // })
      this.selectedEntity.id.polygon.stRotation = new Cesium.CallbackProperty(
        function () {
          return Cesium.Math.toRadians(angle);
        },
        false
      );
      // this.selectedEntity.id.polygon.hierarchy = new Cesium.CallbackProperty(function () {
      //  return { positions: Cesium.Cartesian3.fromDegreesArray(positions) }
      // }, false)
    }
  }
  /**
   * 拉伸实体
   */
  handleStretch(selectedEntity) {
    if (!selectedEntity) return;
    // 初始化 positions 数组
    let positions = [];
    // 更新 polygon 的位置数组
    if (selectedEntity.id.polygon) {
      this.strecthPointIds.forEach((id) => {
        positions.push(
          this.viewer.entities
            .getById(id)
            .position.getValue(Cesium.JulianDate.now())
        );
      });
      selectedEntity.id.polygon.hierarchy = new Cesium.CallbackProperty(() => {
        return new Cesium.PolygonHierarchy(positions);
      }, false);
    }
    // 更新rectangle的位置数组
    if (selectedEntity.id.rectangle) {
      const index = this.strecthPointIds.findIndex(
        (item) => item === this.strecthObj.id.id
      );
      for (let i = 0; i < this.strecthPointIds.length; i++) {
        const id = this.strecthPointIds[i];
        // 矩形由两个对角的点组成的区域，因此先判断用户点击的是哪一个点，即奇偶判断
        if (index % 2 === 0) {
          if (i % 2 === 0) {
            positions.push(
              this.viewer.entities
                .getById(id)
                .position.getValue(Cesium.JulianDate.now())
            );
          } else {
            // 将另外一半点隐藏
            this.viewer.entities.getById(id).show = false;
          }
        } else {
          if (i % 2 != 0) {
            positions.push(
              this.viewer.entities
                .getById(id)
                .position.getValue(Cesium.JulianDate.now())
            );
          } else {
            this.viewer.entities.getById(id).show = false;
          }
        }
      }
      selectedEntity.id.rectangle.coordinates = new Cesium.CallbackProperty(
        () => {
          let obj = Cesium.Rectangle.fromCartesianArray(positions);
          return obj;
        },
        false
      );
    }
  }
  /**
   * 添加拉伸点
   * @param {entity}
   */
  addStrecthPoint(entity) {
    let points = [];
    if (this.entityType === "polygon") {
      points = entity.hierarchy.getValue().positions;
    } else if (this.entityType === "rectangle") {
      const rectangle = entity.coordinates.getValue();
      Cesium.Rectangle.subsample(
        rectangle,
        Cesium.Ellipsoid.WGS84,
        rectangle.height,
        points
      );
    }
    for (let position of points) {
      let point = this.viewer.entities.add({
        name: "stretch_point",
        position: position,
        point: {
          color: Cesium.Color.RED,
          pixelSize: 17,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 1,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: 15000,
        },
      });
      this.strecthPointIds.push(point.id);
    }
  }
  /**
   * 清除拉伸点
   */
  removeStretchPoint() {
    for (let id of this.strecthPointIds) {
      this.viewer.entities.removeById(id);
    }
    this.strecthPointIds = [];
    this.strecthObj = null;
    this.isStrecth = false;
  }
  /**
   * 获取多边形图形中心点
   */
  getEntityCenter() {
    let previousCoordinates =
      this.selectedEntity.id.polygon.hierarchy.getValue().positions;
    let coors = this.getWGS84FromDKR(previousCoordinates);
    coors.push(coors[0]);
    let poly = turf.polygon([coors]);
    let centroid = turf.centroid(poly);

    return centroid.geometry.coordinates;
  }
  /**
   * 将笛卡尔坐标转换成国际坐标
   * @param {coors}
   * @returns
   */
  getWGS84FromDKR(coors) {
    let newCoors = [];
    for (let i = 0; i < coors.length; i++) {
      const coor = coors[i];
      let cartographic = Cesium.Cartographic.fromCartesian(coor);
      let x = Cesium.Math.toDegrees(cartographic.longitude);
      let y = Cesium.Math.toDegrees(cartographic.latitude);
      newCoors.push([x, y]);
    }

    return newCoors;
  }
  stop() {
    if (this.handler) {
      this.handler.destroy();
      this.handler = null;
    }
    this.removeStretchPoint();
    this.viewer.scene.screenSpaceCameraController.enableRotate = true;
  }
}

export default CesiumEntityEdit;
