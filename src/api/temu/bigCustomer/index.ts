import request from '@/config/axios'

// 订单下单记录 VO
export interface OrderVipPlacementRecordVO {
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
export const OrderVipPlacementRecordApi = {
  // 查询订单下单记录分页
  getOrderVipPlacementRecordPage: async (params: any) => {
    return await request.get({ url: '/temu/operation-log/bill/order-VipPlacement', params })
  },
  // 获取订单下单记录总金额统计
  getOrderVipPlacementRecordAmountStatistics: async (params: any) => {
    return await request.get({ url: '/temu/operation-log/bill/order-VipPlacement/amount-statistics', params })
  },
  // 导出订单下单记录 Excel
  exportOrderVipPlacementRecord: async (params: any) => {
    return await request.download({ url: '/temu/operation-log/bill/order-VipPlacement/export-excel', params })
  }


}