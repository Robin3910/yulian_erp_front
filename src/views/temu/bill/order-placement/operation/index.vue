<template>
  <div class="h-full flex flex-col">
    <div class="sticky top-0 z-10 bg-white dark:bg-dark-500">
      <ContentWrap>
        <!-- 搜索工作栏 -->
        <el-form class="-mb-15px" :model="queryParams" ref="queryFormRef" :inline="true" label-width="80px">
          <el-row :gutter="20">
            <el-col :span="24" :lg="6">
              <el-form-item label="店铺" prop="shopId" class="w-full">
                <el-select filterable v-model="queryParams.shopId" placeholder="请选择店铺" clearable multiple>
                  <el-option v-for="(item, index) in shopList" :key="index" :label="item.shopName"
                    :value="item.shopId" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="24" :lg="6">
              <el-form-item label="SKU编号" prop="sku" class="w-full">
                <el-input v-model="queryParams.sku" placeholder="请输入SKU编号" clearable @keyup.enter="handleQuery" />
              </el-form-item>
            </el-col>
            <el-col :span="24" :lg="6">
              <el-form-item label="SKC编号" prop="skc" class="w-full">
                <el-input v-model="queryParams.skc" placeholder="请输入SKC编号" clearable @keyup.enter="handleQuery" />
              </el-form-item>
            </el-col>
            <el-col :span="24" :lg="6">
              <el-form-item label="定制SKU" prop="customSku" class="w-full">
                <el-input v-model="queryParams.customSku" placeholder="请输入定制SKU" clearable @keyup.enter="handleQuery" />
              </el-form-item>
            </el-col>
            <el-col :span="24" :lg="6">
              <el-form-item label="类目" prop="categoryId" class="w-full">
                <el-select filterable v-model="queryParams.categoryId" placeholder="请选择类目" clearable multiple>
                  <el-option v-for="(item, index) in categoryList" :key="index" :label="item.categoryName"
                    :value="item.id" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="24" :lg="6">
              <el-form-item label="订单编号" prop="orderNo" class="w-full">
                <el-input v-model="queryParams.orderNo" placeholder="请输入订单编号" clearable @keyup.enter="handleQuery" />
              </el-form-item>
            </el-col>
            <el-col :span="24" :lg="6">
              <el-form-item label="是否返单" prop="isReturnOrder" class="w-full">
                <el-select v-model="queryParams.isReturnOrder" placeholder="请选择是否返单" clearable>
                  <el-option v-for="item in [
                    { label: '是', value: 1 },
                    { label: '否', value: 0 }
                  ]" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="24" :lg="6">
              <el-form-item label="操作时间" prop="operationTime" class="w-full">
                <el-date-picker v-model="queryParams.operationTime" format="YYYY-MM-DD HH:mm"
                  value-format="YYYY-MM-DD HH:mm:00" type="datetimerange" start-placeholder="开始日期"
                  end-placeholder="结束日期" :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]" />
              </el-form-item>
            </el-col>
            <el-col :span="24" :lg="6">
              <el-form-item label="操作人" prop="operator" class="w-full">
                <el-input v-model="queryParams.operator" placeholder="请输入操作人" clearable @keyup.enter="handleQuery" />
              </el-form-item>
            </el-col>
            <el-col :span="24" :lg="24">
              <el-form-item>
                <el-button @click="handleQuery">
                  <Icon icon="ep:search" class="mr-5px" />
                  搜索
                </el-button>
                <el-button @click="resetQuery">
                  <Icon icon="ep:refresh" class="mr-5px" />
                  重置
                </el-button>
                <el-button type="success" plain @click="handleExport" :loading="exportLoading">
                  <Icon icon="ep:download" class="mr-5px" />
                  导出
                </el-button>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </ContentWrap>
      <ContentWrap>
        <el-row class="items-center">
          <el-col :span="24" class="color-orange-500">
            <div>
              <span>当前筛选条件下的订单总价:￥{{
                orderTotalPrice ? orderTotalPrice.toFixed(2) : '0.00'
                }}</span>
            </div>
          </el-col>
        </el-row>
      </ContentWrap>
    </div>
    <!-- 订单明细表格 -->
    <ContentWrap class="flex-1 overflow-hidden sticky-header">
      <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true" row-key="id"
        height="calc(100vh - 280px)" fixed-header>
        <el-table-column label="订单编号" align="center" prop="orderNo" width="150" />
        <el-table-column label="店铺信息" align="center" min-width="140">
          <template #default="{ row }">
            <div>
              <div class="font-bold">{{ row.shopName }}</div>
              <div>{{ row.shopId }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="商品信息" align="center" min-width="200">
          <template #default="{ row }">
            <div class="text-left">
              <div class="mb-2">
                <span class="font-bold">标题：</span>{{ row.productTitle }}
              </div>
              <div>
                <span class="font-bold">属性:</span>{{ row.productProperties || '--' }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="类目名称" align="center" prop="categoryName" width="120" />
        <el-table-column label="价格信息" align="center" min-width="150">
          <template #default="{ row }">
            <div>
              <div>官网数量：{{ row.originalQuantity || '--' }}</div>
              <div>制作数量：{{ row.quantity || '--' }}</div>
              <div>单价：{{ row.unitPrice ? '￥' + row.unitPrice.toFixed(6) : '--' }}</div>
              <div>总价：{{ row.totalPrice ? '￥' + row.totalPrice.toFixed(2) : '--' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="SKU信息" align="center" min-width="100">
          <template #default="{ row }">
            <div class="text-left">
              <div>SKU编号：{{ row.sku || '-' }}</div>
              <div>SKC编号：{{ row.skc || '-' }}</div>
              <div>定制SKU：{{ row.customSku || '-' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作时间" align="center" prop="operationTime" width="180">
          <template #default="{ row }">
            {{ formatTimestamp(row.operationTime) }}
          </template>
        </el-table-column>
        <el-table-column label="是否返单" align="center" prop="isReturnOrder" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.isReturnOrder === 1" type="warning" size="small">返单</el-tag>
            <el-tag v-else type="info" size="small">否</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作人" align="center" prop="operator" width="120" />
      </el-table>
      <!-- 分页 -->
      <Pagination :total="total" v-model:page="queryParams.pageNo" v-model:limit="queryParams.pageSize"
        @pagination="getList" />
    </ContentWrap>
  </div>
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { OrderPlacementRecordApi } from '@/api/temu/operationlog'
import { TemuCommonApi } from '@/api/temu/common'
import dayjs from 'dayjs'

/** 订单下单记录 列表 */
defineOptions({ name: 'TemuOrderPlacement' })

const message = useMessage() // 消息弹窗
const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const categoryList = ref<any[]>([])
const shopList = ref<any[]>([])
const exportLoading = ref(false) // 导出的加载中

const list = ref<any[]>([])
// 订单总金额
const orderTotalPrice = ref(0)

const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  orderNo: undefined,
  sku: undefined,
  skc: undefined,
  customSku: undefined,
  categoryId: [],
  isReturnOrder: undefined,
  operationTime: [],
  shopId: [],
  operator: undefined
})
const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await OrderPlacementRecordApi.getOrderPlacementRecordPage(queryParams)
    const { totalPrice } = await OrderPlacementRecordApi.getOrderPlacementRecordAmountStatistics(queryParams)
    orderTotalPrice.value = totalPrice
    total.value = data.total
    list.value = data.list || []
  } finally {
    loading.value = false
  }
}

//获取分类列表
const getProductCategoryList = async () => {
  const data = await TemuCommonApi.getProductCategoryList()
  categoryList.value = data.list
}

// 获取店铺列表
const getShopList = async () => {
  const data = await TemuCommonApi.getShopList()
  shopList.value = data.list
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1 // 只有搜索时重置
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  queryParams.pageNo = 1 // 只有重置时重置
  getList()
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await OrderPlacementRecordApi.exportOrderPlacementRecord(queryParams)
    download.excel(data, '订单下单记录.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

const formatTimestamp = (ts: number | string) => {
  if (!ts) return '--'
  const num = typeof ts === 'string' ? Number(ts) : ts
  return dayjs(num).format('YYYY-MM-DD HH:mm:ss')
}

/** 初始化 **/
onMounted(() => {
  getList()
  getProductCategoryList()
  getShopList()
})
</script>

<style lang="scss" scoped>
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: var(--app-content-bg-color);
}
</style>
