import request from '@/config/axios'
//产品分类api
export const TemuCommonApi = {
  // 查询产品分类列表
  getProductCategoryList: async () => {
    return await request.get({ url: `/temu/common/category/list` })
  },
  // 获取无分页店铺列表
  getShopList: async () => {
    return await request.get({ url: `/temu/common/shop/list` })
  }
}
