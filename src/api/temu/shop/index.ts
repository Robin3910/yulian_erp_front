import request from '@/config/axios'

// 店铺 VO
export interface ShopVO {
  id: number // 主键ID
  shopId: number // 店铺ID
  shopName: string // 店铺名称
  webhook: string // 信息通知机器人webhook地址
  accessToken: string // 授权token
  oldTypes?: ShopOldTypeVO[] // 合规单信息
}

// 店铺合规单信息
export interface ShopOldTypeVO {
  shopId: number
  skc: string
  oldTypeUrl: string | null
  oldTypeImageUrl?: string | null
  oldType: string
}

// 店铺合规单批量删除参数
export interface ShopOldTypeDeleteDTO {
  shopId: number
  oldType: string
  skcList: string[]
}

// 店铺 API
export const ShopApi = {
  // 查询店铺分页
  getShopPage: async (params: any) => {
    return await request.get({ url: `/temu/shop/page`, params })
  },

  // 查询店铺详情
  getShop: async (id: number) => {
    return await request.get({ url: `/temu/shop/get?id=` + id })
  },

  // 新增店铺
  createShop: async (data: ShopVO) => {
    return await request.post({ url: `/temu/shop/create`, data })
  },

  // 修改店铺
  updateShop: async (data: ShopVO) => {
    return await request.put({ url: `/temu/shop/update`, data })
  },

  // 删除店铺
  deleteShop: async (id: number) => {
    return await request.delete({ url: `/temu/shop/delete?id=` + id })
  },

  // 导出店铺 Excel
  exportShop: async (params) => {
    return await request.download({ url: `/temu/shop/export-excel`, params })
  },

  // 查询店铺合规单信息
  getShopOldType: async (shopId: number) => {
    return await request.get({ url: `/temu/shop-oldType/query?shopId=${shopId}` })
  },

  // 新增店铺合规单SKC
  createShopOldType: async (data: ShopOldTypeVO[]) => {
    return await request.post({ url: `/temu/shop-oldType/save`, data })
  },

  // 删除店铺合规单SKC（批量）
  deleteShopOldType: async (data: ShopOldTypeDeleteDTO) => {
    return await request.post({ url: `/temu/shop-oldType/delete`, data })
  },

  // 更新店铺合规单SKC
  updateShopOldType: async (data: ShopOldTypeVO[]) => {
    return await request.post({ url: `/temu/shop-oldType/update`, data })
  }
}
