import Cesium from 'cesium';
import CesiumEntityEdit from "./CesiumEntityEdit";
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
        // this.entityEdit.start();
    }
    /*******
     * @function: function
     * @return {*}
     * @description: 绘制点数据
     */
    drawPoint(){
        //终止之前的绘图操作
        this.stopDraw();
        // 设置鼠标样式为crosshair
        document.body.style.cursor = 'crosshair';
        // 创建一个事件处理器
        this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        // 注册鼠标左键点击事件，用于绘制点
        this.handler.setInputAction((event: any)=>{
            // 获取鼠标点击的笛卡尔坐标(鼠标点击位置->笛卡尔坐标)
            let cartesian=this.getCatesian3FromPX(event.position);
            //实体的唯一标注
            const id = new Date().getTime();
            //确保有效坐标
            if(cartesian){
                //添加实体
                this.viewer.entities.add({
                    position:cartesian,
                    id: id,
                    point:{
                        color:Cesium.Color.RED,
                        pixelSize:10
                    }
                });
                //获取地理坐标(经纬度)
                let cartographic=Cesium.Cartographic.fromCartesian(cartesian);
                let lon=Cesium.Math.toDegrees(cartographic.longitude);
                let lat=Cesium.Math.toDegrees(cartographic.latitude);
                let height=Cesium.Math.toDegrees(cartographic.height);
                //将绘制点添加到数组中
                this.infoDetail.point.push({ id: id, lon:lon,lat:lat,height:height});
            }
        },Cesium.ScreenSpaceEventType.LEFT_CLICK);
        //绘制鼠标右键点击事件，用于结束绘制
        this.handler.setInputAction((event:any)=>{
            //销毁事件处理器
            this.stopDraw();
            // 添加操作完成后恢复鼠标样式为默认箭头
            document.body.style.cursor = 'default';
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
    }
    drawRectangle(){
        // 设置鼠标样式为crosshair
        document.body.style.cursor = 'crosshair';
        let allPoints :any=[];
        let topLeftPoint :any = null;
        let bottomRightPoint :any = null;
        //实体的唯一标注
        const id = new Date().getTime();
        let drawingRectangle = this.viewer.entities.add({
            id: id,
            name: "画矩形",
            rectangle: {
                coordinates: new Cesium.CallbackProperty(() => {
                    if (topLeftPoint === null || bottomRightPoint === null) {
                        return;
                    }
                    let west = topLeftPoint.longitude;
                    let north = topLeftPoint.latitude;
                    let east = bottomRightPoint.longitude;
                    let south = bottomRightPoint.latitude;
                    return new Cesium.Rectangle(west, south, east, north);
                }, false),
                material: Cesium.Color.BLUE.withAlpha(0.2),
                closeTop: true,
                closeBottom: false
            }
        });
        this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);

        this.handler.setInputAction((event:any) => {
            let cartesian = this.getCatesian3FromPX(event.position);
            if (cartesian) {
                if (topLeftPoint === null) {
                    topLeftPoint = Cesium.Cartographic.fromCartesian(cartesian);
                }

                this.viewer.entities.add({
                    position: cartesian,
                    point: {
                        color: Cesium.Color.RED,
                        pixelSize: 10
                    }
                });
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        this.handler.setInputAction((event:any) => {
            if (topLeftPoint) {
                bottomRightPoint = Cesium.Cartographic.fromCartesian(this.getCatesian3FromPX(event.endPosition));
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        this.handler.setInputAction(() => {
            if (topLeftPoint !== null && bottomRightPoint !== null) {
                // 关闭鼠标事件监听，结束绘制
                //销毁事件处理器
                this.stopDraw();
                let west = Cesium.Math.toDegrees(topLeftPoint.longitude);
                let north = Cesium.Math.toDegrees(topLeftPoint.latitude);
                let east = Cesium.Math.toDegrees(bottomRightPoint.longitude);
                let south = Cesium.Math.toDegrees(bottomRightPoint.latitude);

                allPoints.push({ lng: west, lat: north });
                allPoints.push({ lng: east, lat: north });
                allPoints.push({ lng: east, lat: south });
                allPoints.push({ lng: west, lat: south });
                allPoints.push(allPoints[0]); // 闭合
                this.infoDetail.rectangle.push({ id: id, allPoints:allPoints });
                // 添加操作完成后恢复鼠标样式为默认箭头
                document.body.style.cursor = 'default';
            }
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    }
    drawCircle(){
        this.stopDraw();
        // 设置鼠标样式为crosshair
        document.body.style.cursor = 'crosshair';
        /**实体的唯一标注 */
        let id: any = null;
        let centerPoint :any = null;
        let centerPointEntity = null;  // 用于存储中点实体的引用
        let radius = 10;
        this.viewer.scene.globe.depthTestAgainstTerrain = false;
        let drawingCircle = this.viewer.entities.add({
            id: id,
            name: "画圆",
            ellipse: {
                semiMinorAxis: new Cesium.CallbackProperty(() => {
                    return radius;
                }, false),
                semiMajorAxis: new Cesium.CallbackProperty(() => {
                    return radius;
                }, false),
                material: Cesium.Color.BLUE.withAlpha(0.2),
                outline: true,
                outlineColor: Cesium.Color.RED,
                outlineWidth:2,
                fill: true,  //为true时只显示轮廓线
            }
        });
        this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        this.handler.setInputAction((event:any) => {
            var cartesian = this.getCatesian3FromPX(event.position);
            if (cartesian && centerPoint === null) {
                centerPoint = cartesian;
                drawingCircle.position = centerPoint;
                // 添加中点实体并保存其引用
                centerPointEntity = this.viewer.entities.add({
                    position: cartesian,
                    point: {
                        color: Cesium.Color.RED,
                        pixelSize: 10
                    }
                });
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        this.handler.setInputAction((event:any) => {
            if (centerPoint) {
                let cartesian = this.getCatesian3FromPX(event.endPosition);
                if (cartesian) {
                    let distance = Cesium.Cartesian3.distance(centerPoint, cartesian);
                    radius = distance;
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        this.handler.setInputAction(() => {
            if (centerPoint !== null && radius > 0) {
                // 关闭鼠标事件监听，结束绘制
                let circleCenter = Cesium.Cartographic.fromCartesian(centerPoint);
                let lng = Cesium.Math.toDegrees(circleCenter.longitude);
                let lat = Cesium.Math.toDegrees(circleCenter.latitude);
                this.infoDetail.circle.push({ id: id, center: { lng: lng, lat: lat }, radius: radius });
            }
            //销毁事件处理器
            this.stopDraw();
            // 添加操作完成后恢复鼠标样式为默认箭头
            document.body.style.cursor = 'default';
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    }
    /**
     * 绘制多边形
     * @param {Object}  option
     * @param {Boolean} option.ground 是否贴地
     */
    drawPolygon(option:any){
        // 1.设置鼠标样式为crosshair
        document.body.style.cursor = 'crosshair';
        // 拖拽点实体数组
        var pointEntities :any= [];
        let allPoints :any=[];
        //2.创建一个用于存储多边形顶点的数组
        let polygonPoints :any = [];
        const id = new Date().getTime();
        // 3. 创建一个用于显示当前绘制中的多边形的实体
        let drawingPolygon = this.viewer.entities.add({
            id: id,
            name: "画多边形",
            polygon: {
                hierarchy: new Cesium.CallbackProperty(() => {
                    return new Cesium.PolygonHierarchy(polygonPoints);
                }, false),
                material: Cesium.Color.BLUE.withAlpha(0.2),
                perPositionHeight: (option&&option.ground)||false // true:不贴地/false:贴地
            },
        });
        // 4. 创建一个用于显示当前绘制中的线的实体
        let drawingLine = this.viewer.entities.add({
            id: "drawingLine"+id,
            name: "画线",
            polyline: {
                positions: new Cesium.CallbackProperty(() => {
                    return polygonPoints;
                }, false),
                width: 3,
                material: Cesium.Color.GREEN
            }
        });
        // 5. 监听鼠标点击事件，将点击的点添加到顶点数组中，并添加点实体
        this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
        this.handler.setInputAction((event :any) => {
            var cartesian = this.getCatesian3FromPX(event.position);
            if (cartesian) {
                // 将点坐标添加到数组中
                polygonPoints.push(cartesian.clone());
                // 在第一次点击时，添加一个克隆的点到数组中，用于动态更新
                if (polygonPoints.length === 1) {
                    polygonPoints.push(cartesian.clone());
                }
                // 添加点实体
                let  pointEntity=this.viewer.entities.add({
                    id:id+"point"+polygonPoints.length,
                    position: cartesian,
                    point: {
                        color: Cesium.Color.RED,
                        pixelSize: 10
                    }
                });
                pointEntities.push(pointEntity)
                //将三维笛卡尔坐标系点转为经纬度坐标点，并保存到点数组中
                let cartesian3 = cartesian.clone()
                // 使用Cesium.Cartographic.fromCartesian将Cartesian3对象转换为Cartographic对象
                let cartographic = Cesium.Cartographic.fromCartesian(cartesian3);
                allPoints.push([Cesium.Math.toDegrees(cartographic.longitude), Cesium.Math.toDegrees(cartographic.latitude), cartographic.height]);

            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        // 6. 监听鼠标移动事件，动态更新多边形和线的形状
        this.handler.setInputAction((event:any) => {
            let cartesian = this.getCatesian3FromPX(event.endPosition);
            if (polygonPoints.length >= 2) {
                if (cartesian && cartesian.x) {
                    polygonPoints.pop();
                    polygonPoints.push(cartesian);
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        // 7. 监听鼠标右键点击事件，结束绘制
        this.handler.setInputAction(() => {
            let cartesian=polygonPoints[polygonPoints.length-1]
            this.stopDraw();
            // // 移除因单击事件产生的最后一个点
            // if (polygonPoints.length > 1) {
            //     // 去除数组中最后一个点
            //     polygonPoints.pop();
            //     // 返回值
            //     allPoints.pop();
            //     allPoints.push(allPoints[0]); // 闭合
            //     var endPoint = this.viewer.entities.getById(
            //         id+"point"+(polygonPoints.length + 1)
            //     );
            //     if (endPoint) {
            //         this.viewer.entities.remove(endPoint);
            //     }
            //     var startPoint = this.viewer.entities.getById(id+"point1");
            //     if (startPoint) {
            //         this.viewer.entities.remove(startPoint);
            //     }
            // }
            // 添加操作完成后恢复鼠标样式为默认箭头
            document.body.style.cursor = 'default';
            this.infoDetail.planeSelf.push({ id: id, positions: polygonPoints });
            // 移除用于绘制的动态线实体
            this.viewer.entities.remove(drawingLine);
           // 关闭鼠标事件监听，结束绘制
            // 以下为拖拽点改变多边形形状代码
            let selectedPointEntity :any = null;
            let selectedIndex = -1;
            var dragHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
            //鼠标按下
            dragHandler.setInputAction((event:any) => {
                const pickedObject = this.viewer.scene.pick(event.position);
                if (
                    Cesium.defined(pickedObject) &&
                    pointEntities.includes(pickedObject.id)
                ) {
                    selectedPointEntity = pickedObject.id;
                    selectedIndex = pointEntities.indexOf(selectedPointEntity);

                    // 禁用摄像机控制
                    this.viewer.scene.screenSpaceCameraController.enableRotate = false;
                    this.viewer.scene.screenSpaceCameraController.enableTranslate = false;
                    this.viewer.scene.screenSpaceCameraController.enableZoom = false;
                    this.viewer.scene.screenSpaceCameraController.enableTilt = false;
                    this.viewer.scene.screenSpaceCameraController.enableLook = false;
                }
            }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
            // 当鼠标移动时
            dragHandler.setInputAction((event:any) => {
                if (selectedPointEntity) {
                    const cartesian = this.getCatesian3FromPX(event.endPosition);
                    if (cartesian && selectedIndex !== -1) {
                        selectedPointEntity.position = cartesian;
                        polygonPoints[selectedIndex] = cartesian;
                        // 如果当前拖动的是第一个点或是最后一个点
                        if (
                            selectedIndex === 0 ||
                            selectedIndex === polygonPoints.length
                        ) {
                            polygonPoints[polygonPoints.length ] = cartesian;
                            pointEntities[polygonPoints.length ].position.setValue(
                                cartesian
                            );
                        }
                    }
                }
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

            // 当鼠标左键抬起时
            dragHandler.setInputAction(() => {
                selectedPointEntity = null;
                selectedIndex = -1;

                // 启用摄像机控制
                this.viewer.scene.screenSpaceCameraController.enableRotate = true;
                this.viewer.scene.screenSpaceCameraController.enableTranslate = true;
                this.viewer.scene.screenSpaceCameraController.enableZoom = true;
                this.viewer.scene.screenSpaceCameraController.enableTilt = true;
                this.viewer.scene.screenSpaceCameraController.enableLook = true;
            }, Cesium.ScreenSpaceEventType.LEFT_UP);


        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

    }
    /*******
     * @function: function
     * @return {*}
     * @description: 绘制线段
     */
    drawLine(){
        this.stopDraw();
        // 设置鼠标样式为crosshair
        document.body.style.cursor = 'crosshair';
        let polylinePoints :any = [];
        /**实体的唯一标注 */
        const id = new Date().getTime();
        //零时折线实体
        let polylineEntity=this.viewer.entities.add({
            id:id,
            polyline:{
                //使用CallbackProperty允许我们在用户点击时动态更新线段的位置
                positions: new Cesium.CallbackProperty(() => {
                    return polylinePoints;
                }, false),
                width: 2,
                material: Cesium.Color.RED
            }
        });
        let lastPoint :any = null;
        let currentMousePoint :any = null;
        // 临时动态线实体
        let dynamicLineEntity = this.viewer.entities.add({
            polyline: {
                positions: new Cesium.CallbackProperty(() => {
                    if (lastPoint && currentMousePoint) {
                        return [lastPoint, currentMousePoint];
                    } else {
                        return [];
                    }
                }, false),
                width: 2,
                material: Cesium.Color.RED.withAlpha(0.5) // 使用半透明红色，与主线区分
            }
        });
        // 创建事件处理器
        let handler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
        // 注册鼠标左键点击事件，用于添加点和显示点
        handler.setInputAction((event:any) => {
            let cartesian = this.getCatesian3FromPX(event.position);
            if (cartesian) {
                polylinePoints.push(cartesian);
                lastPoint = cartesian;
                this.viewer.entities.add({
                    position: cartesian,
                    point: {
                        color: Cesium.Color.BLUE,
                        pixelSize: 10
                    }
                });
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        // 鼠标移动事件，更新当前鼠标位置并重绘临时线
        handler.setInputAction((event:any) => {
            currentMousePoint = this.getCatesian3FromPX(event.endPosition);
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        // 注册鼠标左键双击点击事件，用于结束绘制
        handler.setInputAction(() => {
            this.infoDetail.line.push({ id: id, positions: polylinePoints });
            // 移除临时线
            this.viewer.entities.remove(dynamicLineEntity);
            // 添加操作完成后恢复鼠标样式为默认箭头
            document.body.style.cursor = 'default';
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

    }
    stopDraw() {
        this.handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
        this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
        this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    }
    /**
     * 拾取位置点
     * （屏幕坐标转笛卡尔坐标）
     * @param {Object} px 屏幕坐标
     * @return {Object} Cartesian3 三维坐标
     */
    getCatesian3FromPX(px: any){
        if (this.viewer && px) {
            var picks = this.viewer.scene.drillPick(px);
            var cartesian = null;
            var isOn3dtiles = false,
                isOnTerrain = false;
            // drillPick
            for (let i in picks) {
                let pick = picks[i];

                if (
                    (pick && pick.primitive instanceof Cesium.Cesium3DTileFeature) ||
                    (pick && pick.primitive instanceof Cesium.Cesium3DTileset) ||
                    (pick && pick.primitive instanceof Cesium.Model)
                ) {
                    //模型上拾取
                    isOn3dtiles = true;
                }
                // 3dtilset
                if (isOn3dtiles) {
                    this.viewer.scene.pick(px); // pick
                    cartesian = this.viewer.scene.pickPosition(px);
                    if (cartesian) {
                        let cartographic = Cesium.Cartographic.fromCartesian(cartesian);
                        if (cartographic.height < 0) cartographic.height = 0;
                        let lon = Cesium.Math.toDegrees(cartographic.longitude),
                            lat = Cesium.Math.toDegrees(cartographic.latitude),
                            height = cartographic.height;
                        cartesian = this.transformWGS84ToCartesian({
                            lng: lon,
                            lat: lat,
                            alt: height
                        });
                    }
                }
            }
            // 地形
            let boolTerrain =
                this.viewer.terrainProvider instanceof Cesium.EllipsoidTerrainProvider;
            // Terrain
            if (!isOn3dtiles && !boolTerrain) {
                var ray = this.viewer.scene.camera.getPickRay(px);
                if (!ray) return null;
                cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
                isOnTerrain = true;
            }
            // 地球
            if (!isOn3dtiles && !isOnTerrain && boolTerrain) {
                cartesian = this.viewer.scene.camera.pickEllipsoid(
                    px,
                    this.viewer.scene.globe.ellipsoid
                );
            }
            if (cartesian) {
                let position = this.transformCartesianToWGS84(cartesian);
                if (position.alt < 0) {
                    cartesian = this.transformWGS84ToCartesian(position, 0.1);
                }
                return cartesian;
            }
            return false;
        }
    }
    /***
     * 坐标转换 84转笛卡尔
     * @param {Object} {lng,lat,alt} 地理坐标
     * @return {Object} Cartesian3 三维位置坐标
     */
    transformWGS84ToCartesian(position:any, alt:any){
        if (this.viewer) {
            return position
                ? Cesium.Cartesian3.fromDegrees(
                    position.lng || position.lon,
                    position.lat,
                    (position.alt = alt || position.alt),
                    Cesium.Ellipsoid.WGS84
                )
                : Cesium.Cartesian3.ZERO;
        }
    }
    /***
     * 坐标转换 笛卡尔转84
     * @param {Object} Cartesian3 三维位置坐标
     * @return {Object} {lng,lat,alt} 地理坐标
     */
    transformCartesianToWGS84(cartesian:any){
        if (this.viewer && cartesian) {
            var ellipsoid = Cesium.Ellipsoid.WGS84;
            var cartographic = ellipsoid.cartesianToCartographic(cartesian);
            return {
                lng: Cesium.Math.toDegrees(cartographic.longitude),
                lat: Cesium.Math.toDegrees(cartographic.latitude),
                alt: cartographic.height
            };
        }
    }

}
export default CesiumEntityDraw;
