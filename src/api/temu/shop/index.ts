import request from '@/config/axios'

// 店铺 VO
export interface ShopVO {
  id: number // 主键ID
  shopId: number // 店铺ID
  shopName: string // 店铺名称
  webhook: string // 信息通知机器人webhook地址
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
}
