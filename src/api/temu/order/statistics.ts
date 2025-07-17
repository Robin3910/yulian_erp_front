import request from '@/config/axios'

export const TemuOrderApi = {
  /**
   * 获取订单统计数据
   * @param params { shopIds: number[], startDate: string, endDate: string, granularity: string }
   */
  getOrderStatistics: async (params: {
    shopIds: number[];
    startDate: string;
    endDate: string;
    granularity: string;
  }) => {
    return await request.post({ url: '/api/order/statistics', data: params })
  }
} 