import request from '@/config/axios'

// 订单 VO
export interface OrderVO {
  id: number // 订单ID
  orderNo: string // 订单编号
  productTitle: string // 商品标题
  orderStatus: number // 订单状态
  sku: string // SKU编号
  skc: string // SKC编号
  salePrice: number // 申报价格
  customSku: string // 定制SKU
  quantity: number // 数量
  productProperties: string // 商品属性
  bookingTime: Date // 预定单创建时间
  shopId: number // 店铺ID
  customImageUrls: string // 定制图片列表URL
  customTextList: string // 定制文字列表
  productImgUrl: string // 商品图片URL
  categoryId: string // 类目ID
  categoryName: string // 类目名称
  shippingInfo: string // 物流信息JSON字符串
  originalInfo: string // 接口接收的源信息
  totalPrice: number // 订单总价
  unitPrice: number // 单价

}

// 订单 API
export const OrderApi = {
  // 查询订单分页
  getOrderPage: async (params: any) => {
    return await request.get({ url: `/temu/order/page`, params })
  },
  // 查询订单分页
  getOrderPageByAdmin: async (params: any) => {
    return await request.get({ url: `/temu/order/admin-page`, params })
  },
  // 查询待发货订单分页
  getShippingOrderPage: async (params: any) => {
    return await request.get({ url: `/temu/order-shipping/page`, params })
  },
  //批量修改订单状态
  updateOrderStatus: async (data: any) => {
    return await request.post({ url: `/temu/order/beatch_update_status`, data })
  },
  //修改订单分类
  updateOrderCategory: async (data: any) => {
    return await request.post({ url: `/temu/order/update-category`, data })
  },
  //批量下单
  batchCreateOrder: async (data: any) => {
    return await request.post({ url: `/temu/order/batch-save-order`, data })
  },
  //   订单金额统计
  getAdminOrderAmountStatistics: async (params) => {
    return await request.get({ url: `/temu/order/admin-statistics`, params } )
  },
  //   订单金额统计
  getOrderAmountStatistics: async (params) => {
    return await request.get({ url: `/temu/order/statistics`, params } )
  },
  // 更新订单发货状态
  updateOrderShipping: async (data: { orderId: number; orderStatus: number }) => {
    return await request.put({ url: `/temu/order-shipping/update`, data })
  },
  // 批量更新订单发货状态
  batchUpdateOrderStatus: async (data: { orderIds: number[]; orderStatus: number }) => {
    return await request.put({ url: '/temu/order-shipping/batch-update-status', data })
  },
  // 分页查询用户店铺待发货订单
  getShippingOrderPageByUser: async (params: any) => {
    return await request.get({ url: `/temu/order-shipping/user-page`, params })
  },
}
