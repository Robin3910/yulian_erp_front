<template>
  <div class="order-statistics-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>订单统计</h2>
    </div>
    <!-- 筛选条件 -->
    <div class="filter-section">
      <el-card>
        <el-form :model="filterForm" inline>
          <!-- 店铺 -->
          <el-form-item label="店铺">
            <el-select filterable v-model="filterForm.shopId" placeholder="请选择店铺" clearable multiple @change="handleShopChange">
              <el-option :key="'all'" :label="'全部店铺'" :value="'ALL'" />
              <el-option v-for="item in shopList" :key="item.shopId" :label="item.shopName" :value="item.shopId" />
            </el-select>
          </el-form-item>
          <!-- 时间范围 -->
          <el-form-item label="时间范围">
            <el-date-picker v-model="filterForm.dateRange" type="daterange" range-separator="至" start-placeholder="开始日期"
              end-placeholder="结束日期" />
          </el-form-item>
          <!-- 按钮 -->
          <el-form-item>
            <el-button type="primary" @click="handleSearch" :loading="loading">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
    <!-- 统计图表 -->
    <div class="chart-section">
      <el-card>
        <template #header>
          <div class="chart-header">
            <span>订单数量趋势</span>
            <el-radio-group v-model="chartType" size="small">
              <el-radio-button value="day">按天</el-radio-button>
              <el-radio-button value="week">按周</el-radio-button>
              <el-radio-button value="month">按月</el-radio-button>
            </el-radio-group>
          </div>
        </template>
        <div ref="chartRef" class="chart" style="width: 100%; height: 400px;"></div>
        <div v-if="summary && Object.keys(summary).length" class="summary-info" style="margin-top: 16px;">
          <el-descriptions title="汇总信息" :column="4" border>
            <el-descriptions-item label="总订单数">{{ summary.totalOrders }}</el-descriptions-item>
            <el-descriptions-item label="均订单数">{{ summary.averageDaily }}</el-descriptions-item>
            <el-descriptions-item label="最高">{{ summary.maxOrders }}</el-descriptions-item>
            <el-descriptions-item label="最低">{{ summary.minOrders }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch,nextTick } from 'vue'
import * as echarts from 'echarts'
import { TemuCommonApi } from '@/api/temu/common'
import { TemuOrderApi } from '@/api/temu/order/statistics'
import { ElMessage } from 'element-plus'

const filterForm = ref<{
  dateRange: string[]
  shopId: (string | number)[]
}>({
  dateRange: [],
  shopId: []
})

const chartType = ref('day')
const chartRef = ref()
let chartInstance: echarts.ECharts | null = null

// 店铺列表
const shopList = ref<any[]>([])

// 订单统计数据
const chartData = ref<{ timePoints: string[]; values: number[] }>({ timePoints: [], values: [] })
const summary = ref<any>({})
const loading = ref(false)

// 获取店铺列表
async function getShopList() {
  const data = await TemuCommonApi.getShopList()
  shopList.value = data.list
  // 默认全部店铺
  filterForm.value.shopId = ['ALL']
}

// 查询订单统计数据
async function handleSearch() {
  if (!filterForm.value.dateRange.length) {
    ElMessage.error('请选择时间范围')
    return
  }
  loading.value = true
  try {
    const params = {
      shopIds: filterForm.value.shopId[0] === 'ALL' ? [] : filterForm.value.shopId.map(Number),
      startDate: formatDate(filterForm.value.dateRange[0]),
      endDate: formatDate(filterForm.value.dateRange[1]),
      granularity: chartType.value
    }
    console.log('请求参数:', params)
    const res = await TemuOrderApi.getOrderStatistics(params)
    console.log('订单统计接口响应:', res)
    if (res) {
      if (!res.timePoints?.length || !res.values?.length) {
        console.warn('接口返回数据为空，无法绘制折线图')
      }
      chartData.value = {
        timePoints: res.timePoints,
        values: res.values
      }
      summary.value = res.summary
      console.log('chartData.value', chartData.value)
      updateChart()
    }
  } finally {
    loading.value = false
  }
}

/**
 * 重置筛选表单和图表、汇总数据
 * 恢复初始状态
 */
function handleReset() {
  filterForm.value = {
    dateRange: [],
    shopId: []
  }
  chartData.value = { timePoints: [], values: [] }
  summary.value = {}
  updateChart()
}

// formatDate 保证返回 string
function formatDate(date: any) {
  if (!date) return ''
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * 初始化 ECharts 图表实例
 * 页面首次加载时调用
 */
 function initChart() {
  console.log('chartRef.value =', chartRef.value)   // 应该打印出 <div class="chart">
  if (chartRef.value) {
    chartInstance = echarts.init(chartRef.value)
    console.log('chartInstance 已创建', chartInstance)
    updateChart()
  } else {
    console.error('DOM 没找到，chartRef 为 null')
  }
}

/**
 * 更新 ECharts 图表数据和配置
 * 每次查询或重置后调用
 */
// 临时调试，用完删掉
(window as any).myChart = chartInstance
function updateChart() {
  if (!chartInstance) return
  console.log('数据准备写入图表', chartData.value)   // 看看这里的数据
  const option = {
    title: { text: '订单数量趋势图' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: chartData.value.timePoints },
    yAxis: { type: 'value' },
    series: [{ name: '订单数量', type: 'line', data: chartData.value.values }]
  }
  chartInstance.setOption(option, true)
  console.log('已写入图表', option)               // 确认写进去了
}

onMounted(async () => {
  await getShopList()
  await nextTick()
  initChart()
  // 默认日期
  const today = new Date()
  const lastWeek = new Date()
  lastWeek.setDate(today.getDate() - 6)
  // 转为字符串，保证类型兼容 el-date-picker
  filterForm.value.dateRange = [formatDate(lastWeek), formatDate(today)]
  handleSearch()
  ElMessage.info('默认显示所有店铺的订单统计，如需查看单店铺请在筛选中选择店铺')
})

watch(chartType, () => {
  handleSearch()
})

// 处理店铺选择变化
function handleShopChange(val: any[]) {
  // 如果选择了“全部店铺”，只保留全部店铺
  if (val.includes('ALL')) {
    filterForm.value.shopId = ['ALL']
  } else if (!val.length) {
    // 什么都不选，依然视为全部店铺
    filterForm.value.shopId = []
  }
}
</script>

<style scoped>
.order-statistics-page {
  padding: 24px;
  background: #f5f6fa;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.filter-section {
  margin-bottom: 24px;
}

.chart-section {
  margin-bottom: 24px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-header span {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

/* 店铺选择器样式 */
:deep(.el-form-item) {
  margin-right: 16px;
}

:deep(.el-select) {
  width: 300px;
}
</style>
