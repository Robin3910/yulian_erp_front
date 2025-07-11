<template>
  <div class="shipping-container">
    <el-card>
      <el-form :model="queryParams" ref="queryFormRef" :inline="true" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="24" :lg="6">
            <el-form-item label="类目" prop="categoryId" class="w-full">
              <el-select v-model="queryParams.categoryId" placeholder="请选择类目" clearable multiple filterable
                :filter-method="handleCategorySearch" :loading="categoryLoading"
                :popper-class="'category-select-dropdown'" @visible-change="handleVisibleChange"
                ref="categorySelectRef">
                <el-option v-for="item in filteredCategoryList" :key="item.id" :label="item.categoryName"
                  :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24" :lg="8">
            <el-form-item label="订单创建时间" prop="bookingTime">
              <el-date-picker v-model="queryParams.bookingTime" type="datetimerange" range-separator="至"
                start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD HH:mm:ss"
                @change="handleBookingTimeChange" />
            </el-form-item>
          </el-col>
          <el-col :span="24" :lg="4">
            <el-form-item>
              <el-button type="primary" @click="handleQuery">搜索</el-button>
              <el-button @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <div class="main-content">
      <!-- 左侧分拣单号 -->
      <div class="left-panel" v-loading="loading">
        <div class="panel-header">
          <h3>分拣单号</h3>
        </div>
        <div class="sequence-list">
          <div v-for="item in displayList" :key="item.sortingSequence + '_' + item.bookingTime" class="sequence-item"
            :class="{ active: selectedSequence === (item.sortingSequence + '_' + item.bookingTime) }"
            @click="selectSequence(item)">
            <div class="sequence-info">
              <span class="sequence-number">{{ item.sortingSequence }}（{{ formatDateSafe(item.bookingTime, 'YYYY-MM-DD')
                }}）</span>
              <div class="order-count">/{{ item.orders?.length || 0 }}单</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧订单详情区域 -->
      <div class="right-panel">
        <div v-if="selectedSequence" class="order-details">
          <div class="details-header">
            <span class="details-title">
              {{ selectedGroup?.sortingSequence }}（{{ formatDateSafe(selectedGroup?.bookingTime, 'YYYY-MM-DD') }}）订单详情
            </span>
            <el-button @click="closeDetails" type="text" class="close-btn">
              <el-icon>
                <Close />
              </el-icon>
            </el-button>
          </div>

          <el-table :data="selectedOrders" :stripe="true" :show-overflow-tooltip="true" height="100%"
            :header-cell-style="{ background: 'var(--el-bg-color)' }" row-key="rowKey">
            <!-- 订单号 -->
            <el-table-column label="订单号" align="center" min-width="150">
              <template #default="{ row }">
                <span>{{ row.parentData?.orderNo || '-' }}</span>
              </template>
            </el-table-column>

            <!-- 类名 -->
            <el-table-column label="类名" align="center" min-width="120">
              <template #default="{ row }">
                <span>{{ row.categoryName || '-' }}</span>
              </template>
            </el-table-column>

            <!-- 商品信息 -->
            <el-table-column label="商品信息" min-width="150" class-name="text-left-column" header-align="center">
              <template #default="{ row }">
                <div class="product-info">
                  <div class="product-quantity">
                    <span class="label">官网数量：</span>
                    <span>{{ row.originalQuantity || '--' }}</span>
                  </div>
                  <div class="product-quantity">
                    <span class="label">制作数量：</span>
                    <span>{{ row.quantity || '--' }}</span>
                  </div>
                </div>
              </template>
            </el-table-column>

            <!-- 定制SKU -->
            <el-table-column label="定制SKU" align="center" min-width="200" class-name="text-left-column"
              header-align="center">
              <template #default="{ row }">
                <div class="sku-info">
                  <div class="sku-item">
                    <span class="label">SKU编号：</span>
                    <span>{{ row.parentData?.sku || '-' }}</span>
                  </div>
                  <div class="sku-item custom-sku-wrapper">
                    <span class="label" style="font-weight: bolder">定制SKU：</span>
                    <span class="custom-sku">{{ row.customSku || '-' }}</span>
                  </div>
                </div>
              </template>
            </el-table-column>

            <!-- 合成预览图 -->
            <el-table-column label="合成预览图" align="center" min-width="110">
              <template #default="{ row }">
                <el-image v-if="row.effectiveImgUrl" :hide-on-click-modal="true" :preview-teleported="true"
                  :src="row.effectiveImgUrl" :preview-src-list="[row.effectiveImgUrl]" style="width: 80px; height: 80px"
                  fit="cover" loading="lazy" :initial-index="0" :preview="false" />
                <span v-else>-</span>
              </template>
            </el-table-column>

            <!-- 订单创建时间 -->
            <el-table-column label="订单创建时间" align="center" min-width="140">
              <template #default="{ row }">
                <div class="create-time" v-if="row.parentData?.bookingTime">
                  <div class="date">{{ formatDateSafe(row.parentData.bookingTime, 'YYYY-MM-DD') }}</div>
                  <div class="time">{{ formatDateSafe(row.parentData.bookingTime, 'HH:mm:ss') }}</div>
                </div>
                <span v-else>-</span>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 未选择时的提示 -->
        <div v-else class="empty-state">
          <el-empty description="请选择左侧的分拣单号查看订单详情" />
        </div>
      </div>
    </div>
    <!-- 在 main-content 外部或下方加分页组件 -->
    <el-pagination v-model:current-page="pageNo" v-model:page-size="pageSize" :total="total"
      :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
      @current-change="handlePageChange" @size-change="handleSizeChange"
      style="margin-top: 20px; justify-content: flex-end; display: flex;" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Close } from '@element-plus/icons-vue'
