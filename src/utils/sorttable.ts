// 引入 sortable
import Sortable from 'sortablejs'

// 定义一个变量来存储Sortable实例。后续销毁时会用到
let sortableInstance: Sortable | null = null

/**
 * 拖拽函数
 * @param getList 获取列表数据
 * @param isSort  控制表单是否开启拖拽排序
 */
export const enableRowDrop = (getList: Function, isSort?: boolean) => {
    const tbody = document.querySelector('.el-table__body-wrapper tbody') as any

    // 销毁现有Sortable实例（如果存在）
    if (sortableInstance) {
        sortableInstance.destroy()
    }

    // 使用更新后的isSort值创建新的Sortable实例
    sortableInstance = new Sortable(tbody, {
        // 是否禁用拖拽排序
        disabled: !isSort,
        // ms, number 单位：ms，定义排序动画的时间
        animation: 150,
        // 设置拖拽样式类名
        dragClass: 'drop-dragClass',
        // 设置拖拽停靠样式类名
        ghostClass: 'drop-ghostClass',
        // 设置选中样式类名
        chosenClass: 'drop-chosenClass',

        onAdd(evt: any) {
            // 拖拽时候添加有新的节点的时候发生该事件
            console.log('onAdd.foo:', [evt.item, evt.from])
        },
        onUpdate(evt: any) {
            // 拖拽更新节点位置发生该事件
            console.log('onUpdate.foo:', [evt.item, evt.from])
        },
        onRemove(evt: any) {
            // 删除拖拽节点的时候促发该事件
            console.log('onRemove.foo:', [evt.item, evt.from])
        },
        onStart(evt: any) {
            // 开始拖拽出发该函数
            console.log('onStart.foo:', [evt.item, evt.from])
        },
        onSort(evt: any) {
            // 发生排序发生该事件
            console.log('onUpdate.foo:', [evt.item, evt.from])
        },

        // 关键代码
        onEnd(evt: any) {
            // 结束拖拽
            console.log('结束表格拖拽', `拖动前索引${evt.oldIndex}---拖动后索引${evt.newIndex}`)
            getList(evt)
        }
    })
}
