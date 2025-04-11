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

// 商品品类 API
export const ProductCategoryApi = {
  // 查询商品品类分页
  getProductCategoryPage: async (params: any) => {
    return await request.get({ url: `/temu/product-category/page`, params })
  },

  // 查询商品品类详情
  getProductCategory: async (id: number) => {
    return await request.get({ url: `/temu/product-category/get?id=` + id })
  },

  // 新增商品品类
  createProductCategory: async (data: ProductCategoryVO) => {
    return await request.post({ url: `/temu/product-category/create`, data })
  },

  // 修改商品品类
  updateProductCategory: async (data: ProductCategoryVO) => {
    return await request.put({ url: `/temu/product-category/update`, data })
  },

  // 删除商品品类
  deleteProductCategory: async (id: number) => {
    return await request.delete({ url: `/temu/product-category/delete?id=` + id })
  }
}
