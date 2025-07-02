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

// 用户充值记录 VO
export interface UserRechargeRecordVO {
  userId: string // 用户ID
  nickname: string // 用户昵称
  rechargeTime: string // 充值时间
  amount: number // 充值金额
  ip: string // 操作IP地址
  payStatus: number // 支付状态
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

// 用户充值记录 API
export const UserRechargeRecordApi = {
  // 查询用户充值记录分页
  getUserRechargeRecordPage: async (params: any) => {
    return await request.get({ url: '/temu/operation-log/bill/user-recharge', params })
  },
  // 导出用户充值记录 Excel
  exportUserRechargeRecord: async (params: any) => {
    return await request.download({ url: '/temu/operation-log/bill/user-recharge/export-excel', params })
  }
}

// 订单下单记录 VO
export interface OrderPlacementRecordVO {
  id: number // 记录ID
  orderNo: string // 订单编号
  shopId: number // 店铺ID
  shopName: string // 店铺名称
  productTitle: string // 商品标题
  productProperties: string // 商品属性
  categoryName: string // 类目名称
  originalQuantity: number // 官网数量
  quantity: number // 制作数量
  unitPrice: number // 单价
  totalPrice: number // 总价
  sku: string // SKU编号
  skc: string // SKC编号
  customSku: string // 定制SKU
  operationTime: string // 操作时间
  isReturnOrder: number // 是否返单
  operator: string // 操作人
}

// 订单下单记录 API
export const OrderPlacementRecordApi = {
  // 查询订单下单记录分页
  getOrderPlacementRecordPage: async (params: any) => {
    return await request.get({ url: '/temu/operation-log/bill/order-placement', params })
  },
  // 获取订单下单记录总金额统计
  getOrderPlacementRecordAmountStatistics: async (params: any) => {
    return await request.get({ url: '/temu/operation-log/bill/order-placement/amount-statistics', params })
  },
  // 导出订单下单记录 Excel
  exportOrderPlacementRecord: async (params: any) => {
    return await request.download({ url: '/temu/operation-log/bill/order-placement/export-excel', params })
  }
}