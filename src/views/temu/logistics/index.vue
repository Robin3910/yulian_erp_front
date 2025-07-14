<template>
  <div class="logistics-container">
    <el-card>
      <el-form :model="queryParams" ref="queryFormRef" :inline="true" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="24" :lg="6">
            <el-form-item label="店铺" prop="shopId" class="w-full">
              <el-select filterable v-model="queryParams.shopId" placeholder="请选择店铺" clearable>
                <el-option v-for="(item, index) in shopList" :key="index" :label="item.shopName" :value="item.shopId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24" :lg="6">
            <el-form-item label="物流单号" prop="trackingNumber" class="w-full">
              <el-input v-model="queryParams.trackingNumber" placeholder="请输入物流单号" clearable
                @keyup.enter="handleQuery" />
            </el-form-item>
          </el-col>
          <el-col :span="24" :lg="6">
            <el-form-item label="订单编号" prop="orderNo" class="w-full">
              <el-input v-model="queryParams.orderNo" placeholder="请输入订单编号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
          </el-col>
          <el-col :span="24" :lg="6">
            <el-form-item label="定制SKU" prop="customSku" class="w-full">
              <el-input v-model="queryParams.customSku" placeholder="请输入定制SKU" clearable @keyup.enter="handleQuery" />
            </el-form-item>
          </el-col>
          <el-col :span="24" :lg="6">
            <el-form-item label="物流序号" prop="logisticsNo" class="w-full">
              <el-input v-model="queryParams.logisticsNo" placeholder="请输入物流序号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
          </el-col>
          <el-col :span="24" :lg="6">
            <el-form-item label="物流创建时间" prop="logisticsTime">
              <el-date-picker v-model="queryParams.logisticsTime" type="daterange" range-separator="至"
                start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
          <el-col :span="24" :lg="6">
            <el-form-item>
              <el-button type="primary" @click="handleQuery">搜索</el-button>
              <el-button @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <div class="main-content">
      <!-- 左侧物流序号 -->
      <div class="left-panel">
        <div class="panel-header">
          <h3>物流序号</h3>
        </div>
        <div class="sequence-list">
          <div v-for="item in displayList" :key="item.dailySequence + '-' + item.createTime" class="sequence-item"
            :class="{ active: selectedId === item.id }" @click="selectSequence(item)">
            <div class="sequence-info">
              <span class="sequence-number">{{ item.dailySequence }}（{{ formatDateSafe(item.createTime, 'YYYY-MM-DD')
                }}）</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧只展示中包序号 -->
      <div class="right-panel">
        <div class="order-details">
          <div class="details-header">
            <span class="details-title">
              物流序号{{ selectedLogistics?.dailySequence || '' }}
              （{{ formatDateSafe(selectedLogistics?.createTime, 'YYYY-MM-DD') }}）
              物流单号：{{ selectedLogistics?.trackingNumber || '' }}
              共{{ selectedOrderNoList.length }}个中包
            </span>
            <el-button type="text" class="close-btn">
              <el-icon>
                <Close />
              </el-icon>
            </el-button>
          </div>

          <el-table :data="selectedOrderNoList" :stripe="true" :show-overflow-tooltip="true" height="100%"
            :header-cell-style="{ background: 'var(--el-bg-color)' }">
            <el-table-column label="中包序号" min-width="180" align="center">
              <template #default="{ row }">
                <span class="sequence-number">{{ row.sortingSequence }}（{{ formatDateSafe(row.bookingTime, 'YYYY-MM-DD')
                }}）</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>
    <el-pagination v-model:current-page="pageNo" v-model:page-size="pageSize" :total="total"
      :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
      @current-change="handlePageChange" @size-change="handleSizeChange"
      style="margin-top: 20px; justify-content: flex-end; display: flex;" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Close } from '@element-plus/icons-vue'
import { OrderApi } from '@/api/temu/order'
import { TemuCommonApi } from '@/api/temu/common'

const queryParams = ref({
  shopId: '',
  trackingNumber: '',
  orderNo: '',
  customSku: '',
  logisticsNo: '',
  logisticsTime: []
})
const shopList = ref<{ shopId: string | number, shopName: string }[]>([])
const displayList = ref<any[]>([])
const loading = ref(false)
const pageNo = ref(1)
const pageSize = ref(10)
const total = ref(0)
const selectedId = ref<number | null>(null)
const selectedOrderNoList = ref<any[]>([])
const selectedLogistics = ref<any>(null)

function formatDateSafe(timestamp: number | null | undefined, format: string) {
  if (!timestamp) return '-'
  try {
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds)
  } catch {
    return '-'
  }
}

async function getShopList() {
  const data = await TemuCommonApi.getShopList()
  shopList.value = data.list || []
}

