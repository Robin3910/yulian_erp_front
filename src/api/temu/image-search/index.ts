import request from '@/config/axios'
import type { OrderResult } from '@/api/temu/order/types'

export interface ImageSearchResult {
  productId: string
  score: number
}

/**
 * 图片搜索
 * @param file 图片文件
 * @returns 搜索结果
 */
export function searchByImage(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post<ImageSearchResult[]>({ 
    url: '/temu/image-search/search', 
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 条码搜索
 * @param goodsSnNo 条码号
 * @returns 搜索结果
 */
export function searchByBarcode(goodsSnNo: string) {
  return request.post<OrderResult[]>({ 
    url: '/temu/image-search/search-barcode', 
    data: { goodsSnNo }
  })
}
