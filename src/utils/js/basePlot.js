// 所有标绘类的父类
import util from "../util";
import Cesium from "cesium";
/**
 * 标绘基类
 * @description 标绘基类，一般不直接实例化，而实例化其子类（见下方Classes）
 * @class
 * @alias BasePlot
 */
class BasePlot {
    /**
     * @param {Cesium.Viewer} viewer 地图viewer对象
     * @param {Object} style 样式属性
     */
    constructor(viewer, style) {
        this.viewer = viewer;

        /**
         * @property {Object} style 样式
         */
        this.style = style || {};

        /**
         * @property {String | Number} objId 唯一id
         */
        this.objId = Number((new Date()).getTime() + "" + Number(Math.random() * 1000).toFixed(0));
        this.handler = undefined;
        this.modifyHandler = undefined;

        /**
         * @property {String} type 类型
         */
        this.type = '';
        /**
         *@property {Cesium.Cartesian3[]} positions 坐标数组
         */
        this.positions = [];

        /**
         *@property {int} modelHeight 高度
         */
        this.modelHeight = 0;

        /**
         *@property {int} distance 距离
         */
        this.distances=[];

        /**
         *@property {int} area 面积
         */
        this.area=0;

        /**
         *@property {Cesium.Cartesian3} centerPoint 圆心
         */
        this.centerPoint=null;

        /**
         *@property {String} state 标识当前状态 no startCreate creating endCreate startEdit endEdit editing
         */
        this.state = null;  //

        /**
         * @property {Object} prompt 鼠标提示框
         */
        this.prompt = null; // 初始化鼠标提示框
        this.controlPoints = []; // 控制点
        this.modifyPoint = null;

        /**
         * 图标entity对象
         * @property {Cesium.Entity} entity entity对象
        */

        this.entity = null;
        this.pointStyle = {};

        /**
         * @property {Object} promptStyle 鼠标提示框样式
         */
        this.promptStyle = this.style.prompt || {
            show: true
        }
        this.properties = {};

        // 缩放分辨率比例
        this.clientScale = 1;
    }

    /**
     *
     * @param {Object} px 像素坐标
     * @returns {Cesium.Cartesian3} 世界坐标
     */
    getCatesian3FromPX(px) {
        px = this.transpx(px); // 此处单独解决了地图采点的偏移  prompt的偏移暂未处理
        let picks = this.viewer.scene.drillPick(px);
        this.viewer.scene.render();
        let cartesian;
        let isOn3dtiles = false;
        for (let i = 0; i < picks.length; i++) {
            if ((picks[i] && picks[i].primitive) && picks[i].primitive instanceof Cesium.Cesium3DTileset) { //模型上拾取
                isOn3dtiles = true;
                break;
            }
        }
        if (isOn3dtiles) {
            cartesian = this.viewer.scene.pickPosition(px);
        } else {
            let ray = this.viewer.camera.getPickRay(px);
            if (!ray) return null;
            cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
        }
        return cartesian;
    }

    /**
     *  此方法用于 地图界面缩放问题（transform:translate(2)）
     * @param {Number} scale 缩放比例
     */
    setClientScale(scale) {
        scale = scale || 1;
        this.clientScale = scale;
    }

    transpx(px) {
        return {
            x: px.x / (this.clientScale || 1),
            y: px.y / (this.clientScale || 1)
        }
    }

    /**
     *
     * @returns {Cesium.Entity} 实体对象
     */
    getEntity() {
        return this.entity;
    }

    /**
     *
     * @param {Boolean} isWgs84 是否转化为经纬度
     * @returns {Array} 坐标数组
     */
    getPositions(isWgs84) {
        return isWgs84 ? util.cartesiansToLnglats(this.positions, this.viewer) : this.positions;
    }

    /**
    * 获取经纬度坐标
    * @returns {Array} 经纬度坐标数组
    */
    getLnglats() {
        return util.cartesiansToLnglats(this.positions, this.viewer);
    }

