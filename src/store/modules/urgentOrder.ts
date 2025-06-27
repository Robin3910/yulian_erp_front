import { defineStore } from 'pinia'
import { OrderApi } from '@/api/temu/order'

export const useUrgentOrderStore = defineStore('urgentOrder', {
  state: () => ({
    urgentOrderCount: 0
  }),
  actions: {
    async fetchUrgentOrderCount() {
      try {
        // 使用新的专门接口
        const response = await OrderApi.getUrgentUnshippedCount()
        console.log('加急订单接口响应:', response)
        
        // 尝试不同的数据解析方式
        let count = 0
        if (response?.data?.total !== undefined) {
          // 格式: {"code":0,"data":{"total":1},"msg":""}
          count = response.data.total
        } else if (response?.total !== undefined) {
          // 格式: {"total":1}
          count = response.total
        } else if (typeof response === 'number') {
          // 格式: 1 (直接返回数字)
          count = response
        } else if (response?.data !== undefined && typeof response.data === 'number') {
          // 格式: {"data":1}
          count = response.data
        }
        
        this.urgentOrderCount = count
        // console.log('设置加急订单数量:', this.urgentOrderCount)
      } catch (error) {
        // console.error('获取加急订单数量失败:', error)
        this.urgentOrderCount = 0
      }
    }
  }
}) 