import request from '@/config/axios'

export const TemuOrderApi = {
  /**
   * 获取订单统计数据
   * @param params { shopIds: number[], startDate: string, endDate: string, granularity: string, categoryIds?: number[] }
   */
  getOrderStatistics: async (params: {
    shopIds: number[];
    startDate: string;
    endDate: string;
    granularity: string;
    categoryIds?: number[];
  }) => {
    return await request.post({ url: '/api/order/statistics', data: params })
  },

  /**
   * 获取返单统计数据
   * @param params { shopIds: number[], startDate: string, endDate: string, granularity: string, categoryIds?: number[] }
   */
  getReturnOrderStatistics: async (params: {
    shopIds: number[];
    startDate: string;
    endDate: string;
    granularity: string;
    categoryIds?: number[];
  }) => {
    return await request.post({ url: '/api/order/statistics/return', data: params })
  },

  /**
   * 获取所有可选的类目列表
   */
  getCategoryList: async () => {
    return await request.get({ url: '/api/order/statistics/categories' })
  }
} 