    /**
     * 设置自定义属性
     * @param {Object} prop 属性
     */
    setOwnProp(prop) {
        if (this.entity) this.entity.ownProp = prop;
    }

    /**
     * 移除当前entity对象
     */
    remove() {
        if (this.entity) {
            this.state = "no";
            this.viewer.entities.remove(this.entity);
            this.entity = null;
        }
    }

    /**
     * 设置entity对象的显示隐藏
     * @param {Boolean} visible
     */
    setVisible(visible) {
        if (this.entity) this.entity.show = visible;
    }

    // 操作控制
    forbidDrawWorld(isForbid) {
        this.viewer.scene.screenSpaceCameraController.enableRotate = !isForbid;
        this.viewer.scene.screenSpaceCameraController.enableTilt = !isForbid;
        this.viewer.scene.screenSpaceCameraController.enableTranslate = !isForbid;
        this.viewer.scene.screenSpaceCameraController.enableInputs = !isForbid;
    }

    /**
     * 销毁
     */
    destroy() {
        if (this.handler) {
            this.handler.destroy();
            this.handler = null;
        }
        if (this.modifyHandler) {
            this.modifyHandler.destroy();
            this.modifyHandler = null;
        }
        if (this.entity) {
            this.viewer.entities.remove(this.entity);
            this.entity = null;
        }
        this.positions = [];
        this.modelHeight=0;
        this.distances=[];
        this.area=0;
        this.controlPoints=null;
        this.style = null;
        for (var i = 0; i < this.controlPoints.length; i++) {
            var point = this.controlPoints[i];
            this.viewer.entities.remove(point);
        }
        this.controlPoints = [];
        this.modifyPoint = null;
        if (this.prompt) {
            this.prompt.destroy();
            this.prompt = null;
        }
        this.state = "no";
        this.forbidDrawWorld(false);
    }

