import request from '@/config/axios'

// 工作人员任务记录 VO
export interface WorkerTaskVO {
  id: number // 主键ID
  workerId: number // 工作人员ID，关联system_users表id
  workerName: string // 工作人员姓名，关联system_users表nickname
  workerType: boolean // 工作人员类型 1:作图员 2:生产员 3:发货员
  taskType: boolean // 任务类型 1:作图 2:生产 3:发货
  taskStatus: boolean // 任务状态 0:待处理 1:已完成 2:已取消
  orderId: number // 关联订单ID，对应temu_order表id
  orderNo: string // 订单编号，对应temu_order表order_no
  batchOrderId: number // 批次订单ID，对应temu_order_batch_task表batch_order_id
  customSku: string // 定制SKU，对应temu_order表custom_sku
  skuQuantity: number // 处理SKU数量，对应temu_order表quantity
  taskCompleteTime: Date // 任务完成时间
}

// 工作人员任务记录 API
export const WorkerTaskApi = {
  // 查询工作人员任务记录分页
  getWorkerTaskPage: async (params: any) => {
    return await request.get({ url: `/temu/worker-task/page`, params })
  },

  // 查询工作人员任务记录详情
  getWorkerTask: async (id: number) => {
    return await request.get({ url: `/temu/worker-task/get?id=` + id })
  },

  // 新增工作人员任务记录
  createWorkerTask: async (data: WorkerTaskVO) => {
    return await request.post({ url: `/temu/worker-task/create`, data })
  },

  // 修改工作人员任务记录
  updateWorkerTask: async (data: WorkerTaskVO) => {
    return await request.put({ url: `/temu/worker-task/update`, data })
  },

  // 删除工作人员任务记录
  deleteWorkerTask: async (id: number) => {
    return await request.delete({ url: `/temu/worker-task/delete?id=` + id })
  },

  // 导出工作人员任务记录 Excel
  exportWorkerTask: async (params) => {
    return await request.download({ url: `/temu/worker-task/export-excel`, params })
  },
}