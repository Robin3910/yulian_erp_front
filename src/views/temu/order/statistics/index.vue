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
            <el-select filterable v-model="filterForm.shopId" placeholder="请选择店铺" clearable multiple>
              <el-option v-for="(item, index) in shopList" :key="index" :label="item.shopName" :value="item.shopId" />
            </el-select>
          </el-form-item>
          <!-- 类目 -->
          <el-form-item label="类目">
            <el-select filterable v-model="filterForm.categoryId" placeholder="请选择类目" clearable multiple>
              <el-option v-for="(item, index) in categoryList" :key="index" :label="item.categoryName" :value="item.categoryId" />
            </el-select>
          </el-form-item>
          <!-- 时间范围 -->
          <el-form-item label="时间范围">
            <el-date-picker
v-model="filterForm.dateRange" type="daterange" range-separator="至" start-placeholder="开始日期"
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
    <!-- 返单统计图表 -->
    <div class="chart-section">
      <el-card>
        <template #header>
          <div class="chart-header">
            <span>返单数量趋势</span>
            <el-radio-group v-model="chartType" size="small">
              <el-radio-button value="day">按天</el-radio-button>
              <el-radio-button value="week">按周</el-radio-button>
              <el-radio-button value="month">按月</el-radio-button>
            </el-radio-group>
          </div>
        </template>
        <div ref="returnChartRef" class="chart" style="width: 100%; height: 400px;"></div>
        <div v-if="returnSummary && Object.keys(returnSummary).length" class="summary-info" style="margin-top: 16px;">
          <el-descriptions title="返单汇总信息" :column="4" border>
            <el-descriptions-item label="总返单数">{{ returnSummary.totalOrders }}</el-descriptions-item>
            <el-descriptions-item label="均返单数">{{ returnSummary.averageDaily }}</el-descriptions-item>
            <el-descriptions-item label="最高">{{ returnSummary.maxOrders }}</el-descriptions-item>
            <el-descriptions-item label="最低">{{ returnSummary.minOrders }}</el-descriptions-item>
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
  categoryId: (string | number)[]
}>({
  dateRange: [],
  shopId: [],
  categoryId: []
})

const chartType = ref('day')
const chartRef = ref()
const returnChartRef = ref()
let chartInstance: echarts.ECharts | null = null
let returnChartInstance: echarts.ECharts | null = null

// 店铺列表
const shopList = ref<any[]>([])
// 类目列表
const categoryList = ref<any[]>([])

// 订单统计数据
const chartData = ref<{ timePoints: string[]; values: number[] }>({ timePoints: [], values: [] })
const summary = ref<any>({})
// 返单统计数据
const returnChartData = ref<{ timePoints: string[]; values: number[] }>({ timePoints: [], values: [] })
const returnSummary = ref<any>({})
const loading = ref(false)

// 获取店铺列表
async function getShopList() {
  const data = await TemuCommonApi.getShopList()
  shopList.value = data.list
  // 默认选中第一个店铺
  if (shopList.value.length) {
    filterForm.value.shopId = [shopList.value[0].shopId]
  }
}

// 获取类目列表
async function getCategoryList() {
  try {
    const data = await TemuOrderApi.getCategoryList()
    categoryList.value = data.list || data
  } catch (error) {
    console.error('获取类目列表失败:', error)
    ElMessage.error('获取类目列表失败')
  }
}

// 查询订单统计数据
async function handleSearch() {
  if (!filterForm.value.shopId.length || !filterForm.value.dateRange.length) {
    ElMessage.error('请选择店铺和时间范围')
    return
  }
  loading.value = true
  try {
    const params = {
      shopIds: filterForm.value.shopId.map(Number), // 保证是 number[]
      startDate: formatDate(filterForm.value.dateRange[0]),
      endDate: formatDate(filterForm.value.dateRange[1]),
      granularity: chartType.value,
      categoryIds: filterForm.value.categoryId.length ? filterForm.value.categoryId.map(Number) : undefined
    }
    console.log('请求参数:', params)
    
    // 查询订单统计
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

    // 查询返单统计
    const returnRes = await TemuOrderApi.getReturnOrderStatistics(params)
    console.log('返单统计接口响应:', returnRes)
    if (returnRes) {
      if (!returnRes.timePoints?.length || !returnRes.values?.length) {
        console.warn('返单接口返回数据为空，无法绘制折线图')
      }
      returnChartData.value = {
        timePoints: returnRes.timePoints,
        values: returnRes.values
      }
      returnSummary.value = returnRes.summary
      console.log('returnChartData.value', returnChartData.value)
      updateReturnChart()
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
    shopId: [],
    categoryId: []
  }
  chartData.value = { timePoints: [], values: [] }
  summary.value = {}
  returnChartData.value = { timePoints: [], values: [] }
  returnSummary.value = {}
  updateChart()
  updateReturnChart()
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
 * 初始化返单图表实例
 */
function initReturnChart() {
  console.log('returnChartRef.value =', returnChartRef.value)
  if (returnChartRef.value) {
    returnChartInstance = echarts.init(returnChartRef.value)
    console.log('returnChartInstance 已创建', returnChartInstance)
    updateReturnChart()
  } else {
    console.error('DOM 没找到，returnChartRef 为 null')
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

/**
 * 更新返单图表数据和配置
 */
function updateReturnChart() {
  if (!returnChartInstance) return
  console.log('返单数据准备写入图表', returnChartData.value)
  const option = {
    title: { text: '返单数量趋势图' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: returnChartData.value.timePoints },
    yAxis: { type: 'value' },
    series: [{ name: '返单数量', type: 'line', data: returnChartData.value.values }]
  }
  returnChartInstance.setOption(option, true)
  console.log('已写入返单图表', option)
}

onMounted(async () => {
  await getShopList()
  await getCategoryList()
  await nextTick()
  initChart()
  initReturnChart()
  // 默认日期
  const today = new Date()
  const lastWeek = new Date()
  lastWeek.setDate(today.getDate() - 6)
  // 转为字符串，保证类型兼容 el-date-picker
  filterForm.value.dateRange = [formatDate(lastWeek), formatDate(today)]
  handleSearch()
})

watch(chartType, () => {
  handleSearch()
})
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
