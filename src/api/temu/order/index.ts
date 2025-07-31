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
  shopName: string // 店铺名称
  customImageUrls: string // 定制图片列表URL
  customTextList: string // 定制文字列表
  productImgUrl: string // 商品图片URL
  categoryId: string // 类目ID
  categoryName: string // 类目名称
  shippingInfo: string // 物流信息JSON字符串
  originalInfo: string // 接口接收的源信息
  totalPrice: number // 订单总价
  unitPrice: number // 单价
  remark: string // 备注
  goodsSn: string // 商品条码url
  complianceUrl: string // 合规单url
  complianceGoodsMergedUrl: string // 合并文件url
  effectiveImgUrl: string // 合成预览图url
  originalQuantity: number // temu官网原始数量
  isFoundAll: number // 是否备齐
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
    return await request.get({ url: `/temu/order/admin-statistics`, params })
  },
  //   订单金额统计
  getOrderAmountStatistics: async (params) => {
    return await request.get({ url: `/temu/order/statistics`, params })
  },
  // 更新订单发货状态
  updateOrderShipping: async (data: { orderId: number; orderStatus: number }) => {
    return await request.put({ url: `/temu/order-shipping/update`, data })
  },
  // 批量更新订单发货状态
  batchUpdateOrderStatus: async (data: {
    orderIds: number[]
    orderStatus: number
    trackingNumber: string
  }) => {
    return await request.put({ url: '/temu/order-shipping/batch-update-status', data })
  },
  // 分页查询用户店铺待发货订单
  getShippingOrderPageByUser: async (params: any) => {
    return await request.get({ url: `/temu/order-shipping/user-page`, params })
  },
  //根据订单ID获取合规单信息和商品码
  getOrderExtraInfo: async (orderId: number) => {
    return await request.get({ url: `/temu/order/get-order-extra-info/${orderId}` })
  },
  //   修改备注
  updateOrderRemark: async (data: { orderId: number; remark: string }) => {
    return await request.put({ url: `/temu/order/update-order-remark`, data })
  },
  // 更新订单定制图片
  updateOrderCustomImages: async (data: { orderId: number; customImageUrls: string }) => {
    return await request.put({ url: `/temu/order/update-custom-images`, data })
  },
  //批量修改订单状态
  batchupdateOrderStatus: async (data: any) => {
    return await request.post({ url: `/temu/order/update-order-status`, data })
  },
  // 获取加急未发货订单总数
  getUrgentUnshippedCount: async () => {
    return await request.get({ url: `/temu/order-shipping/count` })
  },
  getOrderSkuPage: async (params: any) => {
    return await request.get({ url: `/temu/order/order-sku-page`, params })
  },
  // 切换订单是否备齐状态
  toggleOrderIsFoundAll: async (row: any, isFoundAll: number) => {
    // 后端期望接收Long类型的orderId，需要确保传递的是数字格式
    const numericId = Number(row.id);
    if (isNaN(numericId)) {
      throw new Error('订单ID必须是数字');
    }
    try {
      await request.post({ url: `/temu/order/toggle-is-found-all?orderId=${numericId}&isFoundAll=${isFoundAll}` })
      // 更新当前行数据
      row.isFoundAll = isFoundAll;
    } catch (error) {
      console.error('Failed to toggle isFoundAll:', error);
      // 可以根据需要显示错误消息给用户
    }
  },
  // 批量分配打包人
  batchInsert: async (data: { sortingSequenceList: string[], senderId: number, conditionFlag: boolean }) => {
    return await request.post({ url: `/temu/order/batch-insert`, data })
  },
  // 获取最近批次列表
  getRecentBatches: async () => {
    return await request.get({ url: `/temu/order-shipping/recent-batches` })
  },
  // 查询返单分页
  getOrderReturnPage: async (params: any) => {
    return await request.get({ url: '/temu/order-return/page', params })
  },
  // 更新返单原因
  updateOrderReturnReason: async (data: { id: number; repeatReason: number }) => {
    return await request.put({ url: '/temu/order-return/update-reason', data })
  }
}