async function handleQuery() {
  loading.value = true
  selectedId.value = null
  selectedOrderNoList.value = []
  selectedLogistics.value = null
  try {
    let start = '', end = ''
    if (Array.isArray(queryParams.value.logisticsTime)) {
      start = queryParams.value.logisticsTime[0] || ''
      end = queryParams.value.logisticsTime[1] || ''
      if (end) {
        const endDate = new Date(end)
        endDate.setDate(endDate.getDate() + 1)
        end = endDate.toISOString().slice(0, 10)
      }
    }
    const params = {
      shopId: queryParams.value.shopId,
      trackingNumber: queryParams.value.trackingNumber,
      orderNo: queryParams.value.orderNo,
      customSku: queryParams.value.customSku,
      dailySequence: queryParams.value.logisticsNo,
      createTime: start && end ? [start, end] : [],
      pageNo: pageNo.value,
      pageSize: pageSize.value
    }
    const res = await OrderApi.getShippingOrderPage(params)
    let list = Array.isArray(res.list) ? [...res.list] : []

    // customSku前端过滤
    if (queryParams.value.customSku) {
      const sku = queryParams.value.customSku
      list = list
        .map(item => {
          // 过滤每个orderNoList下的orderList
          const filteredOrderNoList = (item.orderNoList || []).map(orderNoObj => {
            const filteredOrderList = (orderNoObj.orderList || []).filter(order => order.customSku === sku)
            return { ...orderNoObj, orderList: filteredOrderList }
          }).filter(orderNoObj => orderNoObj.orderList.length > 0)
          return { ...item, orderNoList: filteredOrderNoList }
        })
        .filter(item => item.orderNoList && item.orderNoList.length > 0)
    }

    displayList.value = list
    total.value = res.total || 0
    if (displayList.value.length) selectSequence(displayList.value[0])
  } finally {
    loading.value = false
  }
}

function selectSequence(item: any) {
  selectedId.value = item.id
  selectedLogistics.value = item
  const allOrders: any[] = []
  if (Array.isArray(item.orderNoList)) {
    item.orderNoList.forEach((orderNoObj: any) => {
      if (Array.isArray(orderNoObj.orderList)) {
        allOrders.push(...orderNoObj.orderList)
      }
    })
  }
  const uniqueOrders: any[] = []
  const seen = new Set()
  for (const order of allOrders) {
    const key = order.sortingSequence + '-' + order.bookingTime
    if (!seen.has(key)) {
      seen.add(key)
      uniqueOrders.push(order)
    }
  }
  selectedOrderNoList.value = uniqueOrders
}

function handlePageChange(val: number) {
  pageNo.value = val
  handleQuery()
}
function handleSizeChange(val: number) {
  pageSize.value = val
  pageNo.value = 1
  handleQuery()
}
function resetQuery() {
  queryParams.value = {
    shopId: '',
    trackingNumber: '',
    orderNo: '',
    customSku: '',
    logisticsNo: '',
    logisticsTime: []
  }
  pageNo.value = 1
  handleQuery()
}
onMounted(() => {
  getShopList()
  handleQuery()
})
</script>

<style scoped>
.logistics-container {
  padding: 24px;
  background: #f5f6fa;
  min-height: 100vh;
}

.sequence-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 80px;
  padding: 8px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.sequence-number {
  font-size: 14px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 4px;
  text-align: center;
  line-height: 1.3;
}

.order-count {
  font-size: 10px;
  color: #6c757d;
  background-color: #e9ecef;
  padding: 2px 6px;
  border-radius: 10px;
}

.product-info {
  text-align: center;
  padding: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 80px;
}

.product-info .label {
  font-weight: bold;
  color: #606266;
  margin-right: 4px;
}

.product-info .product-quantity {
  margin-bottom: 4px;
  color: #606266;
}

.sku-info {
  text-align: center;
  padding: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 80px;
}

.sku-info .sku-item {
  margin-bottom: 6px;
  line-height: 1.4;
}

.sku-info .label {
  font-weight: bold;
  color: #606266;
  margin-right: 4px;
}

.custom-sku-wrapper .custom-sku {
  color: #e6a23c;
  font-weight: bold;
}

.create-time {
  text-align: center;
}

.create-time .date {
  font-weight: bold;
  color: #303133;
  margin-bottom: 2px;
}

.create-time .time {
  font-size: 12px;
  color: #909399;
}

.text-left-column {
  text-align: left !important;
}

.main-content {
  display: flex;
  gap: 20px;
  margin-top: 16px;
  height: calc(100vh - 280px);
}

.left-panel {
  width: 320px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 16px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.right-panel {
  flex: 1;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  overflow: hidden;
}

.sequence-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.sequence-item {
  cursor: pointer;
  padding: 8px 8px;
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  transition: all 0.3s ease;
  margin-bottom: 6px;
  text-align: center;
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sequence-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
  transform: translateY(-2px);
}

.sequence-item.active {
  border-color: #409eff;
  background: #ecf5ff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.sequence-item .sequence-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 100%;
}

.sequence-item .sequence-number {
  font-size: 13px;
  font-weight: bold;
  color: #409eff;
  line-height: 1.3;
  word-break: break-all;
}

.sequence-item .order-count {
  font-size: 10px;
  color: #6c757d;
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 10px;
  white-space: nowrap;
}

.order-details {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.details-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  flex-shrink: 0;
}

.details-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.close-btn {
  color: #909399;
  font-size: 18px;
}

.close-btn:hover {
  color: #f56c6c;
}

.el-table .sequence-number {
  font-size: 24px;
  font-weight: bold;
  line-height: 1.6;
}
</style>
