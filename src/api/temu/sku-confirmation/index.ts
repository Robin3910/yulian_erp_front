import request from '@/config/axios'

/**
 * SKU确认相关API
 */
export const SkuConfirmationApi = {
  /**
   * 确认SKU
   * @param data 包含orderId的对象
   * @returns Promise
   */
  confirm: (data: { orderId: number | string }) => {
    return request.post({ url: '/temu/sku-confirmation/confirm', data })
  },

  /**
   * 取消确认SKU
   * @param id 确认记录ID
   * @returns Promise
   */
  cancel: (id: number | string) => {
    return request.delete({ url: `/temu/sku-confirmation/cancel/${id}` })
  },

  /**
   * 获取已确认的SKU列表
   * @param params 查询参数
   * @returns Promise
   */
  getList: (params: { shopId: string }) => {
    return request.get({ url: '/temu/sku-confirmation/list', params })
  },

  /**
   * 检查SKU是否已确认
   * @param params 查询参数
   * @returns Promise
   */
  checkConfirmation: (params: { shopId: string, sku: string }) => {
    return request.get({ url: '/temu/sku-confirmation/check', params })
  }
} 