import request from '@/config/axios'

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
