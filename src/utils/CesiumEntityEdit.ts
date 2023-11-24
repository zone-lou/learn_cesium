/**
 * cesium 实体编辑：拖拽、旋转、修改
 */
import * as turf from '@turf/turf';
import Cesium from 'cesium';

class CesiumEntityEdit {
    private viewer: any;
    private options: any;
    private selectedEntity: any; // 被选择的实体对象
    private handler: any; // 事件捕获
    private mouseStatus: any; // 当前鼠标状态 LEFT_DOWN：左键按下;LEFT_UP: 左键抬起；MOVE: 鼠标移动
    private coordinates: any; // 当前被选中的实体组成的点集合
    private entityType: any; // 当前被选中实体的类型
    private entityCenter: any; // 多边形中心点
    private strecthPointIds: any; // 拉伸点Id集合
    private strecthObj: any; // 被选中的拉伸点
    private isStrecth: any; // 当前是否点击拉伸点
    private strecthObjId_index: any;
    constructor(viewer: any, options: {} | null) {
        this.viewer = viewer;
        this.options = options || {};
        this.selectedEntity = null; // 被选择的实体对象
        this.handler = null; // 事件捕获
        this.mouseStatus = null; // 当前鼠标状态 LEFT_DOWN：左键按下;LEFT_UP: 左键抬起；MOVE: 鼠标移动
        this.coordinates = []; // 当前被选中的实体组成的点集合
        this.entityType = 'polygon'; // 当前被选中实体的类型
        this.entityCenter = []; // 多边形中心点
        this.strecthPointIds = []; // 拉伸点Id集合
        this.strecthObj = null; // 被选中的拉伸点
        this.isStrecth = false; // 当前是否点击拉伸点
    }
    start() {
        this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        // 监听鼠标左键按下事件
        this.handler.setInputAction(
            (e: any) => this.handleLeftDown(e),
            Cesium.ScreenSpaceEventType.LEFT_DOWN
        );
        // 监听鼠标左键抬起事件
        this.handler.setInputAction(
            (e: any) => this.handleLeftUp(e),
            Cesium.ScreenSpaceEventType.LEFT_UP
        );
        // 监听鼠标移动事件
        this.handler.setInputAction(
            (e: any) => this.handleMouseMove(e),
            Cesium.ScreenSpaceEventType.MOUSE_MOVE
        );
    }
    handleLeftDown(e: { position: any }) {
        // 更新鼠标状态
        this.mouseStatus = 'LEFT_DOWN';
        // 获取当前点击位置的实体对象
        const obj = this.viewer.scene.pick(e.position);
        if (!obj) {
            this.strecthObj = null;
            this.selectedEntity = null;
            this.viewer.scene.screenSpaceCameraController.enableRotate = true;
            this.removeStretchPoint();
            return;
        }
        if (obj && obj.id.name === 'stretch_point') {
            const index = this.strecthPointIds.findIndex((p: any) => p === obj.id.id);
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
            this.entityType = 'polygon';
            this.coordinates = this.selectedEntity.id.polygon.hierarchy.getValue().positions;
            this.entityCenter = this.getEntityCenter();
            this.addStrecthPoint(this.selectedEntity.id.polygon);
        }
        if (obj.id.rectangle) {
            this.entityType = 'rectangle';
            this.coordinates = this.selectedEntity.id.rectangle.coordinates.getValue();
            this.addStrecthPoint(this.selectedEntity.id.rectangle);
        }
        if (obj.id.point) {
            this.entityType = 'point';
        }
        if (obj.id.polyline) {
            this.entityType = 'polyline';

            this.coordinates = this.selectedEntity.id.polyline.positions.getValue();
            // this.entityCenter = this.getEntityCenter()
            this.addStrecthPoint(this.selectedEntity.id.polyline);
        }
    }
    handleLeftUp(e: any) {
        // 更新鼠标状态
        this.mouseStatus = 'LEFT_UP';
    }
    handleMouseMove(e: any) {
        if (this.mouseStatus === 'LEFT_DOWN' && this.selectedEntity) {
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
     * @param {*} e
     */
    handleDrag(
        e: { startPosition: any; endPosition: any },
        selectedEntity: {
            id: {
                position: Cesium.CallbackProperty;
                polygon: { hierarchy: Cesium.CallbackProperty };
                rectangle: { coordinates: Cesium.CallbackProperty };
                polyline: { positions: Cesium.CallbackProperty };
            };
        }
    ) {
        if (!selectedEntity) return;
        const coordinates = this.coordinates;
        // 获取开始位置坐标
        const startPosition = this.viewer.scene.camera.pickEllipsoid(
            e.startPosition,
            this.viewer.scene.globe.ellipsoid
        );
        // 获取结束位置坐标
        const endPosition = this.viewer.scene.camera.pickEllipsoid(
            e.endPosition,
            this.viewer.scene.globe.ellipsoid
        );
        selectedEntity.id.position = new Cesium.CallbackProperty(function () {
            return endPosition;
        }, false);
        const changed_x = endPosition.x - startPosition.x;
        const changed_y = endPosition.y - startPosition.y;
        const changed_z = endPosition.z - startPosition.z;
        if (this.entityType === 'point') {
            const ray = this.viewer.camera.getPickRay(e.endPosition);
            const cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
            selectedEntity.id.position = new Cesium.CallbackProperty(() => {
                return cartesian;
            }, false);
        }
        if (this.entityType === 'polygon' || this.entityType === 'polyline') {
            const currentsPoint: any = [];
            for (let i = 0; i < coordinates.length; i++) {
                coordinates[i].x = coordinates[i].x + changed_x;
                coordinates[i].y = coordinates[i].y + changed_y;
                coordinates[i].z = coordinates[i].z + changed_z;
                currentsPoint.push(coordinates[i]);
            }
            if (this.entityType === 'polygon') {
                selectedEntity.id.polygon.hierarchy = new Cesium.CallbackProperty(() => {
                    return { positions: currentsPoint };
                }, false); // 防止闪烁
            } else {
                selectedEntity.id.polyline.positions = new Cesium.CallbackProperty(() => {
                    return currentsPoint;
                }, false); // 防止闪烁
            }
        }
        if (this.entityType === 'rectangle') {
            const position_start = startPosition;
            const cartographic_start = Cesium.Cartographic.fromCartesian(position_start);
            const longitude_start = Cesium.Math.toDegrees(cartographic_start.longitude);
            const latitude_start = Cesium.Math.toDegrees(cartographic_start.latitude);

            const position_end = endPosition;
            const cartographic_end = Cesium.Cartographic.fromCartesian(position_end);
            const longitude_end = Cesium.Math.toDegrees(cartographic_end.longitude);
            const latitude_end = Cesium.Math.toDegrees(cartographic_end.latitude);

            const changer_lng = longitude_end - longitude_start;
            const changer_lat = latitude_end - latitude_start;
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
            selectedEntity.id.rectangle.coordinates = new Cesium.CallbackProperty(() => {
                return coordinates;
            }, false);
        }
    }
    /**
     * 旋转实体
     * @param {*} angle
     */
    handleRotation(angle: number) {
        if (!this.selectedEntity) return;
        // 旋转时清除辅助拉伸的点
        if (this.strecthPointIds.length) {
            this.removeStretchPoint();
        }
        if (this.entityType === 'rectangle') {
            // 旋转图形
            this.selectedEntity.id.rectangle.rotation = new Cesium.CallbackProperty(function () {
                return angle;
            }, false);
            // 旋转图形材质
            this.selectedEntity.id.rectangle.stRotation = new Cesium.CallbackProperty(function () {
                return angle;
            }, false);
        }
        if (this.entityType === 'polygon') {
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
            this.selectedEntity.id.polygon.stRotation = new Cesium.CallbackProperty(function () {
                return Cesium.Math.toRadians(angle);
            }, false);
            // this.selectedEntity.id.polygon.hierarchy = new Cesium.CallbackProperty(function () {
            //  return { positions: Cesium.Cartesian3.fromDegreesArray(positions) }
            // }, false)
        }
    }
    /**
     * 拉伸实体
     */
    handleStretch(selectedEntity: {
        id: {
            polygon: { hierarchy: Cesium.CallbackProperty };
            rectangle: { coordinates: Cesium.CallbackProperty };
            polyline: { positions: Cesium.CallbackProperty };
        };
    }) {
        const positions: any = [];
        // 更新polygon的位置数组
        if (selectedEntity.id.polygon) {
            for (let i = 0; i < this.strecthPointIds.length; i++) {
                const id = this.strecthPointIds[i];
                positions.push(this.viewer.entities.getById(id).position.getValue(Cesium.JulianDate.now()));
            }
            selectedEntity.id.polygon.hierarchy = new Cesium.CallbackProperty(() => {
                return new Cesium.PolygonHierarchy(positions);
            }, false);
        }
        // 更新polyline的位置数组
        if (selectedEntity.id.polyline) {
            for (let i = 0; i < this.strecthPointIds.length; i++) {
                const id = this.strecthPointIds[i];
                positions.push(this.viewer.entities.getById(id).position.getValue(Cesium.JulianDate.now()));
            }
            selectedEntity.id.polyline.positions = new Cesium.CallbackProperty(() => {
                return positions;
            }, false);
        }
        // 更新rectangle的位置数组
        if (selectedEntity.id.rectangle) {
            const index = this.strecthPointIds.findIndex((item: any) => item === this.strecthObj.id.id);
            for (let i = 0; i < this.strecthPointIds.length; i++) {
                const id = this.strecthPointIds[i];
                // 矩形由两个对角的点组成的区域，因此先判断用户点击的是哪一个点，即奇偶判断
                if (index % 2 === 0) {
                    if (i % 2 === 0) {
                        positions.push(this.viewer.entities.getById(id).position.getValue(Cesium.JulianDate.now()));
                    } else {
                        // 将另外一半点隐藏
                        this.viewer.entities.getById(id).show = false;
                    }
                } else {
                    if (i % 2 != 0) {
                        positions.push(this.viewer.entities.getById(id).position.getValue(Cesium.JulianDate.now()));
                    } else {
                        this.viewer.entities.getById(id).show = false;
                    }
                }
            }
            selectedEntity.id.rectangle.coordinates = new Cesium.CallbackProperty(() => {
                const obj = Cesium.Rectangle.fromCartesianArray(positions);
                return obj;
            }, false);
        }
    }
    /**
     * 添加拉伸点
     * @param {*} entity
     */
    addStrecthPoint(entity: {
        hierarchy: { getValue: () => { (): any; new (): any; positions: never[] } };
        coordinates: { getValue: () => any };
        positions: { getValue: () => any };
    }) {
        let points = [];
        if (this.entityType === 'polygon') {
            points = entity.hierarchy.getValue().positions;
        } else if (this.entityType === 'rectangle') {
            const rectangle = entity.coordinates.getValue();
            Cesium.Rectangle.subsample(rectangle, Cesium.Ellipsoid.WGS84, rectangle.height, points);
        } else if (this.entityType === 'polyline') {
            points = entity.positions.getValue();
        }
        // const id = new Date().getTime();
        for (const position of points) {
            const point = this.viewer.entities.add({
                name: 'stretch_point',
                position: position,
                // id:new Date().getTime()
                point: {
                    color: Cesium.Color.WHITE,
                    pixelSize: 10,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 1
                }
            });
            this.strecthPointIds.push(point.id);
        }
    }
    /**
     * 清除拉伸点
     */
    removeStretchPoint() {
        for (const id of this.strecthPointIds) {
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
        const previousCoordinates = this.selectedEntity.id.polygon.hierarchy.getValue().positions;
        const coors = this.getWGS84FromDKR(previousCoordinates);
        coors.push(coors[0]);
        const poly = turf.polygon([coors]);
        const centroid = turf.centroid(poly);

        return centroid.geometry.coordinates;
    }
    /**
     * 将笛卡尔坐标转换成国际坐标
     * @param {*} coors
     * @returns
     */
    getWGS84FromDKR(coors: string | any[]) {
        const newCoors: any = [];
        for (let i = 0; i < coors.length; i++) {
            const coor = coors[i];
            const cartographic = Cesium.Cartographic.fromCartesian(coor);
            const x = Cesium.Math.toDegrees(cartographic.longitude);
            const y = Cesium.Math.toDegrees(cartographic.latitude);
            newCoors.push([x, y]);
        }

        return newCoors;
    }
    stop() {
        this.handler && this.handler.destroy();
        this.removeStretchPoint();
        this.viewer.scene.screenSpaceCameraController.enableRotate = true;
    }
}

export default CesiumEntityEdit;

