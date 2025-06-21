import request from '@/config/axios'

// 操作日志 VO
export interface OperationLogVO {
  userId: string // 用户 ID
  userName: string // 用户名
  operationTime: Date // 操作时间
  module: string // 操作模块 
  operationType: string // 操作类型
  requestParams: string // 请求参数
  responseResult: string // 响应结果
  ipAddress: string // 操作 IP 地址
  className: string // 类名
  methodName: string // 方法名
}

// 操作日志 API
export const OperationLogApi = {
  // 查询操作日志分页
  getOperationLogPage: async (params: any) => {
    return await request.get({ url: `/temu/operation-log/page`, params })
  },

  // 查询操作日志详情
  getOperationLog: async (id: number) => {
    return await request.get({ url: `/temu/operation-log/get?id=` + id })
  },

  // 新增操作日志
  createOperationLog: async (data: OperationLogVO) => {
    return await request.post({ url: `/temu/operation-log/create`, data })
  },

  // 修改操作日志
  updateOperationLog: async (data: OperationLogVO) => {
    return await request.put({ url: `/temu/operation-log/update`, data })
  },

  // 删除操作日志
  deleteOperationLog: async (id: number) => {
    return await request.delete({ url: `/temu/operation-log/delete?id=` + id })
  },

  // 导出操作日志 Excel
  exportOperationLog: async (params) => {
    return await request.download({ url: `/temu/operation-log/export-excel`, params })
  },
}