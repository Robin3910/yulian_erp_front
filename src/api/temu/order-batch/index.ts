import request from '@/config/axios'

export interface OrderBatchVO {
  id: number // 主键
  batchNo: string // 批次编号
  fileUrl: string // 文件地址
  status: boolean // 0 已创建
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
  //更新批次文件信息
  updateOrderBatchFile: async (data: any) => {
    return await request.put({ url: `/temu/order-batch/update-file`, data })
  },
  //更新批次状态
  updateOrderBatchStatus: async (data: any) => {
    return await request.put({ url: `/temu/order-batch/update-status`, data })
  },
  //   修改备注
  updateOrderBatchRemark: async (data: { orderId: number; remark: string }) => {
    return await request.put({ url: `/temu/order-batch/update-order-remark`, data })
  }
}
