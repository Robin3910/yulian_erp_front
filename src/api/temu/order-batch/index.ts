import request from '@/config/axios'
import { OrderVO } from '../order/index'
export interface OrderBatchVO {
  id: number // 主键
  batchNo: string // 批次编号
  fileUrl: string // 文件地址
  status: boolean // 0 已创建
  orderList?: OrderVO[] // 订单列表
  remark?: string // 备注
  isDispatchTask?: boolean // 是否已分配任务
  createTime?: Date // 创建时间
  [key: string]: any
}

// 订单 API
export const OrderBatchApi = {
  // 创建批次
  createOrderBatch: async (data: any) => {
    return await request.post({ url: '/temu/order-batch/create', data })
  },
  // 查询批次分页
  getOrderBatchPage: async (params: any) => {
    return await request.get({ url: `/temu/order-batch/page`, params })
  },
  // 查询任务批次分页
  getOrderBatchTaskPage: async (params: any) => {
    return await request.get({ url: `/temu/order-batch/task-page`, params })
  },
  //更新批次文件信息
  updateOrderBatchFile: async (data: any) => {
    return await request.put({ url: `/temu/order-batch/update-file`, data })
  },
  updateOrderBatchFileByTask: async (data: any) => {
    return await request.put({ url: `/temu/order-batch/update-file-by-task`, data })
  },
  //更新批次状态
  updateOrderBatchStatus: async (data: any) => {
    return await request.put({ url: `/temu/order-batch/update-status`, data })
  },
  updateOrderBatchStatusByTask: async (data: any) => {
    return await request.put({ url: `/temu/order-batch/update-status-by-task`, data })
  },
  //   修改备注
  updateOrderBatchRemark: async (data: { orderId: number; remark: string }) => {
    return await request.put({ url: `/temu/order-batch/update-order-remark`, data })
  },
  //派发任务
  dispatchTask: async (data: any) => {
    return await request.post({ url: `/temu/order-batch/dispatch-task`, data })
  },
// 完成单个订单任务
  completeOrderTask: async (data: any) => {
    return await request.post({ url: `/temu/order-batch/complete-batch-order-task`, data })
  },
// 完成单个订单任务[管理员版本]
  completeOrderTaskByAdmin: async (data: any) => {
    return await request.post({ url: `/temu/order-batch/complete-batch-order-task-by-admin`, data })
  },
}