    /**
     *
     * 开始编辑
     */
    startEdit(callback) {
        if (this.state == "startEdit" || this.state == "editing" || !this.entity) return;
        this.state = "startEdit";;
        if (!this.modifyHandler) this.modifyHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        let that = this;
        for (let i = 0; i < that.controlPoints.length; i++) {
            let point = that.controlPoints[i];
            if (point) point.show = true;
        }
        this.entity.show = true;
        this.modifyHandler.setInputAction(function (evt) {
            if (!that.entity) return;
            let pick = that.viewer.scene.pick(evt.position);
            if (Cesium.defined(pick) && pick.id) {
                if (!pick.id.objId)
                    that.modifyPoint = pick.id;
                that.forbidDrawWorld(true);
            }
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
        this.modifyHandler.setInputAction(function (evt) {
            if (that.positions.length < 1 || !that.modifyPoint) return;
            let cartesian = that.getCatesian3FromPX(evt.endPosition, that.viewer, [that.entity, that.modifyPoint]);
            // if(that.modelHeight){
            //     let lnglat = Cesium.Cartographic.fromCartesian(cartesian);
            //     let lat = Cesium.Math.toDegrees(lnglat.latitude);
            //     let lng = Cesium.Math.toDegrees(lnglat.longitude);
            //     let hei = lnglat.height;
            //     console.log(lat,lng,hei,'高度111')
            //     cartesian=  Cesium.Cartesian3.fromDegrees(lng,lat,hei)
            // }
            if (cartesian) {
                that.modifyPoint.position.setValue(cartesian);
                that.positions[that.modifyPoint.wz] = cartesian;
                if(that.positions.length>1&&that.type=='polyline'){
                    that.getSpaceDistance()
                }
                if(that.positions.length>=3&&that.type=='polygon'){
                    that.getCenterOfGravityPoint()
                    that.getArea();
                }
                that.state = "editing";
                if (callback) callback();
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        this.modifyHandler.setInputAction(function (evt) {
            if (!that.modifyPoint) return;
            that.modifyPoint = null;
            that.forbidDrawWorld(false);
            that.state = "editing";
        }, Cesium.ScreenSpaceEventType.LEFT_UP);
    }

    /**
     * 结束编辑
     * @param {Function} callback 回调函数
     * @example
     *  plotObj.endEdit(function(entity){})
     */
    endEdit(callback) {
        for (let i = 0; i < this.controlPoints.length; i++) {
            let point = this.controlPoints[i];
            if (point) point.show = false;
        }
        if (this.modifyHandler) {
            this.modifyHandler.destroy();
            this.modifyHandler = null;
            if (callback) callback(this.entity);
        }
        this.forbidDrawWorld(false);
        this.state = "endEdit";
    }

    /**
     * 结束创建
     */
    endCreate() {

    }

    /**
     * 在当前步骤结束
     */
    done() {

    }


    // 构建控制点
    createPoint(position) {
        if (!position) return;
        this.pointStyle.color = this.pointStyle.color || Cesium.Color.CORNFLOWERBLUE;
        this.pointStyle.outlineColor = this.pointStyle.color || Cesium.Color.CORNFLOWERBLUE;

        let color = this.pointStyle.color instanceof Cesium.Color ? this.pointStyle.color : Cesium.Color.fromCssColorString(this.pointStyle.color);
        color = color.withAlpha(this.pointStyle.colorAlpha || 1);

        let outlineColor = this.pointStyle.outlineColor instanceof Cesium.Color ? this.pointStyle.outlineColor : Cesium.Color.fromCssColorString(this.pointStyle.outlineColor);
        outlineColor = outlineColor.withAlpha(this.pointStyle.outlineColorAlpha || 1);

        return this.viewer.entities.add({
            position: position,
            point: {
                pixelSize: this.pointStyle.property || 10,
                color: color,
                outlineWidth: this.pointStyle.outlineWidth || 0,
                outlineColor: outlineColor,
                disableDepthTestDistance: Number.POSITIVE_INFINITY
            },
            show: false
        });
    }

    // 获取当前标绘的样式
    /*  getStyle() {
        if (!this.entity) return;
        let graphic = this.entity[this.plotType];
        if (!graphic) return;
        let style = {};
        switch (this.plotType) {
            case 'polyline':
                style.clampToGround = graphic.clampToGround._value; // 是否贴地
                style.distanceDisplayCondition = graphic.distanceDisplayCondition._value; // 显示控制
                style.width = graphic.width._value; // 线宽
                let colorObj = this.transfromLineMaterial(graphic.material);
                style = Object.assign(style, colorObj);
                break;
            case "polygon":
                style.heightReference = graphic.heightReference.getValue();
                style.fill = graphic.fill._value;
                style.extrudedHeight = graphic.extrudedHeight._value;
                let gonColorObj = this.transfromGonMaterial(graphic.material);
                style = Object.assign(style, gonColorObj);

                style.outline = graphic.outline._value;
                let ocv = graphic.outlineColor.getValue();
                style.outlineColorAlpha = ocv.alpha;
                style.outlineColor = new Cesium.Color(ocv.red, ocv.green, ocv.blue, 1).toCssHexString();

                break;
            default:
                break;
        }
        return style;
    } */

    // 获取线的材质
    transfromLineMaterial(material) {
        if (!material) return;
        let colorObj = {};
        if (material instanceof Cesium.Color) {
            let colorVal = material.color.getValue();
            colorObj.colorAlpha = colorVal.alpha;
            // 转为hex
            colorObj.colorHex = new Cesium.Color(colorVal.red, colorVal.green, colorVal.blue, 1).toCssHexString();
        }
        return colorObj;
    }

    // 获取面材质
    transfromGonMaterial(material) {
        if (!material) return;
        let colorObj = {};
        if (material instanceof Cesium.Color) {
            let colorVal = material.color.getValue();
            colorObj.colorAlpha = colorVal.alpha;
            // 转为hex
            colorObj.colorHex = new Cesium.Color(colorVal.red, colorVal.green, colorVal.blue, 1).toCssHexString();
        }
        return colorObj;
    }

    // 设置实体的属性
    setAttr(attr) {
        this.properties.attr = attr || {};
    }

    getAttr(){
        return this.properties.attr;
    }

    /**
     * 缩放至当前绘制的对象
    */
    zoomTo() {
        if (this.entity) {
            this.viewer.zoomTo(this.entity);
        }
    }

    /**
     * 空间两点距离计算函数
     */
    getSpaceDistance() {
        for (let i = 0; i < this.positions.length - 1; i++) {
            let point1cartographic = Cesium.Cartographic.fromCartesian(this.positions[i]);
            let point2cartographic = Cesium.Cartographic.fromCartesian(this.positions[i + 1]);
            /**根据经纬度计算出距离**/
            let geodesic = new Cesium.EllipsoidGeodesic();
            geodesic.setEndPoints(point1cartographic, point2cartographic);
            let s = geodesic.surfaceDistance;
            //返回两点之间的距离
            s = Math.sqrt(Math.pow(s, 2) + Math.pow(point2cartographic.height - point1cartographic.height, 2));
            this.distances[i]=s
        }
    }

    /**
     * 计算多边形面积
     */
    getArea(points) {
        let tempArea=0
        //拆分三角曲面
        for (let i = 0; i < this.positions.length - 2; i++) {
            let j = (i + 1) % this.positions.length;
            let k = (i + 2) % this.positions.length;
            let totalAngle = this.Angle(this.positions[i], this.positions[j], this.positions[k]);
            let dis_temp1 = this.distance(this.positions[j], this.positions[0]);
            let dis_temp2 = this.distance(this.positions[k], this.positions[0]);
            tempArea += dis_temp1 * dis_temp2 * Math.sin(totalAngle) / 2;
        }
        this.area=Math.abs(tempArea).toFixed(4)

    };

    /**
     * 计算方向
     */
    Bearing(from, to) {
        from = Cesium.Cartographic.fromCartesian(from);
        to = Cesium.Cartographic.fromCartesian(to);
        let lat1 = from.latitude;
        let lon1 = from.longitude;
        let lat2 = to.latitude;
        let lon2 = to.longitude;
        let angle = -Math.atan2(Math.sin(lon1 - lon2) * Math.cos(lat2), Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon1 - lon2));
        if (angle < 0) {
            angle += Math.PI * 2.0;
        }
        let degreesPerRadian = 180.0 / Math.PI; //弧度转化为角度
        angle = angle * degreesPerRadian; //角度
        return angle;
    }
    /**
     * 计算角度
     */
    Angle(p1, p2, p3) {
        let bearing21 = this.Bearing(p2, p1);
        let bearing23 = this.Bearing(p2, p3);
        let angle = bearing21 - bearing23;
        if (angle < 0) {
            angle += 360;
        }
        return angle;
    }
    /**
     * 计算2点距离
     */
    distance(point1, point2) {
        let point1cartographic = Cesium.Cartographic.fromCartesian(point1);
        let point2cartographic = Cesium.Cartographic.fromCartesian(point2);
        /**根据经纬度计算出距离**/
        let geodesic = new Cesium.EllipsoidGeodesic();
        geodesic.setEndPoints(point1cartographic, point2cartographic);
        let s = geodesic.surfaceDistance;
        s = Math.sqrt(Math.pow(s, 2) + Math.pow(point2cartographic.height - point1cartographic.height, 2));
        return s;
    }
    /**
     * 计算多边形的中心（简单的处理）
     * @param
     * @returns {*[]}
     */
    getCenterOfGravityPoint() {
        let center = this.positions[0];
        for (let i = 1; i < this.positions.length; i++) {
            center = Cesium.Cartesian3.midpoint(center, this.positions[i], new Cesium.Cartesian3());
        }
        this.centerPoint=center;
    }
}

export default BasePlot;
