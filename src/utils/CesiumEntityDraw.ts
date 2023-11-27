import Cesium from 'cesium';
import CesiumEntityEdit from './CesiumEntityEdit';
class CesiumEntityDraw {
    private viewer: any;
    private config: any;
    private infoDetail: any;
    private handler: any;
    private entityEdit: any;
    constructor(
        viewer: Cesium.Viewer,
        config: { borderColor?: Cesium.Color; borderWidth?: number; material?: Cesium.Color }
    ) {
        /**cesium实例对象 */
        this.viewer = viewer;
        this.entityEdit = new CesiumEntityEdit(viewer, {});
        /**绘制要素的相关配置
         * 默认配置
         * {
          borderColor: Cesium.Color.BLUE,  边框颜色
          borderWidth: 2, 边框宽度
          material: Cesium.Color.GREEN.withAlpha(0.5),填充材质
      }
         */
        this.config = config || {
            borderColor: Cesium.Color.BLUE,
            borderWidth: 2
            // material: Cesium.Color.GREEN.withAlpha(0.5),
        };
        /**存贮绘制的数据 坐标 */
        this.infoDetail = {
            point: [],
            line: [],
            rectangle: [],
            circle: [],
            planeSelf: []
        };
        this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    }
    startDraw(type: string) {
        switch (type) {
            case 'point':
                this.drawPoint();
                break;
            case 'rectangle':
                this.drawRectangle();
                break;
            case 'circle':
                this.drawCircle();
                break;
            case 'polygon':
                this.drawPolygon();
                break;
            case 'line':
                this.drawLine();
                break;
            default:
                this.drawPoint();
                break;
        }
        this.entityEdit.start();
    }
    /*******
     * @function: function
     * @return {*}
     * @description: 绘制点数据
     */
    drawPoint() {
        this.stopDraw();
        // 设置鼠标样式为crosshair
        document.body.style.cursor = 'crosshair';
        this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        this.handler.setInputAction((click: { position: any }) => {
            /**点击位置笛卡尔坐标 */
            const cartesian = this.viewer.camera.pickEllipsoid(
                click.position,
                this.viewer.scene.globe.ellipsoid
            );
            /**笛卡尔转弧度坐标 */
            const cartographic = Cesium.Cartographic.fromCartesian(
                cartesian,
                this.viewer.scene.globe.ellipsoid,
                new Cesium.Cartographic()
            );
            /**点击位置经度 */
            const lng = Cesium.Math.toDegrees(cartographic.longitude);
            /**点击位置维度 */
            const lat = Cesium.Math.toDegrees(cartographic.latitude);
            /**实体的唯一标注 */
            const id = new Date().getTime();
            this.viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(lng, lat, 0),
                name: 'point',
                id: id,
                point: {
                    color: Cesium.Color.BLUE,
                    pixelSize: 13,
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 1
                }
            });
            this.infoDetail.point.push({ id: id, position: [lng, lat] });
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        this.handler.setInputAction((click: any) => {
            this.stopDraw();
            // 添加操作完成后恢复鼠标样式为默认箭头
            document.body.style.cursor = 'default';
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    }
    /*******
     * @function: function
     * @description: 绘制矩形区域
     */
    drawRectangle() {
        this.stopDraw();
        // 设置鼠标样式为crosshair
        document.body.style.cursor = 'crosshair';
        const positions: any = [];
        let rectangle :any = null;
        const canvas = this.viewer.scene.canvas;
        this.handler = new Cesium.ScreenSpaceEventHandler(canvas);
        this.handler.setInputAction((click: { position: any }) => {
            if (positions.length) return;
            const cartesian = this.getCatesian3FromPX(click.position);
            positions.push(cartesian, cartesian);
            rectangle = this.viewer.entities.add({
                name: 'rectangle',
                rectangle: {
                    coordinates: new Cesium.CallbackProperty(() => {
                        const obj = Cesium.Rectangle.fromCartesianArray(positions);
                        return obj;
                    }, false),
                    height: 0.1,
                    material: this.config.material,
                    zIndex: 100
                }
            });
            this.handler.setInputAction((move: { endPosition: any }) => {
                const cartesian = this.getCatesian3FromPX(move.endPosition);
                if (rectangle) {
                    positions[positions.length - 1] = cartesian;
                }
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        this.handler.setInputAction((click: any) => {
            this.stopDraw();
            // 添加操作完成后恢复鼠标样式为默认箭头
            document.body.style.cursor = 'default';
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    }
    /*******
     * @function: function
     * @description: 绘制矩形区域
     */
    drawRectangleByPolygon() {
        this.stopDraw();
        // 设置鼠标样式为crosshair
        document.body.style.cursor = 'crosshair';
        /**
         * 矩形四点坐标
         */
        let westSouthEastNorth: number[] = [];
        /**实体的唯一标注 */
        let id: any = null;
        /**地图点击对象 */
        this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        this.handler.setInputAction((click: { position: any }) => {
            this.viewer.scene.screenSpaceCameraController.enableRotate = false; //锁定相机
            /**点击位置笛卡尔坐标 */
            const cartesian = this.viewer.camera.pickEllipsoid(
                click.position,
                this.viewer.scene.globe.ellipsoid
            );
            /**笛卡尔转弧度坐标 */
            const cartographic = Cesium.Cartographic.fromCartesian(
                cartesian,
                this.viewer.scene.globe.ellipsoid,
                new Cesium.Cartographic()
            );
            /**点击位置经度 */
            const lng1 = Cesium.Math.toDegrees(cartographic.longitude);
            /**点击位置维度 */
            const lat1 = Cesium.Math.toDegrees(cartographic.latitude);
            /**边框坐标 */
            westSouthEastNorth = [lng1, lat1];
            id = new Date().getTime();
            if (westSouthEastNorth) {
                this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
            }
            /**面实例对象 */
            this.viewer.entities.add({
                name: 'rectangle',
                id: id,
                polygon: {
                    hierarchy: new Cesium.CallbackProperty(function () {
                        return {
                            positions: Cesium.Cartesian3.fromDegreesArray(westSouthEastNorth)
                        };
                    }, false),
                    height: 0,
                    // 填充的颜色，withAlpha透明度
                    material: this.config.material,
                    // 是否被提供的材质填充
                    fill: true,
                    // 是否显示
                    show: true
                }
                // polyline: {
                //   positions: new Cesium.CallbackProperty(function() {
                //     return Cesium.Cartesian3.fromDegreesArray(westSouthEastNorth);
                //   }),
                //   material: this.config.borderColor,
                //   width: this.config.borderWidth,
                //   zIndex: 1
                // }
            });
            this.handler.setInputAction((move: { endPosition: any }) => {
                const cartesian = this.viewer.camera.pickEllipsoid(
                    move.endPosition,
                    this.viewer.scene.globe.ellipsoid
                );
                const cartographic = Cesium.Cartographic.fromCartesian(
                    cartesian,
                    this.viewer.scene.globe.ellipsoid,
                    new Cesium.Cartographic()
                );
                const lng = Cesium.Math.toDegrees(cartographic.longitude);
                const lat = Cesium.Math.toDegrees(cartographic.latitude);

                westSouthEastNorth = [lng1, lat1, lng1, lat, lng, lat, lng, lat1, lng1, lat1];
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        this.handler.setInputAction(() => {
            this.stopDraw();
            // 添加操作完成后恢复鼠标样式为默认箭头
            document.body.style.cursor = 'default';
            this.infoDetail.rectangle.push({ id: id, position: westSouthEastNorth });
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    }
    /*******
     * @function: function
     * @description: 绘制圆形区域
     * @return {*}
     */
    drawCircle() {
        this.stopDraw();
        // 设置鼠标样式为crosshair
        document.body.style.cursor = 'crosshair';
        /**实体的唯一标注 */
        let id: any = null;

        /**圆半径 */
        let radius: number = 0;
        /**圆心 */
        let lngLat: any = [];
        /**鼠标事件 */
        this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        this.handler.setInputAction((click: { position: any }) => {
            id = new Date().getTime();
            const cartesian = this.viewer.camera.pickEllipsoid(
                click.position,
                this.viewer.scene.globe.ellipsoid
            );
            const cartographic = Cesium.Cartographic.fromCartesian(
                cartesian,
                this.viewer.scene.globe.ellipsoid,
                new Cesium.Cartographic()
            );
            const lng = Cesium.Math.toDegrees(cartographic.longitude);
            const lat = Cesium.Math.toDegrees(cartographic.latitude);
            lngLat = [lng, lat];
            const entity = this.viewer.entities.add({
                position: new Cesium.CallbackProperty(function () {
                    return Cesium.Cartesian3.fromDegrees(lng, lat);
                }, false),
                name: 'circle',
                id: id,
                ellipse: {
                    height: 0,
                    outline: true,
                    material: this.config.material,
                    outlineColor: this.config.borderColor,
                    outlineWidth: this.config.borderWidth
                }
            });
            entity.ellipse.semiMajorAxis = new Cesium.CallbackProperty(function () {
                return radius;
            }, false);
            entity.ellipse.semiMinorAxis = new Cesium.CallbackProperty(function () {
                return radius;
            }, false);

            if (lngLat) {
                this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
            }
            this.handler.setInputAction((move: { endPosition: any }) => {
                const cartesian2 = this.viewer.camera.pickEllipsoid(
                    move.endPosition,
                    this.viewer.scene.globe.ellipsoid
                );
                radius = Cesium.Cartesian3.distance(cartesian, cartesian2);
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        this.handler.setInputAction(() => {
            this.infoDetail.circle.push({ id: id, center: lngLat, radius: radius });
            this.stopDraw();
            // 添加操作完成后恢复鼠标样式为默认箭头
            document.body.style.cursor = 'default';
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    }
    /*******
     * @function: function
     * @description: 自定义区域绘制
     */
    drawPolygon() {
        this.stopDraw();
        // 设置鼠标样式为crosshair
        document.body.style.cursor = 'crosshair';
        /**实体的唯一标注 */
        const id = new Date().getTime();
        /**记录拐点坐标 */
        const positions: any = [];
        /**记录返回结果 */
        const codeInfo: any = [];
        /**面的hierarchy属性 */
        const polygon = new Cesium.PolygonHierarchy();
        const _polygonEntity: any = new Cesium.Entity();
        /**面对象配置 */
        let polyObj = null;
        this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        // left
        this.handler.setInputAction((movement: { position: any }) => {
            const cartesian = this.viewer.camera.pickEllipsoid(
                movement.position,
                this.viewer.scene.globe.ellipsoid
            );
            const cartographic = Cesium.Cartographic.fromCartesian(
                cartesian,
                this.viewer.scene.globe.ellipsoid,
                new Cesium.Cartographic()
            );
            const lng = Cesium.Math.toDegrees(cartographic.longitude);
            const lat = Cesium.Math.toDegrees(cartographic.latitude);

            if (cartesian && cartesian.x) {
                if (positions.length == 0) {
                    positions.push(cartesian.clone());
                }
                codeInfo.push([lng, lat]);
                positions.push(cartesian.clone());
                polygon.positions.push(cartesian.clone());
                if (!polyObj) {
                    // _polygonEntity.polyline = {
                    //   width: this.config.borderWidth,
                    //   material: this.config.borderColor,
                    //   clampToGround: false
                    // };
                    // _polygonEntity.polyline.positions = new Cesium.CallbackProperty(
                    //   function() {
                    //     return positions;
                    //   },
                    //   false
                    // );

                    _polygonEntity.polygon = {
                        hierarchy: new Cesium.CallbackProperty(function () {
                            return polygon;
                        }, false),
                        zIndex: 100,
                        height: 0.1,
                        material: Cesium.Color.BLUE.withAlpha(0.8),
                        clampToGround: false
                    };
                    _polygonEntity.name = 'polygon';

                    _polygonEntity._id = id;
                    polyObj = this.viewer.entities.add(_polygonEntity);
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        // mouse
        this.handler.setInputAction((movement: { endPosition: any }) => {
            const cartesian = this.viewer.camera.pickEllipsoid(
                movement.endPosition,
                this.viewer.scene.globe.ellipsoid
            );
            const cartographic = Cesium.Cartographic.fromCartesian(
                cartesian,
                this.viewer.scene.globe.ellipsoid,
                new Cesium.Cartographic()
            );
            const lng = Cesium.Math.toDegrees(cartographic.longitude);
            const lat = Cesium.Math.toDegrees(cartographic.latitude);

            if (positions.length >= 0) {
                if (cartesian && cartesian.x) {
                    positions.pop();
                    positions.push(cartesian);
                    polygon.positions.pop();
                    polygon.positions.push(cartesian);
                    codeInfo.pop();
                    codeInfo.push([lng, lat]);
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        // right
        this.handler.setInputAction((movement: any) => {
            this.stopDraw();
            // 添加操作完成后恢复鼠标样式为默认箭头
            document.body.style.cursor = 'default';
            this.infoDetail.planeSelf.push({ id: id, positions: codeInfo });
            positions.push(positions[0]);
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    }

    /*******
     * @function: function
     * @return {*}
     * @description: 绘制线段
     */
    drawLine() {
        this.stopDraw();
        // 设置鼠标样式为crosshair
        document.body.style.cursor = 'crosshair';
        /**实体的唯一标注 */
        const id = new Date().getTime();
        /**记录拐点坐标 */
        const positions: any = [],
            /**记录返回结果 */
            codeInfo: any = [],
            /**面的hierarchy属性 */
            polygon = new Cesium.PolygonHierarchy(),
            _polygonEntity: any = new Cesium.Entity();
        /**面对象配置 */
        let polyObj = null;
        this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        // left
        this.handler.setInputAction((movement: { position: any }) => {
            const cartesian = this.viewer.camera.pickEllipsoid(
                movement.position,
                this.viewer.scene.globe.ellipsoid
            );
            const cartographic = Cesium.Cartographic.fromCartesian(
                cartesian,
                this.viewer.scene.globe.ellipsoid,
                new Cesium.Cartographic()
            );
            const lng = Cesium.Math.toDegrees(cartographic.longitude);
            const lat = Cesium.Math.toDegrees(cartographic.latitude);

            if (cartesian && cartesian.x) {
                if (positions.length == 0) {
                    positions.push(cartesian.clone());
                }
                codeInfo.push([lng, lat]);
                positions.push(cartesian.clone());
                polygon.positions.push(cartesian.clone());
                if (!polyObj) {
                    _polygonEntity.polyline = {
                        width: 4,
                        material: Cesium.Color.BLUE.withAlpha(0.8),
                        clampToGround: true
                    };
                    _polygonEntity.polyline.positions = new Cesium.CallbackProperty(function () {
                        return positions;
                    }, false);
                    _polygonEntity.name = 'line';
                    _polygonEntity._id = id;

                    polyObj = this.viewer.entities.add(_polygonEntity);
                    // this.entityEdit = new CesiumEntityEdit(this.viewer, polyObj);
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        // mouse
        this.handler.setInputAction((movement: { endPosition: any }) => {
            const cartesian = this.viewer.camera.pickEllipsoid(
                movement.endPosition,
                this.viewer.scene.globe.ellipsoid
            );
            const cartographic = Cesium.Cartographic.fromCartesian(
                cartesian,
                this.viewer.scene.globe.ellipsoid,
                new Cesium.Cartographic()
            );
            const lng = Cesium.Math.toDegrees(cartographic.longitude);
            const lat = Cesium.Math.toDegrees(cartographic.latitude);

            if (positions.length >= 0) {
                if (cartesian && cartesian.x) {
                    positions.pop();
                    positions.push(cartesian);
                    codeInfo.pop();
                    codeInfo.push([lng, lat]);
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        // right
        this.handler.setInputAction((movement: any) => {
            this.infoDetail.line.push({ id: id, positions: codeInfo });
            this.stopDraw();
            // 添加操作完成后恢复鼠标样式为默认箭头
            document.body.style.cursor = 'default';
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    }
    /*******
     * @function: function
     * @description: 移除实体对象
     * @return {*}
     */
    removeEntity() {
        this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        this.handler.setInputAction((move: { endPosition: any }) => {
            /**实体对象信息  {id：entities，primitive：。。} */
            const pick = this.viewer.scene.pick(move.endPosition);
            this.entityEdit.removeStretchPoint();

            if (pick && pick.id && pick.id.id) {
                document.body.style.cursor = 'pointer';
                this.handler.setInputAction((click: any) => {
                    let newPoint: any;
                    switch (pick.id.name) {
                        case 'point':
                            /**删除某一条数据 */
                            newPoint = this.infoDetail.point.filter(
                                (item: { id: any }) => item.id != pick.id._id
                            );
                            this.infoDetail.point = newPoint;
                            break;
                        case 'line':
                            /**删除某一条数据 */
                            newPoint = this.infoDetail.line.filter((item: { id: any }) => item.id != pick.id._id);
                            this.infoDetail.line = newPoint;
                            break;
                        case 'rectangle':
                            /**删除某一条数据 */
                            newPoint = this.infoDetail.rectangle.filter(
                                (item: { id: any }) => item.id != pick.id._id
                            );
                            this.infoDetail.rectangle = newPoint;
                            break;

                        case 'planeSelf':
                            /**删除某一条数据 */
                            newPoint = this.infoDetail.planeSelf.filter(
                                (item: { id: any }) => item.id != pick.id._id
                            );
                            this.infoDetail.planeSelf = newPoint;
                            break;
                        case 'circle':
                            /**删除某一条数据 */
                            newPoint = this.infoDetail.circle.filter(
                                (item: { id: any }) => item.id != pick.id._id
                            );
                            this.infoDetail.circle = newPoint;
                            break;
                        default:
                            break;
                    }
                    this.viewer.entities.remove(pick.id);
                }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
            } else {
                document.body.style.cursor = 'default';
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    }
    /**
     *
     */
    removeAllEntity() {
        this.entityEdit.removeStretchPoint();
        Object.keys(this.infoDetail).map((name) => {
            this.infoDetail[name].map((item: { id: any }) => {
                this.viewer.entities.removeById(item.id);
            });
        });
    }
    /*******
     * @function: function
     * @return {*}
     * @description: 返回绘制数据
     */
    backInfoDetail() {
        return this.infoDetail;
    }
    stopDraw() {
        this.handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
        this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
        // this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
        // this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
        this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        // this.handler && this.handler.destroy();
        // this.entityEdit.stop();
    }
    stopEdit() {
        this.entityEdit.stop();
    }
    getMousePostion(position: any) {
        if (!position) return;
        /**点击位置笛卡尔坐标 */
        const cartesian = this.viewer.camera.pickEllipsoid(position, this.viewer.scene.globe.ellipsoid);
        /**笛卡尔转弧度坐标 */
        const cartographic = Cesium.Cartographic.fromCartesian(
            cartesian,
            this.viewer.scene.globe.ellipsoid,
            new Cesium.Cartographic()
        );
        /**点击位置经度 */
        const lng1 = Cesium.Math.toDegrees(cartographic.longitude);
        /**点击位置维度 */
        const lat1 = Cesium.Math.toDegrees(cartographic.latitude);
        return [lng1, lat1];
    }
    getCatesian3FromPX(px: any) {
        const ray = this.viewer.camera.getPickRay(px);
        if (!ray) return null;
        const cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
        return cartesian;
    }
}
export default CesiumEntityDraw;

