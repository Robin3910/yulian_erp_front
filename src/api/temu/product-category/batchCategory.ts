import request from '@/config/axios'

// 批量删除Temu订单批次类目
export function deleteBatchCategories(ids: number[]) {
  return request.delete({
    url: '/erp/temu-order-batch-category/delete',
    params: { ids: ids.join(',') }
  })
}

// 按批次ID查询Temu订单批次类目
export function getBatchCategoryList(batchCategoryId?: string) {
  return request.get({
    url: '/erp/temu-order-batch-category/list',
    params: batchCategoryId ? { batchCategoryId } : {}
  })
}

// 按类目ID查询Temu订单批次类目
export function getBatchCategoryListByCategory(categoryId?: number) {
  return request.get({
    url: '/erp/temu-order-batch-category/list-by-category',
    params: categoryId ? { categoryId } : {}
  })
}

// 修改Temu订单批次类目的 batch_category_id
export function updateBatchCategoryId(batchCategoryId: string, categoryId: number) {
  return request.put({
    url: '/erp/temu-order-batch-category/update-batch-category-id',
    params: { batchCategoryId, categoryId }
  })
} 

// 分页查询Temu订单批次类目
export function getBatchCategoryPage(params: {
  categoryName?: string
  batchCategoryId?: string
  categoryId?: string | number
  pageNo?: number
  pageSize?: number
}) {
  return request.post({
    url: '/erp/temu-order-batch-category/page',
    data: params
  })
}
