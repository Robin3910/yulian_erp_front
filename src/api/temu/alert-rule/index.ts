import request from '@/config/axios'

// 告警规则 API 类型定义
export interface TemuAlertRuleBaseVO {
  name: string         // 规则名称
  description: string  // 规则描述
  sqlContent: string   // SQL查询内容
  threshold: number    // 阈值
  compareType: number  // 比较类型
  cronExpression: string // CRON表达式
  webhookUrl: string   // 企业微信webhook地址
  notifyTemplate: string // 通知模板
  status: number       // 状态(0: 禁用, 1: 启用)
}

export interface TemuAlertRuleCreateReqVO extends TemuAlertRuleBaseVO {
  // 创建请求VO，无需额外补充
}

export interface TemuAlertRuleUpdateReqVO extends TemuAlertRuleBaseVO {
  id: number           // 规则ID
}

export interface TemuAlertRuleRespVO extends TemuAlertRuleBaseVO {
  id: number           // 规则ID
  createTime: string   // 创建时间
  lastExecuteTime: string // 上次执行时间
}

export interface TemuAlertRulePageReqVO {
  pageNo: number       // 页码
  pageSize: number     // 每页条数
  name?: string        // 规则名称，模糊匹配
  status?: number      // 规则状态
  createTime?: string[] // 创建时间范围
}

// 告警规则 API
export const TemuAlertRuleApi = {
  // 创建告警规则
  createAlertRule: async (data: TemuAlertRuleCreateReqVO) => {
    return await request.post({ url: '/temu/alert-rule/create', data })
  },
  
  // 更新告警规则
  updateAlertRule: async (data: TemuAlertRuleUpdateReqVO) => {
    return await request.put({ url: '/temu/alert-rule/update', data })
  },
  
  // 删除告警规则
  deleteAlertRule: async (id: number) => {
    return await request.delete({ url: '/temu/alert-rule/delete', params: { id } })
  },
  
  // 获取告警规则详情
  getAlertRule: async (id: number) => {
    return await request.get({ url: '/temu/alert-rule/get', params: { id } })
  },
  
  // 获取告警规则分页
  getAlertRulePage: async (params: TemuAlertRulePageReqVO) => {
    return await request.get({ url: '/temu/alert-rule/page', params })
  },
  
  // 测试执行告警规则
  testAlertRule: async (id: number) => {
    return await request.post({ url: '/temu/alert-rule/test', params: { id } })
  }
} 