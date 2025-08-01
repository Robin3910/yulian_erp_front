import request from '@/config/axios'

// 订单返工记录 VO - 对应后端TemuOrderReworkRespVO
export interface TemuOrderReworkVO {
  id: number // 主键ID
  customSku: string // 定制SKU
  reworkReason: string // 返工原因
  reworkInitiatorName?: string // 返工发起人姓名
  reworkDrawUserName?: string // 返工作图人姓名
  isFinished?: boolean // 是否完成
  createTime?: Date // 创建时间
  updateTime?: Date // 更新时间
  // 关联订单信息
  orderNo?: string // 订单号
  productTitle?: string // 产品标题
  productProperties?: string // 产品属性
  sku?: string // SKU
  skc?: string // SKC
  productImgUrl?: string // 产品图片
  customImageUrls?: string // 定制图片URLs
  customTextList?: string // 定制文字列表
}

// 分页响应数据结构
export interface PageResult<T> {
  list: T[]
  total: number
}

// 创建订单返工记录请求 VO
export interface TemuOrderReworkCreateReqVO {
  orderNo: string // 订单号
  customSku: string // 定制SKU
  reworkReason: string // 返工原因
}

// 发起返工
export const initiateRework = async (data: { customSku: string; orderNo: string; reworkInitiatorName: string; reworkDrawUserName: string }) => {
  return await request.post({ url: '/temu/rework/start', data })
}
// 完成返工
export const finishRework = async (data: { customSku: string }) => {
  return await request.post({ url: '/temu/rework/finish', data })
}

// 订单返工记录 API
export const TemuOrderReworkApi = {
  // 创建订单返工记录
  createRework: async (data: TemuOrderReworkCreateReqVO) => {
    return await request.post({ url: `/temu/rework/create-from-shipping`, data })
  },

  // 从发货管理页面创建订单返工记录
  createFromShipping: async (data: TemuOrderReworkCreateReqVO) => {
    return await request.post({ url: `/temu/rework/create-from-shipping`, data })
  },

  // 查询订单返工记录分页 - 确保返回包含rework_initiator_name、rework_draw_user_name、is_finished等字段
  getReworkPage: async (params: any) => {
    return await request.get({ url: `/temu/rework/page`, params })
  },

  // 查询订单返工记录详情
  getRework: async (id: number) => {
    return await request.get({ url: `/temu/rework/get?id=` + id })
  },

  // 删除订单返工记录
  deleteRework: async (id: number) => {
    return await request.delete({ url: `/temu/rework/delete?id=` + id })
  },

  // 导出订单返工记录 Excel
  exportRework: async (params) => {
    return await request.download({ url: `/temu/rework/export-excel`, params })
  },
  initiateRework,
  finishRework
} 
