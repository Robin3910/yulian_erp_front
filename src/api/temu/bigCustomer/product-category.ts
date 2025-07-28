import request from '@/config/axios'

// 商品品类 VO
export interface ProductCategoryVO {
  id: number // 主键ID
  categoryId: number // 商品品类ID
  categoryName: string // 商品名称
  length: number // 长度(cm)
  width: number // 宽度(cm)
  height: number // 高度(cm)
  weight: number // 重量(g)
  mainImageUrl: string // 主图URL
}

export interface rulePrice {
  max: number | undefined
  price: number | undefined
}

export type RulePriceByNumber = {
  defaultPrice: number | undefined
  unitPrice: rulePrice[]
}
export type RulePriceByLayout = {
  singlePrice: number | undefined
  singleLayoutCount: number | undefined
  defaultPrice: number | undefined
  unitPrice: rulePrice[]
}

// 商品品类 API
export const ProductCategoryApi = {
  // 查询商品品类分页
  getProductCategoryPage: async (params: any) => {
    return await request.get({ url: `/temu/product-category-vip/page`, params })
  },

  // 查询商品品类详情
  getProductCategory: async (id: number) => {
    return await request.get({ url: `/temu/product-category-vip/get?id=` + id })
  },

  // 新增商品品类
  createProductCategory: async (data: ProductCategoryVO) => {
    return await request.post({ url: `/temu/product-category-vip/create`, data })
  },

  // 修改商品品类
  updateProductCategory: async (data: ProductCategoryVO) => {
    return await request.put({ url: `/temu/product-category-vip/update`, data })
  },

  // 删除商品品类
  deleteProductCategory: async (id: number) => {
    return await request.delete({ url: `/temu/product-category-vip/delete?id=` + id })
  }
}