import { TemuCommonApi } from '@/api/temu/common'
import { OrderApi } from '@/api/temu/order'

const queryParams = ref<{
  categoryId: any[],
  bookingTime: string[]
}>({
  categoryId: [],
  bookingTime: []
})
const categoryList = ref<any[]>([])
const filteredCategoryList = ref<any[]>([])
const categoryLoading = ref(false)
const categorySelectRef = ref()
const loading = ref(false)
const displayList = ref<any[]>([])
const pageNo = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 聊天窗口相关
const selectedSequence = ref<string | null>(null)
const selectedOrders = ref<any[]>([])
const selectedGroup = ref<any>(null)

// 获取分类列表
const getProductCategoryList = async () => {
  categoryLoading.value = true
  try {
    const data = await TemuCommonApi.getProductCategoryList()
    categoryList.value = data.list
    filteredCategoryList.value = data.list
  } finally {
    categoryLoading.value = false
  }
}

function handleCategorySearch(query: string) {
  if (query) {
    // 模糊搜索类目
    const filtered = categoryList.value.filter(item =>
      item.categoryName.toLowerCase().includes(query.toLowerCase())
    )
    filteredCategoryList.value = filtered
    // 如果有匹配结果，自动展开下拉框
    if (filtered.length > 0 && categorySelectRef.value) {
      categorySelectRef.value.focus()
    }
  } else {
    // 如果搜索词为空，显示所有类目
    filteredCategoryList.value = categoryList.value
  }
}

function handleVisibleChange(visible: boolean) {
  if (visible) {
    // 当下拉框打开时，显示所有类目
    filteredCategoryList.value = categoryList.value
  }
}

// 选择分拣单号
function selectSequence(item: any) {
  selectedSequence.value = item.sortingSequence + '_' + item.bookingTime
  selectedGroup.value = item
  if (item && item.orders) {
    selectedOrders.value = item.orders.map(order => ({
      ...order,
      parentData: {
        sku: item.sku,
        orderNo: item.orderNo,
        bookingTime: item.bookingTime
      }
    }))
  } else {
    selectedOrders.value = []
  }
}

// 关闭详情
function closeDetails() {
  selectedSequence.value = null
  selectedOrders.value = []
  selectedGroup.value = null
}

function rowKey(row: any) {
  // 用定制SKU作为唯一标识
  return row.customSku || ''
}

async function handleQuery() {
  // 每次查询前重置右侧详情
  selectedSequence.value = null;
  selectedOrders.value = [];
  selectedGroup.value = null;
  loading.value = true;
  try {
    let start = '', end = ''
    if (Array.isArray(queryParams.value.bookingTime)) {
      start = queryParams.value.bookingTime[0] || ''
      end = queryParams.value.bookingTime[1] || ''
    }
    if (start && end) {
      if (start.slice(11) === '00:00:00') {
        start = start.slice(0, 10) + ' 00:00:00'
      }
      if (end.slice(11) === '00:00:00') {
        end = end.slice(0, 10) + ' 23:59:59'
      }
      (queryParams.value.bookingTime as string[]) = [start, end]
    }
    const params = {
      categoryId: queryParams.value.categoryId,
      bookingTime: start && end ? [start, end] : [],
      pageNo: pageNo.value,
      pageSize: pageSize.value
    }
    const res = await OrderApi.getOrderSkuPage(params)

    // 检查API响应状态 - 新的API直接返回数据，不需要检查code
    // if (res.code !== 0) {
    //   console.log('API返回错误码:', res.code)
    //   return
    // }

    // 直接使用res作为数据，因为API直接返回了数据
    const data = res || {}

    // 验证数据结构
    if (!Array.isArray(data.list)) {
      displayList.value = []
      total.value = 0
      return
    }

    displayList.value = data.list
    total.value = data.total || 0
  } catch (error) {
    // 清空数据
    displayList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  queryParams.value = {
    categoryId: [],
    bookingTime: []
  }
  handleQuery() // 恢复自动调用
}

function handleBookingTimeChange(val: string[]) {
  if (Array.isArray(val) && val.length === 2) {
    let [start, end] = val
    if (start && start.slice(11) === '00:00:00') {
      start = start.slice(0, 10) + ' 00:00:00'
    }
    if (end && end.slice(11) === '00:00:00') {
      end = end.slice(0, 10) + ' 23:59:59'
    }
    queryParams.value.bookingTime = [start, end]
  }
}

function handlePageChange(val: number) {
  pageNo.value = val
  handleQuery() // 恢复自动调用
}
function handleSizeChange(val: number) {
  pageSize.value = val
  pageNo.value = 1
  handleQuery() // 恢复自动调用
}

// 安全的时间格式化函数
const formatDateSafe = (timestamp: number | null | undefined, format: string) => {
  if (!timestamp) return '-'
  try {
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) return '-'

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
  } catch (error) {
    return '-'
  }
}

onMounted(() => {
  getProductCategoryList()
  handleQuery()
})
</script>

<style scoped>
.shipping-container {
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
  font-size: 12px;
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

/* 类目选择下拉框样式 */
:deep(.category-select-dropdown) {
  max-height: 300px;
  overflow-y: auto;
}

:deep(.category-select-dropdown .el-select-dropdown__item) {
  padding: 8px 12px;
  line-height: 1.4;
}

:deep(.category-select-dropdown .el-select-dropdown__item:hover) {
  background-color: #f5f7fa;
}

:deep(.category-select-dropdown .el-select-dropdown__item.selected) {
  background-color: #409eff;
  color: white;
}

/* 左右分栏布局 */
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

/* 聊天窗口样式 */
.sequence-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px;
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

.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
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
</style>
