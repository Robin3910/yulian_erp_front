<template>
  <div class="h-full flex flex-col">
    <div class="sticky top-0 z-10 bg-white dark:bg-dark-500">
      <ContentWrap>
        <!-- 搜索工作栏 -->
        <el-form class="-mb-15px" :model="queryParams" ref="queryFormRef" :inline="true" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="24" :lg="6">
              <el-form-item label="供应商ID" prop="supplierIdList" class="w-full">
                <el-input v-model="queryParams.supplierIdList" placeholder="请输入供应商ID" clearable />
              </el-form-item>
            </el-col>
            <el-col :span="24" :lg="6">
              <el-form-item label="商品SKC" prop="productSkcIdList" class="w-full">
                <el-input
                  v-model="queryParams.productSkcIdList"
                  placeholder="请输入商品SKC，多个用空格或逗号分隔"
                  clearable
                  @keyup.enter="handleQuery"
                />
              </el-form-item>
            </el-col>
            <el-col :span="24" :lg="6">
              <el-form-item label="备货单号" prop="subPurchaseOrderSnList" class="w-full">
                <el-input
                  v-model="queryParams.subPurchaseOrderSnList"
                  placeholder="请输入备货单号，多个用空格或逗号分隔"
                  clearable
                  @keyup.enter="handleQuery"
                />
              </el-form-item>
            </el-col>
            <el-col :span="24" :lg="6">
              <el-form-item label="订单状态" prop="statusList" class="w-full">
                <el-select
                  v-model="selectedStatus"
                  placeholder="请选择订单状态"
                  clearable
                  multiple
                  collapse-tags
                  collapse-tags-tooltip
                >
                  <el-option
                    v-for="item in statusOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="24" :lg="6">
              <el-form-item label="下单时间" prop="purchaseTimeFrom" class="w-full">
                <el-date-picker
                  v-model="selectedDateRange"
                  type="datetimerange"
                  start-placeholder="开始时间"
                  end-placeholder="结束时间"
                  :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]"
                  clearable
                  @change="handleTimeChange"
                />
              </el-form-item>
            </el-col>
            <el-col :span="24" :lg="24">
              <el-form-item>
                <el-button type="primary" @click="handleQuery">
                  <Icon icon="ep:search" class="mr-5px" />
                  搜索
                </el-button>
                <el-button @click="resetQuery">
                  <Icon icon="ep:refresh" class="mr-5px" />
                  重置
                </el-button>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </ContentWrap>
    </div>
    <!-- 列表 -->
    <ContentWrap class="flex-1 overflow-hidden sticky-header">
      <el-table
        v-loading="loading"
        :data="list"
        :stripe="true"
        :show-overflow-tooltip="true"
        row-key="subPurchaseOrderSn"
        height="calc(100vh - 280px)"
        fixed-header
      >
        <el-table-column label="备货单号/时间" align="center" min-width="140" fixed="left">
          <template #default="{ row }">
            <div class="flex flex-col items-center">
              <div class="font-bold mb-2">{{ row.subPurchaseOrderSn }}</div>
              <el-tag
                :type="getStatusType(row.status)"
                size="small"
                class="mb-1"
              >
                {{ getStatusText(row.status) }}
              </el-tag>
              <div class="text-gray-500 text-sm">{{ formatTime(row.purchaseTime) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="供应商信息" align="center" min-width="120">
          <template #default="{ row }">
            <div class="text-center">
              <div class="font-bold">{{ row.supplierName }}</div>
              <div>{{ row.supplierId }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="商品信息" align="center" min-width="500">
          <template #default="{ row }">
            <div class="text-left px-4">
              <div class="product-title mb-2">
                <span class="font-bold">标题：</span>{{ row.productName }}
              </div>
              <div class="flex items-start mb-2">
                <span class="font-bold">SKC：</span>{{ row.productSkcId }}
              </div>
              <div><span class="font-bold">类目：</span>{{ row.category }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="SKU信息" align="center" min-width="320">
          <template #default="{ row }">
            <div v-for="(sku, index) in row.skuQuantityDetailList" :key="index" class="sku-info mb-2">
              <div class="flex items-center justify-center mb-1">
                <el-image 
                  class="w-50px h-50px mr-3" 
                  :src="sku.thumbUrlList?.[0]" 
                  :preview-src-list="sku.thumbUrlList"
                  fit="contain"
                  preview-teleported
                  hide-on-click-modal
                />
                <div class="flex-1" style="max-width: 220px;">
                  <div class="sku-item">
                    <span class="label">规格：</span>{{ sku.className }}
                  </div>
                  <div class="sku-item">
                    <span class="label">商品SKU：</span>{{ sku.productSkuId }}
                  </div>
                  <div class="sku-item">
                    <span class="label">定制SKU：</span>{{ sku.fulfilmentProductSkuId }}
                  </div>
                  <div class="sku-item">
                    <span class="label">数量：</span>{{ sku.purchaseQuantity }}
                  </div>
                </div>
              </div>
              <el-divider v-if="index !== row.skuQuantityDetailList.length - 1" class="my-2" />
            </div>
          </template>
        </el-table-column>
      </el-table>
      <!-- 分页 -->
      <Pagination
        v-model:page="queryParams.pageNo"
        v-model:limit="queryParams.pageSize"
        :total="total"
        @pagination="getList"
      />
    </ContentWrap>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { TemuCommonApi } from '@/api/temu/common'
import dayjs from 'dayjs'
import Pagination from '@/components/Pagination/index.vue'
import { Icon } from '@/components/Icon'

interface QueryParams {
  pageSize: number
  pageNo: number
  supplierIdList: string | null
  productSkcIdList: string | null
  subPurchaseOrderSnList: string | null
  purchaseTimeFrom: number | null
  purchaseTimeTo: number | null
  statusList: number[] | null
}

interface SkuDetail {
  className: string
  thumbUrlList: string[]
  productSkuId: string
  fulfilmentProductSkuId: string
  purchaseQuantity: number
}

interface ListItem {
  subPurchaseOrderSn: string
  productName: string
  productSkcId: string
  category: string
  supplierId: string
  supplierName: string
  purchaseTime: string
  status: number
  skuQuantityDetailList: SkuDetail[]
}

interface ApiResponse {
  list: ListItem[]
  total: number
  pageNo: number
  pageSize: number
}

/** 订单状态选项 */
const statusOptions = [
  { value: 0, label: '待接单' },
  { value: 1, label: '已接单，待发货' },
  { value: 2, label: '已送货' },
  { value: 3, label: '已收货' },
  { value: 4, label: '已拒收' },
  { value: 5, label: '已验收，全部退回' },
  { value: 6, label: '已验收' },
  { value: 7, label: '已入库' },
  { value: 8, label: '作废' },
  { value: 9, label: '已超时' }
]

/** 获取订单状态标签类型 */
const getStatusType = (status: number): 'success' | 'warning' | 'info' | 'primary' | 'danger' => {
  switch (status) {
    case 0: return 'info'
    case 1: return 'warning'
    case 2: return 'primary'
    case 3: return 'info'
    case 4: return 'danger'
    case 5: return 'danger'
    case 6: return 'success'
    case 7: return 'success'
    case 8: return 'info'
    case 9: return 'danger'
    default: return 'info'
  }
}

/** 获取订单状态文本 */
const getStatusText = (status: number) => {
  switch (status) {
    case 0: return '待接单'
    case 1: return '已接单，待发货'
    case 2: return '已送货'
    case 3: return '已收货'
    case 4: return '已拒收'
    case 5: return '已验收，全部退回'
    case 6: return '已验收'
    case 7: return '已入库'
    case 8: return '作废'
    case 9: return '已超时'
    default: return '未知状态'
  }
}

// 使用any类型暂时绕过类型检查
const selectedDateRange = ref<any>(null)
const loading = ref(false)
const list = ref<ListItem[]>([])
const total = ref(0)
const selectedStatus = ref<number[]>([])

const queryParams = reactive<QueryParams>({
  pageSize: 10,
  pageNo: 1,
  supplierIdList: null,
  productSkcIdList: null,
  subPurchaseOrderSnList: null,
  purchaseTimeFrom: null,
  purchaseTimeTo: null,
  statusList: null
})

/** 监听状态选择变化 */
watch(selectedStatus, (val) => {
  queryParams.statusList = val.length > 0 ? val : null
})

const queryFormRef = ref()

/** 将字符串转换为数组，支持空格或逗号分隔 */
const splitToArray = (str: string | null): string[] | null => {
  if (!str) return null
  const result = str.split(/[\s,]+/).filter(Boolean)
  return result.length > 0 ? result : null
}

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    // 调用接口前处理参数
    const skcArray = splitToArray(queryParams.productSkcIdList)
    const orderArray = splitToArray(queryParams.subPurchaseOrderSnList)
    
    const params = {
      pageSize: queryParams.pageSize,
      pageNo: queryParams.pageNo,
      supplierIdList: queryParams.supplierIdList ? [Number(queryParams.supplierIdList)] : null,
      productSkcIdList: skcArray ? skcArray.map(Number) : null,
      subPurchaseOrderSnList: orderArray || null,
      purchaseTimeFrom: queryParams.purchaseTimeFrom,
      purchaseTimeTo: queryParams.purchaseTimeTo,
      statusList: queryParams.statusList || null
    }
    console.log('请求参数:', params)
    const res = await TemuCommonApi.getTemuStockPreparationPage(params) as ApiResponse
    console.log('接口返回数据:', res)
    
    // 直接使用返回的数据
    if (res && res.list) {
      list.value = res.list
      total.value = res.total || 0
      console.log('处理后的列表数据:', list.value, '长度:', list.value.length)
      console.log('总数:', total.value)
    } else {
      list.value = []
      total.value = 0
      console.warn('接口返回数据格式异常:', res)
    }
  } catch (error) {
    console.error('获取列表失败:', error)
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

/** 处理时间选择 */
const handleTimeChange = (val: any) => {
  if (val && val.length === 2) {
    // 开始时间保持不变
    queryParams.purchaseTimeFrom = new Date(val[0]).getTime()
    
    // 结束时间设置为当天的23:59:59
    const endDate = new Date(val[1])
    endDate.setHours(23, 59, 59, 999)
    queryParams.purchaseTimeTo = endDate.getTime()
  } else {
    queryParams.purchaseTimeFrom = null
    queryParams.purchaseTimeTo = null
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields()
  // 重置时间选择器
  selectedDateRange.value = null
  queryParams.purchaseTimeFrom = null
  queryParams.purchaseTimeTo = null
  queryParams.statusList = null // 重置状态选择
  handleQuery()
}

/** 格式化时间 */
const formatTime = (time: string) => {
  if (!time) return ''
  return dayjs(Number(time)).format('YYYY-MM-DD HH:mm:ss')
}

/** 初始化 */
onMounted(() => {
  console.log('页面初始化')
  getList()
})
</script>

<style lang="scss" scoped>
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: var(--app-content-bg-color);
}
.sku-info {
  padding: 4px;
  text-align: left;
  margin: 0 auto; // 居中整个SKU信息块
  max-width: 360px; // 限制最大宽度
  .sku-item {
    font-size: 13px;
    color: var(--el-text-color-regular);
    margin-top: 2px;
    line-height: 1.3;
    &:first-child { margin-top: 0; }
    .label { 
      color: var(--el-text-color-secondary); 
      margin-right: 4px;
      font-weight: bold;
      display: inline-block;
      width: 75px; // 固定标签宽度
      text-align: right; // 标签右对齐
    }
  }
}

.product-title {
  line-height: 1.5;
  word-break: break-all;
}

:deep(.el-image-viewer__wrapper) {
  z-index: 2100;
}

:deep(.el-image) {
  .el-image__inner {
    object-fit: contain;
  }
  
  &:hover {
    cursor: pointer;
  }
}

:deep(.el-divider--horizontal) {
  margin: 8px 0;
}

:deep(.el-tag) {
  margin: 0 2px;
  &.el-tag--small {
    height: 22px;
    padding: 0 6px;
    font-size: 12px;
  }
}

:deep(.el-select) {
  width: 100%;
}
</style>
