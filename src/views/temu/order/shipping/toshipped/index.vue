<template>
  <div class="shipping-container">
    <!-- 搜索工作栏 -->
    <ContentWrap>
      <el-form class="-mb-15px" :model="queryParams" ref="queryFormRef" :inline="true" label-width="100px">
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
            <el-form-item label="加急状态" prop="isUrgent" class="w-full">
              <el-select v-model="queryParams.isUrgent" placeholder="请选择加急状态" clearable>
                <el-option label="加急" :value="1" />
                <el-option label="非加急" :value="0" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24" :lg="6">
            <el-form-item label="类目" prop="categoryIds" class="w-full">
              <el-select v-model="queryParams.categoryIds" placeholder="请选择类目" clearable multiple filterable
                @input="handleCategorySearch" remote :remote-method="handleCategorySearch">
                <el-option v-for="(item, index) in categoryList" :key="index" :label="item.categoryName"
                  :value="item.categoryId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24" :lg="6">
            <el-form-item label="订单创建时间" prop="createTime">
              <el-date-picker v-model="queryParams.createTime" type="daterange" range-separator="至"
                start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD"
                :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]" />
            </el-form-item>
          </el-col>
          <el-col :span="24" :lg="6">
            <el-form-item>
              <el-button @click="handleQuery">
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

    <!-- 表格区域 -->
    <ContentWrap>
      <div class="mb-10px flex justify-between">
        <div class="flex gap-2">
          <el-button type="success" @click="handlerPrintBatchAll" plain :disabled="selectedStats.total === 0">
            <Icon icon="ep:printer" class="mr-5px" />
            打印全部
          </el-button>
          <el-button type="danger" @click="handlerPrintBatchUrgent" plain :disabled="selectedStats.total === 0">
            <Icon icon="ep:printer" class="mr-5px" />
            批量打印加急面单
          </el-button>
          <el-button type="primary" @click="handlerPrintBatchExpress" plain :disabled="selectedStats.total === 0">
            <Icon icon="ep:printer" class="mr-5px" />
            批量打印面单
          </el-button>
          <el-button type="warning" @click="handlerPrintBatchMerged" plain :disabled="selectedStats.total === 0">
            <Icon icon="ep:printer" class="mr-5px" />
            批量打印条码+合规单
          </el-button>
          <el-button type="info" @click="handlerPrintPickList" plain :disabled="selectedStats.total === 0">
            <Icon icon="ep:printer" class="mr-5px" />
            打印拣货单
          </el-button>
        </div>
      </div>
      <div class="table-header-info" v-if="selectedStats.total > 0">
        <span class="info-item">已选择：</span>
        <span class="info-item">{{ selectedStats.trackingNumbers }}个物流单号</span>
        <span class="info-item">{{ selectedStats.orderNos }}个订单编号</span>
        <span class="info-item">{{ selectedStats.total }}个订单</span>
      </div>
      <el-table ref="tableRef" v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true"
        @selection-change="handleSelectionChange" :span-method="handleSpanMethod" class="custom-table shipping-table"
        height="calc(100vh - 280px)" :header-cell-style="{ background: 'var(--el-bg-color)' }"
        :row-class-name="tableRowClassName" row-key="uniqueId" :virtual-scrolling="true" :scrollbar-always-on="true"
        :max-height="800">
        <!-- 复选框列 -->
        <el-table-column type="selection" width="55" align="center" fixed="left"
          :selectable="(row, index) => isSelectable(row, index)" :reserve-selection="true" />
        <!-- 物流单号列 -->
        <el-table-column label="物流单号" align="center" min-width="170" fixed="left"
          class-name="tracking-column with-divider">
          <template #default="{ row, $index }">
            <template v-if="spanArr.trackingSpans[$index] !== 0">
              <div class="tracking-number-cell">
                <!-- 添加"货已备齐"状态标签 -->
                <el-tag :type="isProductionComplete(row) ? 'success' : 'warning'" class="stock-status-tag" size="small">
                  {{ isProductionComplete(row) ? '货已备齐' : '货未备齐' }}
                </el-tag>
                <div class="tracking-number-wrapper">
                  <span class="tracking-number" :style="{ color: `${getColor($index)}` }">{{
                    (row as any).trackingNumber || '-'
                  }}</span>
                </div>
                <el-tooltip effect="dark" content="进入专注模式" placement="top" popper-class="custom-tooltip"
                  :show-after="100" :hide-after="200" :enterable="false" :offset="20">
                  <el-button size="small" type="primary" plain class="action-button urgent-print-button"
                    @click.stop="handleFocus(row)">
                    <el-icon>
                      <Aim />
                    </el-icon>
                    查看详情
                  </el-button>
                </el-tooltip>

                <el-tooltip effect="dark" content="当前加急面单尚未上传，请联系相关人员及时上传！" placement="top"
                  :disabled="!!row.expressOutsideImageUrl" popper-class="custom-tooltip" :show-after="100"
                  :hide-after="200" :enterable="false" :offset="20">
                  <el-button size="small" type="primary" plain class="action-button urgent-print-button"
                    :disabled="!row.expressOutsideImageUrl" @click.stop="handlePrint(row.expressOutsideImageUrl)">
                    <el-icon>
                      <Printer />
                    </el-icon>
                    打印加急面单
                  </el-button>
                </el-tooltip>
                <el-button v-if="canShip(row)" size="small" type="success" class="action-button ship-button"
                  @click.stop="handleShip(row)">
                  <el-icon>
                    <Van />
                  </el-icon>
                  发货
                </el-button>
                <div style="margin-top: 4px; font-size: 12px; color: #909399;">
                  发货人：{{ row.shippedOperatorNickname || '-' }}
                </div>
              </div>
            </template>
          </template>
        </el-table-column>

        <!-- 物流序号列 -->
        <el-table-column label="物流序号" align="center" width="120" fixed="left" class-name="with-divider">
          <template #default="{ row, $index }">
            <div class="sequence-wrapper">
              <span class="sequence-count" :style="{ color: getColor($index) }">
                {{ row.dailySequence || '-' }}
              </span>
              <span v-if="row.createTime" class="sequence-date">
                {{ formatDateSafe(row.createTime, 'MM-DD') }}
              </span>
            </div>
          </template>
        </el-table-column>

        <!-- 订单信息列 -->
        <el-table-column label="订单信息" align="center" min-width="275" class-name="order-info-column">
          <template #default="{ row, $index }">
            <div class="order-info">
              <div class="order-number">
                <div class="order-number-wrapper">
                  <span :style="{ color: `${getColor($index)}` }">订单号：{{ row.orderNo }}</span>
                </div>
              </div>
              <div class="shop-info">
                <div class="shop-name">
                  <span class="label">店铺名称：</span>
                  <span :style="{ color: `${getColor($index)}` }"> {{ row.shopName }}</span>
                </div>
                <div class="count-info">
                  <div class="package-count" v-if="getPackageCount(row) > 0">
                    <span class="label">包裹数量</span>
                    <span class="count" :style="{ color: `${getColor($index)}` }">{{ getPackageCount(row) }}个</span>
                  </div>
                  <div class="product-count">
                    <span class="label">产品总数</span>
                    <span class="count" :style="{ color: `${getColor($index)}` }">{{ getProductCount(row) }}件</span>
                  </div>
                </div>
                <div class="mt-2 flex justify-center gap-2">
                  <el-tooltip effect="dark" content="当前面单尚未上传，请联系相关人员及时上传！" placement="top"
                    :disabled="!!row.expressImageUrl" popper-class="custom-tooltip" :show-after="100" :hide-after="200"
                    :enterable="false" :offset="20">
                    <el-button size="small" type="primary" plain class="action-button urgent-print-button"
                      :disabled="!row.expressImageUrl" @click.stop="handlePrint(row.expressImageUrl)">
                      <el-icon>
                        <Printer />
                      </el-icon>
                      打印面单
                    </el-button>
                  </el-tooltip>
                  <el-tooltip effect="dark" content="当前商品条码尚未上传，请联系相关人员及时上传！" placement="top"
                    :disabled="!!row.expressSkuImageUrl" popper-class="custom-tooltip" :show-after="100"
                    :hide-after="200" :enterable="false" :offset="20">
                    <el-button size="small" type="info" plain class="action-button urgent-print-button"
                      :disabled="!row.expressSkuImageUrl" @click.stop="handlePrint(row.expressSkuImageUrl)">
                      <el-icon>
                        <Printer />
                      </el-icon>
                      打印商品条码
                    </el-button>
                  </el-tooltip>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 订单状态 -->
        <el-table-column label="订单状态" prop="orderStatus" align="center" min-width="135">
          <template #default="{ row }">
            <div class="status-wrapper">
              <el-tag v-if="row.isUrgent" type="danger" class="urgent-status-tag" size="large">加急</el-tag>
              <el-tag :type="getOrderStatusType(row.orderStatus)" class="status-tag" size="large">
                {{ getOrderStatusText(row.orderStatus) }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <!-- 产品图片 -->
        <el-table-column label="产品图片" align="center" prop="productImgUrl" min-width="110">
          <template #default="{ row }">
            <el-image :hide-on-click-modal="true" :preview-teleported="true" :src="row.productImgUrl"
              :preview-src-list="[row.productImgUrl]" style="width: 80px; height: 80px" loading="lazy"
              :initial-index="0" fit="contain" :z-index="3000" :preview="false" />
          </template>
        </el-table-column>

        <!-- 商品信息 -->
        <el-table-column label="商品信息" min-width="175" class-name="text-left-column" header-align="center">
          <template #default="{ row }">
            <div class="product-info">
              <div class="product-title">
                <span class="label">标题：</span>
                <span>{{ row.productTitle || '-' }}</span>
              </div>
              <div class="product-props" v-if="row.productProperties">
                <span class="label">属性：</span>
                <span>{{ row.productProperties }}</span>
              </div>
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

        <!-- SKU信息 -->
        <el-table-column label="SKU信息" align="center" min-width="275" class-name="text-left-column"
          header-align="center">
          <template #default="{ row }">
            <div class="sku-info">
              <div class="sku-item">
                <span class="label">SKU编号：</span>
                <span>{{ row.sku || '-' }}</span>
              </div>
              <div class="sku-item">
                <span class="label">SKC编号：</span>
                <span>{{ row.skc || '-' }}</span>
              </div>
              <div class="sku-item custom-sku-wrapper">
                <span class="label" style="font-weight: bolder">定制SKU：</span>
                <div class="custom-sku-content">
                  <span v-if="row.customSku" class="custom-sku">{{ row.customSku }}</span>
                  <span v-else>-</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 定制文字列表 -->
        <el-table-column label="定制文字列表" prop="customTextList" align="center" min-width="110" show-overflow-tooltip>
          <template #default="{ row }">
            <div v-if="row.customTextList">{{ row.customTextList }}</div>
            <span v-else></span>
          </template>
        </el-table-column>

        <!-- 定制图片列表 -->
        <el-table-column label="定制图片列表" align="center" prop="customImageUrls" min-width="150">
          <template #default="{ row }">
            <div class="custom-images-container" v-if="row.customImageUrls">
              <div v-for="(item, index) in row.customImageUrls.split(',')" :key="index" class="image-item">
                <el-image :hide-on-click-modal="true" :preview-teleported="true" :src="item+ '?x-oss-process=image/resize,w_200'" :preview-src-list="[item]"
                  style="width: 60px; height: 60px" fit="cover" loading="lazy" :initial-index="0" :preview="false" />
              </div>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <!-- 包裹标签列 -->
        <el-table-column label="包裹标签" align="center" min-width="120">
          <template #default="{ row }">
            <div class="package-tag">
              {{ getPackageTag(row) }}
            </div>
          </template>
        </el-table-column>

        <!-- 合成预览图 -->
        <el-table-column label="合成预览图" prop="effectiveImgUrl" align="center" min-width="110">
          <template #default="{ row }">
            <el-image v-if="row.effectiveImgUrl" :hide-on-click-modal="true" :preview-teleported="true"
              :src="row.effectiveImgUrl+ '?x-oss-process=image/resize,w_200'" :preview-src-list="[row.effectiveImgUrl]" style="width: 80px; height: 80px"
              fit="cover" loading="lazy" :initial-index="0" :preview="false" />
            <span v-else>-</span>
          </template>
        </el-table-column>

        <!-- 发货订单创建时间 -->
        <el-table-column label="发货订单创建时间" prop="createTime" align="center" min-width="140">
          <template #default="{ row }">
            <div class="create-time" v-if="row.createTime">
              <div class="date">{{ formatDateSafe(row.createTime, 'YYYY-MM-DD') }}</div>
              <div class="time">{{ formatDateSafe(row.createTime, 'HH:mm:ss') }}</div>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <!-- 操作列 -->
        <el-table-column label="操作" fixed="right" align="center" min-width="160">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-tooltip effect="dark" content="当前合规单尚未上传，请联系相关人员及时上传！" placement="left-start"
                :disabled="!!row.complianceImageUrl" popper-class="custom-tooltip custom-tooltip-left" :show-after="100"
                :hide-after="200" :enterable="false" :offset="20">
                <el-button size="small" type="warning" plain class="action-button" :disabled="!row.complianceImageUrl"
                  @click.stop="handlePrint(row.complianceImageUrl, row.originalQuantity)">
                  <el-icon>
                    <Printer />
                  </el-icon>
                  打印合规单
                </el-button>
              </el-tooltip>
              <el-tooltip effect="dark" content="当前合并文件尚未上传，请联系相关人员及时上传！" placement="left-start"
                :disabled="!!row.complianceGoodsMergedUrl" popper-class="custom-tooltip custom-tooltip-left"
                :show-after="100" :hide-after="200" :enterable="false" :offset="20">
                <el-button size="small" type="warning" plain class="action-button"
                  :disabled="!row.complianceGoodsMergedUrl"
                  @click.stop="handlePrint(row.complianceGoodsMergedUrl, row.originalQuantity)">
                  <el-icon>
                    <Printer />
                  </el-icon>
                  打印条码+合规单
                </el-button>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <!-- 分页 -->
      <Pagination :total="total" v-model:page="queryParams.pageNo" v-model:limit="queryParams.pageSize"
        @pagination="getList" />
    </ContentWrap>

    <ShippingInfoPopup @confirm="handlerRemarkConfirm" ref="shippingInfoPopup" />

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { OrderApi, OrderVO } from '@/api/temu/order'
import { TemuCommonApi } from '@/api/temu/common'
import { ElMessage, ElMessageBox, ElNotification, ElTable, ElLoading } from 'element-plus'
import { Aim, Printer, Van } from '@element-plus/icons-vue'
import { formatDate } from '@/utils/formatTime'
import { COLOR_ARRAYS } from '@/utils/color'
import printJS from 'print-js'
import { PDFDocument } from 'pdf-lib'
import ShippingInfoPopup from '../components/ShippingInfoPopup.vue'
// const tableRef = useTemplateRef<InstanceType<typeof ElTable>>('tableRef')
const shippingInfoPopup = useTemplateRef('shippingInfoPopup')

declare global {
  interface Window {
    handleImageError: () => void
  }
}

interface OrderItem {
  id: number
  orderNo: string
  productTitle: string
  orderStatus: number
  sku: string
  skc: string
  salePrice: number
  customSku: string
  quantity: number
  originalQuantity: number
  productProperties: string
  customTextList: string | null
  expressImageUrl: string | null
  expressOutsideImageUrl: string | null
  complianceImageUrl: string | null
  complianceGoodsMergedUrl: string | null
  shopName: string | null
  trackingNumber: string
  createTime: number | null
  updateTime: number | null
  isCompleteDrawTask: number | null
  isCompleteProducerTask: number | null
  packageCount: number | null
  productCount: number | null
  packageTag: string | null
  uniqueId: string
  productImgUrl: string | null
  customImageUrls: string | null
  effectiveImgUrl: string | null
  shopId: number | null
  categoryId: string | null
  oldTypeUrl: string | null
  complianceUrl: string | null
  isUrgent: boolean | null  // 添加加急状态字段
  dailySequence: number | null // 添加物流序号字段
}

interface OrderNoGroup {
  orderNo: string
  orderList: OrderItem[]
  expressImageUrl: string
  expressOutsideImageUrl: string
  expressSkuImageUrl: string
}

interface ShippingOrder {
  id: number
  orderNoList: OrderNoGroup[]
  trackingNumber: string
  shopId: number
  shopName: string
  expressImageUrl: string
  expressOutsideImageUrl: string
  expressSkuImageUrl: string
  shippingStatus: string | null
  createTime: number
  updateTime: number
  complianceGoodsMergedUrl: string | null
}

type ExtendedOrderVO = OrderItem

/** 订单 列表 */
defineOptions({ name: 'TemuOrderIndex' })

const loading = ref(true) // 列表的加载中
const list = ref<ExtendedOrderVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const categoryList = ref<any[]>([])

// 店铺列表
const shopList = ref<any[]>([])
// 多选
const selectedRows = ref<ExtendedOrderVO[]>([])
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  orderNo: undefined,
  trackingNumber: undefined,
  shopId: undefined,
  createTime: [],
  shippingStatus: 0, // 0=未发货
  customSku: undefined as string | undefined,
  categoryIds: [] as number[],
  isUrgent: undefined
})
const queryFormRef = ref() // 搜索的表单

interface SpanInfo {
  trackingSpans: number[]
  orderSpans: number[]
}

const spanArr = ref<SpanInfo>({ trackingSpans: [], orderSpans: [] })

// 添加选择统计数据
const selectedStats = ref({
  trackingNumbers: 0,
  orderNos: 0,
  total: 0
})

// 添加图片预加载函数
const preloadImages = (urls: string[]) => {
  urls.forEach(url => {
    if (!url) return
    const img = new Image()
    img.src = url
  })
}

const handlerRemarkConfirm = (data: any) => {
  // 处理备注确认逻辑
  console.log('备注确认:', data)
}

const handleFocus = async (row: any) => {
  // 获取同一物流单号下的所有订单信息
  const sameTrackingOrders = list.value.filter(item => item.trackingNumber === row.trackingNumber)
  // 设置包裹数量和产品总数
  const packageCount = getPackageCount(row)
  const productCount = getProductCount(row)

  // 设置包裹标签
  const packageTag = getPackageTag(row)

  // 更新订单信息
  sameTrackingOrders.forEach(order => {
    order.packageCount = packageCount
    order.productCount = productCount
    order.packageTag = packageTag
  })

  if (shippingInfoPopup.value) {
    shippingInfoPopup.value.setVisible(true)
    shippingInfoPopup.value.formData.orderId = String(row.id)
    shippingInfoPopup.value.formData.remark = row.remark
    // 传递该物流单号下的所有订单信息
    shippingInfoPopup.value.formData.orders = sameTrackingOrders
  }
}

// 修改包裹标签相关的逻辑
const packageTagMap = new Map<string, string>()

/** 查询列表 */
const getList = async () => {
  packageTagMap.clear() // 清空包裹标签映射
  loading.value = true
  try {
    // 恢复为定制SKU模糊查询
    const data = await OrderApi.getShippingOrderPage({
      ...queryParams
    })

    if (!data.list || data.list.length === 0) {
      list.value = []
      total.value = 0
      spanArr.value = { trackingSpans: [], orderSpans: [] }
      return
    }

    // 处理数据，将orderNoList中的数据展开
    const extendedList: ExtendedOrderVO[] = []
    const spanInfo: SpanInfo = {
      trackingSpans: [],
      orderSpans: []
    }

    // 收集所有需要预加载的图片URL
    const imageUrls: string[] = [];

    (data.list as ShippingOrder[]).forEach((shippingOrder, shippingIndex) => {
      if (shippingOrder.orderNoList && shippingOrder.orderNoList.length > 0) {
        let totalItemsInTracking = 0
        let hasValidOrders = false

        // 计算该物流单号下的所有有效订单项总数
        shippingOrder.orderNoList.forEach((orderNoGroup) => {
          if (orderNoGroup.orderList && orderNoGroup.orderList.length > 0) {
            totalItemsInTracking += orderNoGroup.orderList.length
            hasValidOrders = true
          }
        })

        // 如果没有有效订单，至少显示一行数据
        if (!hasValidOrders) {
          totalItemsInTracking = 1
          spanInfo.trackingSpans.push(1)
          spanInfo.orderSpans.push(1)

          // 创建一个空的订单项用于显示
          extendedList.push({
            ...shippingOrder,
            id: shippingOrder.id,
            orderNo: shippingOrder.orderNoList[0]?.orderNo || '',
            productTitle: '',
            orderStatus: 0,
            sku: '',
            skc: '',
            salePrice: 0,
            customSku: '',
            quantity: 0,
            originalQuantity: 0,
            productProperties: '',
            customImageUrls: '',
            customTextList: null,
            productImgUrl: '',
            categoryId: '',
            effectiveImgUrl: '',
            oldTypeUrl: null,
            complianceUrl: null,
            complianceImageUrl: null,
            complianceGoodsMergedUrl: null,
            // 添加URL字段
            expressImageUrl: shippingOrder.orderNoList[0]?.expressImageUrl || '',
            expressOutsideImageUrl: shippingOrder.orderNoList[0]?.expressOutsideImageUrl || '',
            expressSkuImageUrl: shippingOrder.orderNoList[0]?.expressSkuImageUrl || '',
            // 添加唯一标识
            uniqueId: `${shippingOrder.id}_${shippingOrder.trackingNumber}_empty`
          } as ExtendedOrderVO)
        } else {
          // 添加物流单号的合并信息
          spanInfo.trackingSpans.push(totalItemsInTracking)
          spanInfo.trackingSpans.push(...Array(totalItemsInTracking - 1).fill(0))

          // 处理每个订单组
          shippingOrder.orderNoList.forEach((orderNoGroup, orderIndex) => {
            if (orderNoGroup.orderList && orderNoGroup.orderList.length > 0) {
              // 为每个订单组添加合并信息
              const orderItemCount = orderNoGroup.orderList.length
              spanInfo.orderSpans.push(orderItemCount)
              spanInfo.orderSpans.push(...Array(orderItemCount - 1).fill(0))

              // 添加订单项
              orderNoGroup.orderList.forEach((orderItem, itemIndex) => {
                const { orderNoList, ...restShippingData } = shippingOrder
                extendedList.push({
                  ...restShippingData,
                  ...orderItem,
                  // 添加URL字段
                  expressImageUrl: orderNoGroup.expressImageUrl || '',
                  expressOutsideImageUrl: orderNoGroup.expressOutsideImageUrl || '',
                  expressSkuImageUrl: orderNoGroup.expressSkuImageUrl || '',
                  complianceImageUrl: orderItem.complianceImageUrl || '',
                  complianceGoodsMergedUrl: orderItem.complianceGoodsMergedUrl || '',
                  // 添加唯一标识
                  uniqueId: `${shippingOrder.id}_${orderNoGroup.orderNo}_${itemIndex}`
                } as ExtendedOrderVO)
              })
            }
          })
        }
      }

      // 收集图片URL
      if (shippingOrder.expressImageUrl) imageUrls.push(shippingOrder.expressImageUrl)
      if (shippingOrder.expressOutsideImageUrl) imageUrls.push(shippingOrder.expressOutsideImageUrl)
      if (shippingOrder.expressSkuImageUrl) imageUrls.push(shippingOrder.expressSkuImageUrl)

      shippingOrder.orderNoList.forEach((orderNoGroup) => {
        if (orderNoGroup.orderList && orderNoGroup.orderList.length > 0) {
          orderNoGroup.orderList.forEach((orderItem) => {
            if (orderItem.productImgUrl) imageUrls.push(orderItem.productImgUrl)
            if (orderItem.effectiveImgUrl) imageUrls.push(orderItem.effectiveImgUrl)
            if (orderItem.customImageUrls) {
              imageUrls.push(...orderItem.customImageUrls.split(','))
            }
          })
        }
      })
    })

    list.value = extendedList
    total.value = data.total
    spanArr.value = spanInfo

    // 在数据加载完成后，使用nextTick确保DOM更新后再预加载图片
    nextTick(() => {
      preloadImages(imageUrls)
    })
  } catch (error) {
    console.error('获取数据失败:', error)
    list.value = []
    total.value = 0
    spanArr.value = { trackingSpans: [], orderSpans: [] }
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
  queryParams.pageNo = 1
  // 清空选中记录
  selectedRows.value = []
  // 如果表格实例存在，清空表格的选中状态
  if (tableRef.value) {
    tableRef.value.clearSelection()
  }
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  // 清空选中记录
  selectedRows.value = []
  // 如果表格实例存在，清空表格的选中状态
  if (tableRef.value) {
    tableRef.value.clearSelection()
  }
  handleQuery()
}

// 判断行是否可选
const isSelectable = (row: ExtendedOrderVO, index: number) => {
  // 只有在物流单号的第一行允许选择
  return spanArr.value.trackingSpans[index] !== 0
}

// 修改选择处理函数
const handleSelectionChange = (selection: ExtendedOrderVO[]) => {
  // 过滤掉重复的物流单号，只保留每个物流单号的第一条记录
  const uniqueSelection = selection.filter((row, index, self) =>
    index === self.findIndex(r => r.trackingNumber === row.trackingNumber)
  )

  selectedRows.value = uniqueSelection

  // 统计选中的物流单号和订单编号数量
  const trackingNumbersSet = new Set<string>()
  const orderNosSet = new Set<string>()
  let totalOrders = 0

  // 对于每个选中的物流单号，找出其下所有的订单
  uniqueSelection.forEach(selectedRow => {
    if (selectedRow.trackingNumber) {
      trackingNumbersSet.add(selectedRow.trackingNumber)

      // 找出该物流单号下的所有订单
      const relatedOrders = list.value.filter(row =>
        row.trackingNumber === selectedRow.trackingNumber
      )

      relatedOrders.forEach(order => {
        if (order.orderNo) {
          orderNosSet.add(order.orderNo)
        }
        totalOrders++
      })
    }
  })

  selectedStats.value = {
    trackingNumbers: trackingNumbersSet.size,
    orderNos: orderNosSet.size,
    total: totalOrders
  }
}

// 批量设置状态
const handleBatchSetStatus = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要操作的订单')
    return
  }
  // 检查所有已经选择的订单状态是否一致
  const statusList = selectedRows.value.map((item) => item.orderStatus)
  if (new Set(statusList).size > 1) {
    ElMessage.warning('已选择的订单状态不一致，请重新选择')
    return
  }
  // TODO: 实现批量设置状态的逻辑
  ElMessage.info('功能开发中...')
}
// 处理状态修改确认弹窗的回调
const handleUpdateStatus = async (status: number) => {
  //检查所有已经选择的订单状态是否一致
  if (selectedRows.value.length > 0) {
    const statusList = selectedRows.value.map((item) => item.orderStatus)
    if (new Set(statusList).size > 1) {
      ElMessage.warning('已选择的订单状态不一致，请重新选择')
      return
    }
  }
  await OrderApi.updateOrderStatus(
    selectedRows.value.map((item) => {
      return {
        id: item.id,
        orderStatus: status
      }
    })
  )
  ElMessage.success('操作成功')
  getList()
}
// 更新单个订单状态
const handleUpdateRowStatus = async (row: { id: number; orderStatus: number }) => {
  await OrderApi.updateOrderStatus([row])
  ElMessage.success('操作成功')
  getList()
}
const handleUpdateCategory = async (row: { id: number; categoryId: number }) => {
  await OrderApi.updateOrderCategory({
    id: row.id,
    categoryId: row.categoryId
  })
  ElMessage.success('操作成功')
  getList()
}

// 处理表格合并
const handleSpanMethod = ({ rowIndex, columnIndex }: { rowIndex: number; columnIndex: number }) => {
  if (!spanArr.value?.trackingSpans || !spanArr.value?.orderSpans) {
    return { rowspan: 1, colspan: 1 }
  }

  // 复选框列、物流单号列和物流序号列使用相同的合并规则
  if (columnIndex === 0 || columnIndex === 1 || columnIndex === 2) {
    const rowSpan = spanArr.value.trackingSpans[rowIndex]
    if (rowSpan === 0) {
      return { rowspan: 0, colspan: 0 }
    }
    return { rowspan: rowSpan, colspan: 1 }
  } else if (columnIndex === 3) {
    // 订单编号列
    const rowSpan = spanArr.value.orderSpans[rowIndex]
    if (rowSpan === 0) {
      return { rowspan: 0, colspan: 0 }
    }
    return { rowspan: rowSpan, colspan: 1 }
  }
  return { rowspan: 1, colspan: 1 }
}

/** 初始化 **/
onMounted(() => {
  getList()
  getProductCategoryList()
  getShopList()
})

// 清理全局函数
onUnmounted(() => {
  // @ts-ignore
  delete window.handleImageError
})

// 获取订单状态类型
const getOrderStatusType = (status: number): 'success' | 'warning' | 'info' | 'primary' | 'process' => {
  switch (status) {
    case 0:
      return 'info'     // 待下单 - 浅灰
    case 1:
      return 'primary'  // 已下单待送产 - 浅蓝
    case 2:
      return 'warning'  // 已送产待生产 - 浅紫
    case 3:
      return 'process'  // 已生产待发货 - 浅绿，改为primary
    case 4:
      return 'success'  // 已发货 - 浅青
    default:
      return 'info'
  }
}

// 获取订单状态文本
const getOrderStatusText = (status: number) => {
  switch (status) {
    case 0:
      return '待下单'
    case 1:
      return '已下单待送产'
    case 2:
      return '已送产待生产'
    case 3:
      return '已生产待发货'
    case 4:
      return '已发货'
    default:
      return '未知状态'
  }
}

// 添加判断是否可以发货的方法
const canShip = (row: ExtendedOrderVO) => {
  // 获取同一物流单号下的所有订单
  const sameTrackingOrders = list.value.filter(
    (item) => item.trackingNumber === row.trackingNumber
  );

  // 检查是否所有订单都已经是已发货状态(4)
  const allShipped = sameTrackingOrders.every((item) => item.orderStatus === 4);

  // 如果所有订单都已发货，则不显示发货按钮
  return !allShipped;
}

// 修改发货处理方法
const handleShip = async (row: ExtendedOrderVO) => {
  try {
    // 获取同一物流单号下的所有订单，不再限制状态为3
    const sameTrackingOrders = list.value.filter(
      (item) => item.trackingNumber === row.trackingNumber
    )

    const orderIds = sameTrackingOrders.map((item) => item.id)

    if (orderIds.length === 0) {
      ElMessage.warning('没有找到可发货的订单')
      return
    }

    await ElMessageBox.confirm(
      `确认发货该物流单号下的 ${orderIds.length} 个订单吗？该操作确认后无法撤回`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 调用批量更新接口
    await OrderApi.batchUpdateOrderStatus({
      orderIds: orderIds,
      orderStatus: 4,
      trackingNumber: row.trackingNumber
    })

    ElMessage.success('发货成功')
    getList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('发货失败:', error)
      ElMessage.error('发货失败')
    }
  }
}

/** 打印处理函数 */
const handlePrint = async (url: string, quantity?: number) => {
  // 检查URL是否存在
  if (!url) {
    ElMessage.error('打印失败：未找到打印文件')
    return
  }

  // 处理URL中的@前缀
  const printUrl = url.startsWith('@') ? url.substring(1) : url

  // 计算打印份数
  const printCount = quantity && quantity > 1 ? quantity : 1

  // 添加loading
  const loading = ElLoading.service({
    lock: true,
    text: '正在准备打印...',
    background: 'rgba(0, 0, 0, 0.7)'
  })

  try {
    // 判断是否为PDF文件
    const isPDF = printUrl.toLowerCase().endsWith('.pdf')

    if (isPDF) {
      // 先尝试获取PDF文件
      const response = await fetch(printUrl)
      if (!response.ok) {
        throw new Error(`获取PDF文件失败: ${response.statusText}`)
      }

      const pdfBytes = await response.arrayBuffer()

      try {
        // 创建新的PDF文档
        const pdfDoc = await PDFDocument.load(pdfBytes)
        const mergedPdf = await PDFDocument.create()

        // 获取原PDF的所有页面
        const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices())

        // 根据打印份数添加页面
        for (let i = 0; i < printCount; i++) {
          pages.forEach(page => mergedPdf.addPage(page))
        }

        // 生成最终的PDF
        const mergedPdfBytes = await mergedPdf.save()
        const mergedPdfBlob = new Blob([mergedPdfBytes], { type: 'application/pdf' })
        const mergedPdfUrl = URL.createObjectURL(mergedPdfBlob)

        loading.close()

        // 打印合并后的PDF
        await new Promise<void>((resolve, reject) => {
          printJS({
            printable: mergedPdfUrl,
            type: 'pdf',
            showModal: true,
            onLoadingEnd: () => {
              URL.revokeObjectURL(mergedPdfUrl)
              resolve()
            },
            onError: (error) => {
              URL.revokeObjectURL(mergedPdfUrl)
              reject(error)
            }
          })
        })

        ElMessage.success('打印完成')
      } catch (error) {
        console.error('处理PDF文件失败:', error)
        throw new Error('处理PDF文件失败，请稍后重试')
      }
    } else {
      // 如果是图片，创建一个包含多份图片的HTML
      const printContent = Array(printCount).fill(`
        <div style="page-break-after: always;">
          <img src="${printUrl}" style="max-width: 100%; height: auto;">
        </div>
      `).join('')

      loading.close()

      // 使用HTML方式打印图片
      printJS({
        printable: printContent,
        type: 'raw-html',
        showModal: true,
        targetStyles: ['*'],
        style: `
          @media print {
            body { margin: 0; }
            img { max-width: 100%; height: auto; }
            div { page-break-after: always; }
          }
        `
      })

      ElMessage.success('打印完成')
    }
  } catch (error: any) {
    loading.close()
    console.error('打印错误:', error)
    ElMessage.error('打印失败：' + (error?.message || '未知错误'))
  }
}

const colorMap = new Map<string, string>();

// 添加行类名处理函数
const tableRowClassName = ({ row, rowIndex }: { row: any; rowIndex: number }) => {

  let func1 = ({ row, rowIndex }: { row: any; rowIndex: number }) => {
    if (rowIndex === 0) return ''
    const prevRow = list.value[rowIndex - 1]
    const classes: string[] = []

    // 检查物流单号变化
    if (row.trackingNumber !== prevRow.trackingNumber) {
      classes.push('tracking-divider')
    }
    // 检查订单编号变化
    else if (row.orderNo !== prevRow.orderNo) {
      classes.push('order-divider')
    }
    // 同一订单内的行
    else {
      classes.push('same-order-divider')
    }
    return classes.join(' ')
  }
  let func2 = ({ row, rowIndex }: { row: any; rowIndex: number }) => {
    if (colorMap.has(row.trackingNumber)) {
      return colorMap.get(row.trackingNumber)
    } else {
      colorMap.set(row.trackingNumber, `color-${rowIndex % 10}-bg`)
      return colorMap.get(row.trackingNumber)
    }

  }
  func1({ row, rowIndex })
  func2({ row, rowIndex })
  return func1({ row, rowIndex }) + " " + func2({ row, rowIndex })
}

// 复制功能
const handleCopy = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('复制成功')
  } catch (err) {
    console.error('复制失败:', err)
    ElMessage.error('复制失败')
  }
}

const getColor = (index: number) => {
  return ''
  let randomIndex = Math.floor(Math.random() * 8)
  if (index < 0) {
    return COLOR_ARRAYS[0][randomIndex] || ''
  }
  return COLOR_ARRAYS[index][randomIndex] || ''
}

/** 批量打印条码+合规单 */
const handlerPrintBatchMerged = async () => {
  if (!selectedRows.value || selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要打印的订单')
    return
  }

  try {
    // 获取所有选中的物流单号
    const selectedTrackingNumbers = new Set(
      selectedRows.value.map(row => row.trackingNumber)
    )

    // 从list中按页面顺序获取选中的订单
    const allOrders: ExtendedOrderVO[] = list.value.filter(
      row => selectedTrackingNumbers.has(row.trackingNumber)
    )

    // 检查是否有订单的合并文件为空
    const ordersWithoutMerged = allOrders.filter(
      (order) => !order.complianceGoodsMergedUrl
    )
    if (ordersWithoutMerged.length > 0) {
      // 按店铺分组并去重SKC
      const groupedByShop = ordersWithoutMerged.reduce((acc, order) => {
        const shopName = order.shopName || '未知店铺'
        if (!acc[shopName]) {
          acc[shopName] = new Set()
        }
        if (order.skc) {
          acc[shopName].add(order.skc)
        }
        return acc
      }, {} as Record<string, Set<string>>)

      const missingInfo = Object.entries(groupedByShop)
        .map(
          ([shopName, skcs]) => `
          <div style="margin-bottom: 16px;">
            <div style="color: #606266; font-weight: bold; margin-bottom: 8px;">${shopName}</div>
            <div style="padding-left: 16px;">
              ${Array.from(skcs)
              .map(
                (skc) => `
                <div style="color: #409EFF; margin-bottom: 4px;">
                  ${skc}
                </div>
              `
              )
              .join('')}
            </div>
          </div>
        `
        )
        .join('')

      ElNotification({
        title: '无法批量打印',
        message: `
          <div style="margin-bottom: 10px; color: #303133;">以下SKC缺少合并文件，请联系相关人员及时补充：</div>
          <div style="max-height: 300px; overflow-y: auto; padding-right: 10px;">${missingInfo}</div>
        `,
        type: 'warning',
        duration: 0,
        dangerouslyUseHTMLString: true,
        offset: 60
      })
      return
    }

    // 创建一个新的PDF文档
    const mergedPdf = await PDFDocument.create()
    let successCount = 0
    let failCount = 0

    // 按物流单号分组订单
    const ordersByTracking = new Map<string, ExtendedOrderVO[]>()
    allOrders.forEach(order => {
      if (!ordersByTracking.has(order.trackingNumber)) {
        ordersByTracking.set(order.trackingNumber, [])
      }
      ordersByTracking.get(order.trackingNumber)?.push(order)
    })

    // 加载并合并所有PDF文件
    for (const [trackingNumber, orders] of ordersByTracking) {
      // 对每个物流单号下的订单按页面顺序处理
      for (const order of orders) {
        if (!order.complianceGoodsMergedUrl) continue
        const url = order.complianceGoodsMergedUrl.startsWith('@')
          ? order.complianceGoodsMergedUrl.substring(1)
          : order.complianceGoodsMergedUrl
        try {
          const response = await fetch(url)
          if (!response.ok) {
            console.error(`加载PDF失败: ${url}`)
            failCount++
            continue
          }
          const pdfBytes = await response.arrayBuffer()
          const pdf = await PDFDocument.load(pdfBytes)
          const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())

          // 根据官网数量复制对应份数
          const copies = order.originalQuantity || 1
          for (let i = 0; i < copies; i++) {
            copiedPages.forEach((page) => {
              mergedPdf.addPage(page)
            })
          }
          successCount++
        } catch (error) {
          console.error(`加载PDF失败: ${url}`, error)
          failCount++
        }
      }
    }

    if (mergedPdf.getPageCount() === 0) {
      ElMessage.error('没有可打印的合并文件PDF')
      return
    }

    // 保存合并后的PDF
    const mergedPdfBytes = await mergedPdf.save()
    const mergedPdfBlob = new Blob([mergedPdfBytes], { type: 'application/pdf' })
    const mergedPdfUrl = URL.createObjectURL(mergedPdfBlob)

    // 使用print-js打印PDF
    printJS({
      printable: mergedPdfUrl,
      type: 'pdf',
      showModal: true,
      onLoadingEnd: () => {
        // 清理资源
        URL.revokeObjectURL(mergedPdfUrl)
      }
    })

    // 显示处理结果
    if (failCount > 0) {
      ElMessage.warning(`成功处理${successCount}个订单，${failCount}个订单处理失败`)
    } else {
      ElMessage.success(`成功处理${successCount}个订单`)
    }
  } catch (error) {
    console.error('批量打印合并文件失败:', error)
    ElMessage.error(
      '批量打印合并文件失败：' + (error instanceof Error ? error.message : '未知错误')
    )
  }
}

/** 批量打印加急面单 */
const handlerPrintBatchUrgent = async () => {
  if (!selectedRows.value || selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要打印的订单')
    return
  }

  try {
    // 获取所有选中的物流单号下的订单
    const allOrders: ExtendedOrderVO[] = []
    selectedRows.value.forEach(selectedRow => {
      if (selectedRow.trackingNumber) {
        const relatedOrders = list.value.filter(row =>
          row.trackingNumber === selectedRow.trackingNumber
        )
        allOrders.push(...relatedOrders)
      }
    })

    // 检查是否有订单的加急面单为空
    const ordersWithoutUrgent = allOrders.filter(
      (order) => !order.expressOutsideImageUrl
    )
    if (ordersWithoutUrgent.length > 0) {
      // 按店铺分组并去重SKC
      const groupedByShop = ordersWithoutUrgent.reduce((acc, order) => {
        const shopName = order.shopName || '未知店铺'
        if (!acc[shopName]) {
          acc[shopName] = new Set()
        }
        if (order.skc) {
          acc[shopName].add(order.skc)
        }
        return acc
      }, {} as Record<string, Set<string>>)

      const missingInfo = Object.entries(groupedByShop)
        .map(
          ([shopName, skcs]) => `
          <div style="margin-bottom: 16px;">
            <div style="color: #606266; font-weight: bold; margin-bottom: 8px;">${shopName}</div>
            <div style="padding-left: 16px;">
              ${Array.from(skcs)
              .map(
                (skc) => `
                <div style="color: #409EFF; margin-bottom: 4px;">
                  ${skc}
                </div>
              `
              )
              .join('')}
            </div>
          </div>
        `
        )
        .join('')

      ElNotification({
        title: '无法批量打印',
        message: `
          <div style="margin-bottom: 10px; color: #303133;">以下SKC缺少加急面单，请联系相关人员及时补充：</div>
          <div style="max-height: 300px; overflow-y: auto; padding-right: 10px;">${missingInfo}</div>
        `,
        type: 'warning',
        duration: 0,
        dangerouslyUseHTMLString: true,
        offset: 60
      })
      return
    }

    // 创建一个新的PDF文档
    const mergedPdf = await PDFDocument.create()
    let successCount = 0
    let failCount = 0

    // 获取唯一的物流单号及其对应的加急面单URL
    const uniqueTrackingNumbers = new Map<string, string>()
    allOrders.forEach(order => {
      if (order.trackingNumber && order.expressOutsideImageUrl && !uniqueTrackingNumbers.has(order.trackingNumber)) {
        uniqueTrackingNumbers.set(order.trackingNumber, order.expressOutsideImageUrl)
      }
    })

    // 加载并合并所有PDF文件
    for (const [_, url] of uniqueTrackingNumbers) {
      const printUrl = url.startsWith('@') ? url.substring(1) : url
      try {
        if (printUrl.toLowerCase().endsWith('.pdf')) {
          const response = await fetch(printUrl)
          if (!response.ok) {
            console.error(`加载PDF失败: ${printUrl}`)
            failCount++
            continue
          }
          const pdfBytes = await response.arrayBuffer()
          const pdf = await PDFDocument.load(pdfBytes)
          const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
          copiedPages.forEach((page) => {
            mergedPdf.addPage(page)
          })
          successCount++
        } else {
          // 如果是图片，直接使用print-js打印
          printJS({
            printable: printUrl,
            type: 'image',
            showModal: true
          })
          successCount++
        }
      } catch (error) {
        console.error(`加载文件失败: ${printUrl}`, error)
        failCount++
      }
    }

    // 如果有PDF文件，打印合并后的PDF
    if (mergedPdf.getPageCount() > 0) {
      const mergedPdfBytes = await mergedPdf.save()
      const mergedPdfBlob = new Blob([mergedPdfBytes], { type: 'application/pdf' })
      const mergedPdfUrl = URL.createObjectURL(mergedPdfBlob)

      printJS({
        printable: mergedPdfUrl,
        type: 'pdf',
        showModal: true
      })

      // 清理资源
      setTimeout(() => {
        URL.revokeObjectURL(mergedPdfUrl)
      }, 10000)
    }

    // 显示处理结果
    if (failCount > 0) {
      ElMessage.warning(`成功处理${successCount}个订单，${failCount}个订单处理失败`)
    } else {
      ElMessage.success(`成功处理${successCount}个订单`)
    }
  } catch (error) {
    console.error('批量打印加急面单失败:', error)
    ElMessage.error(
      '批量打印加急面单失败：' + (error instanceof Error ? error.message : '未知错误')
    )
  }
}

/** 批量打印面单 */
const handlerPrintBatchExpress = async () => {
  if (!selectedRows.value || selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要打印的订单')
    return
  }

  try {
    // 获取所有选中的物流单号下的订单
    const allOrders: ExtendedOrderVO[] = []
    selectedRows.value.forEach(selectedRow => {
      if (selectedRow.trackingNumber) {
        const relatedOrders = list.value.filter(row =>
          row.trackingNumber === selectedRow.trackingNumber
        )
        allOrders.push(...relatedOrders)
      }
    })

    // 检查是否有订单的面单为空
    const ordersWithoutExpress = allOrders.filter(
      (order) => !order.expressImageUrl
    )
    if (ordersWithoutExpress.length > 0) {
      // 按店铺分组并去重SKC
      const groupedByShop = ordersWithoutExpress.reduce((acc, order) => {
        const shopName = order.shopName || '未知店铺'
        if (!acc[shopName]) {
          acc[shopName] = new Set()
        }
        if (order.skc) {
          acc[shopName].add(order.skc)
        }
        return acc
      }, {} as Record<string, Set<string>>)

      const missingInfo = Object.entries(groupedByShop)
        .map(
          ([shopName, skcs]) => `
          <div style="margin-bottom: 16px;">
            <div style="color: #606266; font-weight: bold; margin-bottom: 8px;">${shopName}</div>
            <div style="padding-left: 16px;">
              ${Array.from(skcs)
              .map(
                (skc) => `
                <div style="color: #409EFF; margin-bottom: 4px;">
                  ${skc}
                </div>
              `
              )
              .join('')}
            </div>
          </div>
        `
        )
        .join('')

      ElNotification({
        title: '无法批量打印',
        message: `
          <div style="margin-bottom: 10px; color: #303133;">以下SKC缺少面单，请联系相关人员及时补充：</div>
          <div style="max-height: 300px; overflow-y: auto; padding-right: 10px;">${missingInfo}</div>
        `,
        type: 'warning',
        duration: 0,
        dangerouslyUseHTMLString: true,
        offset: 60
      })
      return
    }

    // 创建一个新的PDF文档
    const mergedPdf = await PDFDocument.create()
    let successCount = 0
    let failCount = 0

    // 获取唯一的订单号及其对应的面单URL
    const uniqueOrderNos = new Map<string, string>()
    allOrders.forEach(order => {
      if (order.orderNo && order.expressImageUrl && !uniqueOrderNos.has(order.orderNo)) {
        uniqueOrderNos.set(order.orderNo, order.expressImageUrl)
      }
    })

    // 加载并合并所有PDF文件
    for (const [_, url] of uniqueOrderNos) {
      const printUrl = url.startsWith('@') ? url.substring(1) : url
      try {
        if (printUrl.toLowerCase().endsWith('.pdf')) {
          const response = await fetch(printUrl)
          if (!response.ok) {
            console.error(`加载PDF失败: ${printUrl}`)
            failCount++
            continue
          }
          const pdfBytes = await response.arrayBuffer()
          const pdf = await PDFDocument.load(pdfBytes)
          const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
          copiedPages.forEach((page) => {
            mergedPdf.addPage(page)
          })
          successCount++
        } else {
          // 如果是图片，直接使用print-js打印
          printJS({
            printable: printUrl,
            type: 'image',
            showModal: true
          })
          successCount++
        }
      } catch (error) {
        console.error(`加载文件失败: ${printUrl}`, error)
        failCount++
      }
    }

    // 如果有PDF文件，打印合并后的PDF
    if (mergedPdf.getPageCount() > 0) {
      const mergedPdfBytes = await mergedPdf.save()
      const mergedPdfBlob = new Blob([mergedPdfBytes], { type: 'application/pdf' })
      const mergedPdfUrl = URL.createObjectURL(mergedPdfBlob)

      printJS({
        printable: mergedPdfUrl,
        type: 'pdf',
        showModal: true
      })

      // 清理资源
      setTimeout(() => {
        URL.revokeObjectURL(mergedPdfUrl)
      }, 10000)
    }

    // 显示处理结果
    if (failCount > 0) {
      ElMessage.warning(`成功处理${successCount}个订单，${failCount}个订单处理失败`)
    } else {
      ElMessage.success(`成功处理${successCount}个订单`)
    }
  } catch (error) {
    console.error('批量打印面单失败:', error)
    ElMessage.error(
      '批量打印面单失败：' + (error instanceof Error ? error.message : '未知错误')
    )
  }
}

/** 打印拣货单 */
const handlerPrintPickList = () => {
  if (!selectedRows.value || selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要打印的订单')
    return
  }

  // 每页显示的商品数量
  const ITEMS_PER_PAGE = 7

  // 先按物流单号分组，确保每个选中的物流单号都被处理
  const selectedTrackingNumbers = new Set(selectedRows.value.map(row => row.trackingNumber))
  const grouped = {} as Record<string, ExtendedOrderVO[]>

  // 遍历所有订单，将选中的物流单号下的订单分组
  list.value.forEach(item => {
    if (selectedTrackingNumbers.has(item.trackingNumber)) {
      if (!grouped[item.trackingNumber]) {
        grouped[item.trackingNumber] = []
      }
      grouped[item.trackingNumber].push(item)
    }
  })

  // 生成所有物流单号的打印内容
  let printContent = ''

  // 遍历每个物流单号，独立生成其拣货单
  Object.entries(grouped).forEach(([trackingNumber, items], groupIndex) => {
    // 每个物流单号独立计算页数
    const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE)

    // 计算该物流单号下所有订单的总数量
    const totalQuantity = items.reduce((sum, item) => sum + (item.originalQuantity || 0), 0)

    // 按订单编号分组，计算每个订单的总数量和序号
    const orderGroups = new Map<string, { items: ExtendedOrderVO[], totalQuantity: number, lastPage: number }>()
    items.forEach(item => {
      if (!orderGroups.has(item.orderNo)) {
        orderGroups.set(item.orderNo, { items: [], totalQuantity: 0, lastPage: 0 })
      }
      const group = orderGroups.get(item.orderNo)!
      group.items.push(item)
      group.totalQuantity += item.originalQuantity || 0
      // 计算该订单的最后一页
      const itemIndex = items.findIndex(i => i.uniqueId === item.uniqueId)
      group.lastPage = Math.floor(itemIndex / ITEMS_PER_PAGE) + 1
    })

    // 为每个物流单号生成其所有页面
    for (let page = 0; page < totalPages; page++) {
      const currentPage = page + 1
      const startIdx = page * ITEMS_PER_PAGE
      const endIdx = Math.min(startIdx + ITEMS_PER_PAGE, items.length)
      const pageItems = items.slice(startIdx, endIdx)

      // 记录当前页每个订单的起始序号
      const orderStartIndices = new Map<string, number>()
      let currentIndex = 1

      // 计算每个订单在当前页的起始序号
      pageItems.forEach(item => {
        if (!orderStartIndices.has(item.orderNo)) {
          // 如果是新订单，从1开始
          if (page === 0) {
            orderStartIndices.set(item.orderNo, 1)
            currentIndex = 1
          } else {
            // 如果不是第一页，需要找到上一页该订单的最后一个序号
            const prevPageItems = items.slice(0, startIdx)
            const prevOrderItems = prevPageItems.filter(prevItem => prevItem.orderNo === item.orderNo)
            orderStartIndices.set(item.orderNo, prevOrderItems.length + 1)
            currentIndex = prevOrderItems.length + 1
          }
        }
      })

      const itemsHtml = pageItems.map((item, index) => {
        const isFirstItemOfOrder = index === 0 || pageItems[index - 1]?.orderNo !== item.orderNo
        const isLastItemOfOrder = index === pageItems.length - 1 || pageItems[index + 1]?.orderNo !== item.orderNo

        // 获取当前订单在当前页的序号
        const orderStartIndex = orderStartIndices.get(item.orderNo) || 1
        const currentItemIndex = orderStartIndex + pageItems
          .slice(0, index)
          .filter(prevItem => prevItem.orderNo === item.orderNo)
          .length

        // 获取当前订单的总数量和最后一页
        const orderGroup = orderGroups.get(item.orderNo)
        const orderTotalQuantity = orderGroup?.totalQuantity || 0
        const isLastPageOfOrder = orderGroup?.lastPage === currentPage

        return `
          ${isFirstItemOfOrder ? `
          <tr class="order-header">
            <td colspan="5" style="background-color: #f5f7fa; text-align: left; padding: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <strong>订单编号：${item.orderNo}</strong>
                  <span style="margin-left: 20px;">店铺名称：${item.shopName || '--'}</span>
                </div>
              </div>
            </td>
          </tr>
          ` : ''}
          <tr>
            <td style="text-align: center;">${currentItemIndex}</td>
            <td style="vertical-align: top;">
              <div style="margin-bottom: 4px;"><strong>SKC：</strong>${item.skc || '--'}</div>
              <div style="margin-bottom: 4px;"><strong>SKU：</strong>${item.sku || '--'}</div>
              <div><strong>创建时间：</strong>${formatDateSafe(item.createTime, 'YYYY-MM-DD HH:mm:ss')}</div>
            </td>
            <td style="vertical-align: top; text-align: left;">
              <div style="margin-bottom: 8px; font-weight: bold; font-size: 14px;">${item.customSku || '--'}</div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <div style="white-space: pre-wrap; font-size: 12px;">${item.productProperties || '--'}</div>
                ${item.productImgUrl ? `<img src="${item.productImgUrl}" style="width: 32px; height: 32px; object-fit: contain; border: 1px solid #ddd; margin-left: 4px;">` : ''}
              </div>
            </td>
            <td style="vertical-align: top;">
              <div style="margin-bottom: 4px;">
                <strong>定制文字：</strong>
                <div style="white-space: pre-wrap; font-size: 12px;">${item.customTextList || '--'}</div>
              </div>
              <div style="display: flex; gap: 8px; align-items: flex-start; flex-wrap: wrap;">
                ${item.customImageUrls
            ? `
                <div style="max-width: 120px;">
                  <strong>定制图片：</strong>
                  <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">
                    ${item.customImageUrls
              .split(',')
              .slice(0, 4)
              .map(
                (url) => `
                      <img src="${url}" style="width: 35px; height: 35px; object-fit: contain; border: 1px solid #ddd;">
                    `
              )
              .join('')}
                    ${item.customImageUrls.split(',').length > 4
              ? '<div style="font-size: 12px; color: #666;">...</div>'
              : ''
            }
                  </div>
                </div>
                `
            : ''
          }
                ${item.effectiveImgUrl
            ? `
                <div>
                  <strong>合成预览：</strong>
                  <div style="margin-top: 4px;">
                    <img src="${item.effectiveImgUrl}" style="width: 45px; height: 45px; object-fit: contain; border: 1px solid #ddd;">
                  </div>
                </div>
                `
            : ''
          }
              </div>
            </td>
            <td style="text-align: center; vertical-align: middle;">${item.originalQuantity || 0}</td>
          </tr>
          ${isLastItemOfOrder && isLastPageOfOrder ? `
          <tr>
            <td colspan="4" style="text-align: right; background-color: #f5f7fa;"><strong>订单总数量：</strong></td>
            <td style="text-align: center; background-color: #f5f7fa;"><strong>${orderTotalQuantity}</strong></td>
          </tr>
          ` : ''}
        `
      }).join('')

      // 为每个物流单号的每一页生成内容
      printContent += `
        <div class="pick-list-page" ${page < totalPages - 1 || groupIndex < Object.keys(grouped).length - 1 ? 'style="page-break-after: always;"' : ''}>
          <div class="pick-list-header">
            <h1 style="margin: 0; padding: 10px 0; font-size: 20px; text-align: center;">发货拣货单</h1>
            <div style="margin: 10px 0; font-size: 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="display: flex; align-items: center;">
                  <strong style="font-size: 16px;">物流单号：${trackingNumber}</strong>
                  <span style="margin-left: 15px;">第 ${currentPage} 页 / 共 ${totalPages} 页</span>
                </div>
                <div>打印时间：${formatDateSafe(Date.now(), 'YYYY-MM-DD HH:mm:ss')}</div>
              </div>
            </div>
          </div>

          <div class="pick-list-content">
            <table class="pick-list-table">
              <thead>
                <tr>
                  <th style="width: 40px; text-align: center;">序号</th>
                  <th style="width: 200px;">商品信息</th>
                  <th style="width: 150px; text-align: left;">定制SKU/属性</th>
                  <th style="width: 300px;">定制内容</th>
                  <th style="width: 60px; text-align: center;">数量</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
                ${page === totalPages - 1 ? `
                <tr>
                  <td colspan="4" style="text-align: right; background-color: #f5f7fa;"><strong>物流单总数量：</strong></td>
                  <td style="text-align: center; background-color: #f5f7fa;"><strong>${totalQuantity}</strong></td>
                </tr>
                ` : ''}
              </tbody>
            </table>
          </div>

          ${page === totalPages - 1 ? `
          <div class="pick-list-footer">
            <div style="display: flex; justify-content: space-between; padding: 20px 40px;">
              <div>拣货人：____________</div>
              <div>复核人：____________</div>
              <div>日期：____________</div>
            </div>
          </div>
          ` : ''}
        </div>
      `
    }
  })

  // 使用print-js打印
  printJS({
    printable: printContent,
    type: 'raw-html',
    style: `
      @page {
        size: A4;
        margin: 1cm 1cm 1.2cm 1cm;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
        }
        .pick-list-page {
          min-height: 100%;
          box-sizing: border-box;
          position: relative;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
        }
        .pick-list-header {
          margin-bottom: 6px;
          padding: 4px 0 2px 0;
        }
        .pick-list-header h1 {
          margin: 0;
          padding: 4px 0 2px 0;
          font-size: 18px;
        }
        .pick-list-header > div {
          margin: 4px 0 0 0;
          font-size: 13px;
        }
        .pick-list-content {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .pick-list-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          table-layout: fixed;
        }
        th {
          background-color: #f8f8f8 !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        th, td {
          border: 1px solid #000;
          padding: 4px 3px;
          text-align: left;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        tbody tr:nth-child(even) {
          background-color: #fafafa;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .pick-list-footer {
          margin-top: auto;
          padding: 12px 0 0 0;
        }
        tr {
          page-break-inside: avoid;
        }
        .order-header td {
          background-color: #f5f7fa !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        img {
          max-width: 100%;
          height: auto;
        }
      }
    `
  })
}

// 添加获取包裹数量的函数
const getPackageCount = (row: ExtendedOrderVO) => {
  // 获取同一订单号下的所有订单
  const sameOrderItems = list.value.filter(item => item.orderNo === row.orderNo)
  // 使用Set来统计不同的包裹组合
  const uniquePackages = new Set(
    sameOrderItems.map(item => `${item.skc}_${item.sku}`)
  )
  return uniquePackages.size
}

// 添加获取产品数量的函数
const getProductCount = (row: ExtendedOrderVO) => {
  // 获取同一订单号下的所有订单
  const sameOrderItems = list.value.filter(item => item.orderNo === row.orderNo)
  // 累加所有订单的官网数量
  return sameOrderItems.reduce((sum, item) => sum + (item.originalQuantity || 0), 0)
}

// 获取包裹标签
const getPackageTag = (row: ExtendedOrderVO) => {
  const key = `${row.orderNo}_${row.skc}_${row.sku}`
  if (!packageTagMap.has(key)) {
    const tag = String.fromCharCode(65 + packageTagMap.size % 26) // A, B, C...
    packageTagMap.set(key, tag)
  }
  return packageTagMap.get(key)
}

// 添加"货已备齐"状态标签
const isProductionComplete = (row: ExtendedOrderVO) => {
  // 获取同一物流单号下的所有订单
  const sameTrackingOrders = list.value.filter(
    (item) => item.trackingNumber === row.trackingNumber
  )

  // 如果没有订单，返回false
  if (sameTrackingOrders.length === 0) return false

  // 检查是否所有订单都已发货（状态为4）
  const allShipped = sameTrackingOrders.every((order) => order.orderStatus === 4)
  if (allShipped) return true

  // 如果不是所有订单都已发货，则检查是否每个订单都已完成生产任务
  return sameTrackingOrders.every((order) => {
    // 严格检查isCompleteProducerTask是否为1，考虑可能为null的情况
    return order.isCompleteProducerTask === 1
  })
}

/** 批量打印加急面单、面单和条码+合规单 */
const handlerPrintBatchAll = async () => {
  if (!selectedRows.value || selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要打印的订单')
    return
  }

  // 创建加载实例
  const loading = ElLoading.service({
    lock: true,
    text: '正在处理打印文件，请稍候...',
    background: 'rgba(0, 0, 0, 0.7)'
  })

  try {
    // 按照页面显示顺序获取所有选中的订单
    const allOrders: ExtendedOrderVO[] = []
    list.value.forEach(row => {
      // 如果当前行被选中，获取该物流单号下的所有订单
      if (selectedRows.value.some(selected => selected.uniqueId === row.uniqueId)) {
        const sameTrackingOrders = list.value.filter(item =>
          item.trackingNumber === row.trackingNumber
        ) as ExtendedOrderVO[]
        // 确保不重复添加同一物流单号的订单
        if (!allOrders.some(order => order.trackingNumber === row.trackingNumber)) {
          allOrders.push(...sameTrackingOrders)
        }
      }
    })

    // 检查是否有订单缺少必要的文件
    const ordersWithoutFiles = allOrders.filter(
      (order) => !order.expressOutsideImageUrl || !order.expressImageUrl || !order.complianceGoodsMergedUrl
    )
    if (ordersWithoutFiles.length > 0) {
      loading.close() // 关闭加载
      // 按店铺分组并去重SKC
      const groupedByShop = ordersWithoutFiles.reduce((acc, order) => {
        const shopName = order.shopName || '未知店铺'
        if (!acc[shopName]) {
          acc[shopName] = new Set()
        }
        if (order.skc) {
          acc[shopName].add(order.skc)
        }
        return acc
      }, {} as Record<string, Set<string>>)

      const missingInfo = Object.entries(groupedByShop)
        .map(
          ([shopName, skcs]) => `
          <div style="margin-bottom: 16px;">
            <div style="color: #606266; font-weight: bold; margin-bottom: 8px;">${shopName}</div>
            <div style="padding-left: 16px;">
              ${Array.from(skcs)
              .map(
                (skc) => `
                <div style="color: #409EFF; margin-bottom: 4px;">
                  ${skc}
                </div>
              `
              )
              .join('')}
            </div>
          </div>
        `
        )
        .join('')

      ElNotification({
        title: '无法批量打印',
        message: `
          <div style="margin-bottom: 10px; color: #303133;">以下SKC缺少必要的打印文件，请联系相关人员及时补充：</div>
          <div style="max-height: 300px; overflow-y: auto; padding-right: 10px;">${missingInfo}</div>
        `,
        type: 'warning',
        duration: 0,
        dangerouslyUseHTMLString: true,
        offset: 60
      })
      return
    }

    // 更新加载提示
    loading.setText('正在合并PDF文件...')

    // 创建一个新的PDF文档
    const mergedPdf = await PDFDocument.create()
    let successCount = 0
    let failCount = 0

    // 按物流单号分组订单，但保持页面显示顺序
    const ordersByTracking = new Map<string, ExtendedOrderVO[]>()
    allOrders.forEach(order => {
      if (!ordersByTracking.has(order.trackingNumber)) {
        ordersByTracking.set(order.trackingNumber, [])
      }
      ordersByTracking.get(order.trackingNumber)?.push(order)
    })

    // 更新总数用于进度显示
    const totalTrackingNumbers = ordersByTracking.size
    let currentTrackingNumber = 0

    // 按照页面显示顺序处理每个物流单号
    for (const [trackingNumber, orders] of ordersByTracking) {
      currentTrackingNumber++
      loading.setText(`正在处理第 ${currentTrackingNumber}/${totalTrackingNumbers} 个物流单号...`)

      try {
        // 1. 首先添加加急面单（每个物流单号只需要一次）
        const urgentUrl = orders[0].expressOutsideImageUrl
        if (urgentUrl) {
          const printUrl = urgentUrl.startsWith('@') ? urgentUrl.substring(1) : urgentUrl
          const response = await fetch(printUrl)
          if (response.ok) {
            const pdfBytes = await response.arrayBuffer()
            const pdf = await PDFDocument.load(pdfBytes)
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
            copiedPages.forEach(page => mergedPdf.addPage(page))
          }
        }

        // 2. 按订单编号分组
        const ordersByOrderNo = new Map<string, ExtendedOrderVO[]>()
        orders.forEach(order => {
          if (!ordersByOrderNo.has(order.orderNo)) {
            ordersByOrderNo.set(order.orderNo, [])
          }
          ordersByOrderNo.get(order.orderNo)?.push(order)
        })

          // 3. 处理每个订单编号
          for (const [orderNo, sameOrderItems] of ordersByOrderNo) {
          let pageIndex = 0; // 每个订单编号下的面单页索引
          // console.log(sameOrderItems);
          for (let i = 0; i < sameOrderItems.length; i++) {
            const orderItem = sameOrderItems[i];
            const isFirst = i === 0;
            const nextSku = !isFirst ? sameOrderItems[i - 1].sku : null;
            // 第一个 或 SKU变化时打印面单            
            if (isFirst || orderItem.sku !== nextSku) {
              if (orderItem.expressImageUrl) {
                const printUrl = orderItem.expressImageUrl.startsWith('@')
                  ? orderItem.expressImageUrl.substring(1)
                  : orderItem.expressImageUrl;
                // 新增：只打印customSku与PDF中DZ编号匹配的那一页
                try {
                  // 1. 用pdfjs-dist查找匹配页
                  const response = await fetch(printUrl);
                  if (!response.ok) continue;
                  const arrayBuffer = await response.arrayBuffer();
                  // 立即克隆一份
                  const arrayBufferForPdfjs = arrayBuffer.slice(0);
                  const pdfjsDoc = await pdfjsLib.getDocument({ data: arrayBufferForPdfjs }).promise;
                  let matchedPage = -1;
                  for (let pageNum = 1; pageNum <= pdfjsDoc.numPages; pageNum++) {
                    const page = await pdfjsDoc.getPage(pageNum);
                    const content = await page.getTextContent();
                    const text = content.items.map((item) => item.str).join(' ');
                    const match = text.match(/DZ(\w+)/);
                    if (match && match[1] === orderItem.customSku) {
                      matchedPage = pageNum - 1; // pdf-lib页码从0开始
                      break;
                    }
                  }
                  if (matchedPage !== -1) {
                    // pdf-lib 用 arrayBufferForPdfLib
                    const arrayBufferForPdfLib = arrayBuffer.slice(0);
                    const pdfLibDoc = await PDFDocument.load(arrayBufferForPdfLib);
                    const copiedPages = await mergedPdf.copyPages(pdfLibDoc, [matchedPage]);
                    mergedPdf.addPage(copiedPages[0]);
                  }
                } catch (e) {
                  console.error('PDF匹配customSku失败', e);
                }
              }
            }
            if (orderItem.complianceGoodsMergedUrl) {
              const url = orderItem.complianceGoodsMergedUrl.startsWith('@')
                ? orderItem.complianceGoodsMergedUrl.substring(1)
                : orderItem.complianceGoodsMergedUrl;
              let response = await fetch(url);
              if (response.ok) {
                let pdfBytes = await response.arrayBuffer();
                let pdf = await PDFDocument.load(pdfBytes);
                let copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                const copies = orderItem.originalQuantity || 1;
                for (let j = 0; j < copies; j++) {
                  copiedPages.forEach(page => mergedPdf.addPage(page));
                }
              }
            }
            
          }
        }

        // 4. 添加空白页作为分隔（如果不是最后一个物流单号）
        if ([...ordersByTracking.keys()].indexOf(trackingNumber) < ordersByTracking.size - 1) {
          const blankPage = mergedPdf.addPage()
        }

        successCount++
      } catch (error) {
        console.error(`处理物流单号 ${trackingNumber} 失败:`, error)
        failCount++
      }
    }

    if (mergedPdf.getPageCount() === 0) {
      loading.close() // 关闭加载
      ElMessage.error('没有可打印的文件')
      return
    }

    // 更新加载提示
    loading.setText('正在准备打印...')

    // 保存合并后的PDF
    const mergedPdfBytes = await mergedPdf.save()
    const mergedPdfBlob = new Blob([mergedPdfBytes], { type: 'application/pdf' })
    const mergedPdfUrl = URL.createObjectURL(mergedPdfBlob)

    // 使用print-js打印PDF
    printJS({
      printable: mergedPdfUrl,
      type: 'pdf',
      showModal: true,
      onLoadingEnd: () => {
        // 清理资源
        URL.revokeObjectURL(mergedPdfUrl)
        loading.close() // 关闭加载
      }
    })

    // 显示处理结果
    if (failCount > 0) {
      ElMessage.warning(`成功处理${successCount}个物流单号，${failCount}个物流单号处理失败`)
    } else {
      ElMessage.success(`成功处理${successCount}个物流单号`)
    }
  } catch (error) {
    loading.close() // 关闭加载
    console.error('批量打印失败:', error)
    ElMessage.error(
      '批量打印失败：' + (error instanceof Error ? error.message : '未知错误')
    )
  }
}

// 修改formatDate的调用
const formatDateSafe = (timestamp: number | null | undefined, format: string) => {
  if (!timestamp) return '-'
  return formatDate(new Date(timestamp), format)
}

// 在使用formatDate的地方替换为formatDateSafe
// 例如：
// ${formatDateSafe(item.createTime, 'YYYY-MM-DD HH:mm:ss')}

// 在 script 部分添加处理函数
const handleCategorySearch = (query: string) => {
  if (!query) return;

  // 找到所有匹配的类目
  const matchedCategories = categoryList.value.filter(item =>
    item.categoryName.toLowerCase().includes(query.toLowerCase())
  );

  // 获取匹配类目的 ID 列表
  const matchedIds = matchedCategories.map(item => item.categoryId);

  // 将匹配的类目 ID 添加到已选中的列表中
  queryParams.categoryIds = Array.from(new Set([...queryParams.categoryIds, ...matchedIds]));
}

// 添加表格引用
const tableRef = ref()
</script>
<style lang="scss">
$predefined-colors: (
  // 红色系
  color-0: rgba(228, 193, 249, 0.5),
  // 鲜红色
  color-1: rgba(255, 209, 102, 0.5),
  // 亮红色
  color-2: rgba(6, 214, 160, 0.5),
  // 橙红色
  color-3: rgba(17, 138, 178, 0.5),
  // 番茄红

  // 橙色系
  color-4: rgba(150, 224, 114, 0.5),
  // 深橙色
  color-5: rgba(112, 214, 255, 0.5),
  // 橙色
  color-6: rgba(236, 243, 158, 0.5),
  // 琥珀色
  color-7: rgba(255, 214, 112, 0.5),
  // 金橙色

  // 黄色系
  color-8: rgba(241, 192, 232, 0.5),
  // 金色
  color-9: rgba(152, 193, 217, 0.5),
  // 黄色
  color-10: rgba(72, 149, 239, 0.5),
  // 亮黄色

);

// 生成类
@each $name, $color in $predefined-colors {
  .#{$name}-bg {
    background-color: $color !important;
  }
}
</style>
<style lang="scss" scoped>
.shipping-container {
  .custom-table {
    // 添加硬件加速
    transform: translateZ(0);
    will-change: transform;
    backface-visibility: hidden;

    // 优化滚动性能
    :deep(.el-table__body-wrapper) {
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      scroll-behavior: smooth;

      // 优化图片渲染
      img {
        will-change: transform;
        transform: translateZ(0);
        backface-visibility: hidden;
      }
    }
  }
}

// 优化图片容器
.custom-images-container {
  .image-item {
    transform: translateZ(0);
    will-change: transform;
    backface-visibility: hidden;

    img {
      will-change: transform;
      transform: translateZ(0);
      backface-visibility: hidden;
    }
  }
}

// 优化表格行渲染
:deep(.el-table__row) {
  transform: translateZ(0);
  will-change: transform;
  backface-visibility: hidden;
}

.custom-table {
  :deep(.el-table__row) {
    transition: all 0.3s ease;

    &:nth-child(odd) {
      background-color: var(--el-bg-color);
    }

    &:nth-child(even) {
      background-color: var(--el-fill-color-light);
    }

    &:hover {
      td {
        background-color: inherit !important;
      }
    }

    // 为所有行添加底部边框
    td {
      border-bottom: 1px solid #ebeef5 !important;
    }
  }

  :deep(.el-table__cell) {
    border-bottom: 1px solid var(--el-border-color-darker) !important;
    transition: all 0.3s ease;
    background-color: transparent !important;
  }

  :deep(.el-table__header-wrapper) {
    .el-table__cell {
      border-bottom: 1px solid var(--el-border-color-darker) !important;
    }
  }

  :deep(.el-table__body) {
    tr.hover-row>td.el-table__cell {
      background-color: inherit !important;
    }

    tr:hover>td.el-table__cell {
      background-color: inherit !important;
    }

    tr:last-child td {
      border-bottom: 1px solid var(--el-border-color-darker) !important;
    }

    // 为三列添加垂直边框
    .tracking-column,
    .order-info-column {
      position: relative;

      &::after {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        height: 100%;
        width: 1px;
        background-color: var(--el-border-color-darker);
        z-index: 1;
      }
    }
  }

  // 夜间模式适配
  :deep(.dark) {
    .el-table__row {
      &:nth-child(odd) {
        background-color: var(--el-bg-color-overlay);
      }

      &:nth-child(even) {
        background-color: var(--el-bg-color);
      }

      &:hover {
        background-color: inherit !important;
        box-shadow: none;
      }
    }

    .el-table__cell {
      border-bottom-color: var(--el-border-color);
    }
  }
}

:deep(.el-popper.custom-tooltip) {
  pointer-events: none !important;
}

:deep(.el-popper.custom-tooltip-left) {
  margin: 0 !important;
  padding: 5px 10px !important;

  .el-popper__arrow {
    right: -6px !important;
  }
}

// 物流单号单元格
.tracking-number-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  background: transparent;

  .tracking-number-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;

    .copy-button {
      padding: 2px;
      height: 24px;
      font-size: 16px;
      color: #909399;

      &:hover {
        color: #409eff;
      }

      .el-icon {
        margin: 0;
      }
    }
  }

  .tracking-number {
    font-size: 16px;
    line-height: 1.5;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  .urgent-print-button {
    width: 110px;
    margin: 0;
    border-radius: 4px;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    background: #f5f7fa;
    border: 1px solid #dcdfe6;
    color: #606266;
    height: 32px;
    font-size: 13px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: #fff;
      border-color: #c6e2ff;
      color: #409eff;
    }

    &:disabled {
      background: #f5f7fa;
      border-color: #dcdfe6;
      color: #c0c4cc;
    }

    .el-icon {
      margin-right: 4px;
      vertical-align: middle;
    }
  }

  .ship-button {
    width: 110px;
    height: 32px;
    font-size: 14px;
    background: #67c23a;
    border: none;
    color: white;
    font-weight: 500;
    padding: 8px 16px;
    margin: 0 auto;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(103, 194, 58, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: #85ce61;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(103, 194, 58, 0.25);
    }

    &:active {
      transform: translateY(1px);
      box-shadow: 0 1px 2px rgba(103, 194, 58, 0.2);
    }

    .el-icon {
      font-size: 16px;
      margin-right: 6px;
      vertical-align: middle;
    }
  }
}

// 订单信息
.order-info {
  padding: 8px;
  text-align: left;

  .order-number {
    font-size: 16px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    margin-bottom: 8px;
    line-height: 1.4;
    word-break: break-all;
    white-space: normal;

    .order-number-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;

      .copy-button {
        padding: 2px;
        height: 24px;
        font-size: 16px;
        color: #909399;

        &:hover {
          color: #409eff;
        }

        .el-icon {
          margin: 0;
        }
      }
    }
  }

  .shop-info {

    .shop-name,
    .shop-id {
      font-size: 14px;
      color: var(--el-text-color-regular);
      margin-top: 4px;
      line-height: 1.4;

      .label {
        color: var(--el-text-color-secondary);
        margin-right: 4px;
      }
    }
  }
}

// 商品信息
.product-info {
  padding: 8px;
  text-align: left;

  .product-title {
    font-size: 14px;
    font-weight: 400;
    color: var(--el-text-color-primary);
    margin-bottom: 8px;
    line-height: 1.4;
  }

  .product-props,
  .product-quantity {
    font-size: 14px;
    color: var(--el-text-color-regular);
    margin-top: 4px;
    line-height: 1.4;

    .label {
      color: var(--el-text-color-secondary);
      margin-right: 4px;
    }
  }
}

// SKU信息
.sku-info {
  padding: 8px;
  text-align: left;

  .sku-item {
    font-size: 14px;
    color: var(--el-text-color-regular);
    margin-top: 4px;
    line-height: 1.4;

    &:first-child {
      margin-top: 0;
    }

    .label {
      color: var(--el-text-color-secondary);
      margin-right: 4px;
    }

    &.custom-sku-wrapper {
      display: flex;
      align-items: center;

      .custom-sku-content {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;

        .custom-sku {
          font-weight: 700;
          color: #409eff;
          background-color: #ecf5ff;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 16px;
        }

        .copy-button {
          padding: 2px;
          height: 24px;
          font-size: 16px;
          color: #909399;

          &:hover {
            color: #409eff;
          }

          .el-icon {
            margin: 0;
          }
        }
      }
    }
  }
}

// 定制图片列表
.custom-images-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  .image-item {
    border-radius: 4px;
    transition: transform 0.2s;

    &:hover {
      transform: scale(1.05);
    }
  }
}

// 状态标签样式优化
.status-tag {
  font-size: 13px;
  padding: 6px 5px;
  border-radius: 4px;
  font-weight: 500;
  position: relative;
  transition: all 0.3s ease;
  min-width: 90px;

  // 待下单状态
  &.el-tag--info {
    background: #c3c5c7;
    border: 1px solid #c3c5c7;
    color: white;

    &:hover {
      background: #a4a6a8;
      color: #f0f4f8;
    }
  }

  // 已下单待送产状态
  &.el-tag--primary {
    background: #e0f2fe;
    border: 1px solid #e0f2fe;
    color: #082f49;

    &:hover {
      background: #0ea5e9;
      color: #e0f2fe;
    }

    &::before {
      content: '';
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #0ea5e9;
      margin-right: 8px;
      animation: pulse 1s infinite;
    }
  }

  // 已送产待生产状态
  &.el-tag--warning {
    background: #e0e7ff;
    border: 1px solid #e0e7ff;
    color: #1e1b4b;

    &:hover {
      background: #6366f1;
      color: #e0e7ff;
    }

    &::before {
      content: '';
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #6366f1;
      margin-right: 8px;
      animation: pulse 1s infinite;
    }
  }

  // 已生产待发货状态
  &.el-tag--process {
    background: #5da2e7;
    border: 1px solid #75bdec;
    color: #fff;

    &:hover {
      background: #409eff;
      color: #dcfce7;
    }

    &::before {
      content: '';
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #f4f7f5;
      margin-right: 8px;
      animation: pulse 1s infinite;
    }
  }

  // 已发货状态
  &.el-tag--success {
    background: #75c945;
    border: 1px solid #73d13d;
    color: #fff;

    &:hover {
      background: #73d13d;
      color: #fff;
    }

    &::before {
      content: '✓';
      margin-right: 4px;
      font-weight: bold;
    }
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }
}

@keyframes pulse {
  0% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }

  100% {
    opacity: 1;
    transform: scale(1);
  }
}

// 操作按钮
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px;

  .action-button {
    width: 130px;
    height: 30px;
    margin: 0;
    border-radius: 4px;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    opacity: 1;
    font-size: 13px;

    // 统一所有打印按钮样式
    &.el-button--primary,
    &.el-button--warning,
    &.el-button--info {
      background: #f5f7fa;
      border: 1px solid #dcdfe6;
      color: #606266;

      &:hover {
        background: #fff;
        border-color: #c6e2ff;
        color: #409eff;
      }

      &:disabled {
        background: #f5f7fa;
        border-color: #dcdfe6;
        color: #c0c4cc;
      }
    }

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    }

    &:active {
      transform: translateY(1px);
    }

    .el-icon {
      margin-right: 4px;
      vertical-align: middle;
    }
  }
}

.shipping-table {

  // 移除表格默认边框
  :deep(.el-table__inner-wrapper) {
    border: none !important;
  }

  // 表头边框
  :deep(.el-table__header-wrapper) {
    th {
      border-bottom: 1px solid var(--el-border-color) !important;
    }
  }

  // 表格内容边框
  :deep(.el-table__body-wrapper) {
    tr {

      // 统一所有行的边框
      td {
        border-bottom: 1px solid var(--el-border-color) !important;
      }
    }

    // 同一订单内的行分隔
    tr.same-order-divider td {
      border-bottom: 1px solid var(--el-border-color) !important;
    }

    // 不同订单编号之间的分隔
    tr.order-divider td {
      border-bottom: 1px solid var(--el-border-color) !important;
    }

    // 不同物流单号之间的分隔
    tr.tracking-divider td {
      border-bottom: 1px solid var(--el-border-color) !important;
    }
  }

  // 垂直分隔线
  :deep(.el-table__body) {
    .order-info-column {
      position: relative;

      .cell {
        padding-right: 16px;
      }

      &::after {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        height: 100%;
        width: 1px;
        background-color: var(--el-border-color);
        z-index: 1;
      }
    }

    .with-divider {
      position: relative;

      &::after {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        height: 100%;
        width: 1px;
        background-color: var(--el-border-color);
        z-index: 1;
      }
    }
  }

  // 夜间模式边框颜色适配
  :deep(.dark) {

    // 表头边框
    .el-table__header-wrapper th {
      border-bottom: 1px solid var(--el-border-color-darker) !important;
    }

    // 垂直分隔线
    .order-info-column::after,
    .with-divider::after {
      background-color: var(--el-border-color-darker);
    }
  }
}

// 物流序号样式
.sequence-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background-color: var(--el-fill-color-light);
  padding: 8px;
  border-radius: 6px;

  .sequence-count {
    font-size: 24px;
    font-weight: 800;
    line-height: 1.2;
    text-align: center;
  }

  .sequence-date {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    text-align: center;
  }
}

// 订单信息列的分隔线
:deep(.el-table__body) {
  .order-info-column {
    position: relative;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      height: 100%;
      width: 1px;
      background-color: var(--el-border-color-darker);
      z-index: 1;
    }
  }
}

// 修改打印按钮样式，与加急面单按钮保持一致
.urgent-print-button {
  width: 110px;
  margin: 0;
  border-radius: 4px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  color: #606266;
  height: 32px;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #fff;
    border-color: #c6e2ff;
    color: #409eff;
  }

  &:disabled {
    background: #f5f7fa;
    border-color: #dcdfe6;
    color: #c0c4cc;
  }

  .el-icon {
    margin-right: 4px;
    vertical-align: middle;
  }
}

// 添加表头信息样式
.table-header-info {
  margin-bottom: 16px;
  padding: 8px 16px;
  background-color: var(--el-color-primary-light-9);
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 16px;

  .info-item {
    font-size: 14px;
    color: var(--el-text-color-primary);

    &:first-child {
      font-weight: bold;
    }
  }
}

// 修改包裹标签样式
.package-tag {
  display: inline-block;
  padding: 8px 12px;
  border-radius: 6px;
  font-weight: bold;
  font-size: 18px;
  min-width: 32px;
  text-align: center;
  color: #fff;
  background-color: #409EFF;
  border: 2px solid #409EFF;
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.2);
  transition: all 0.3s ease;
  margin: 4px 0;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(64, 158, 255, 0.3);
  }
}

// 添加包裹数量样式
.package-count {
  font-size: 14px;
  color: var(--el-text-color-regular);
  margin-top: 4px;
  line-height: 1.4;

  .label {
    color: var(--el-text-color-secondary);
    margin-right: 4px;
  }
}

// 添加产品数量样式
.product-count {
  font-size: 14px;
  color: var(--el-text-color-regular);
  margin-top: 4px;
  line-height: 1.4;

  .label {
    color: var(--el-text-color-secondary);
    margin-right: 4px;
  }
}

// 修改数量信息样式
.count-info {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 12px;
  padding: 8px;
  background-color: var(--el-fill-color-light);
  border-radius: 6px;

  .package-count,
  .product-count {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    min-width: 80px;

    .label {
      font-size: 13px;
      color: var(--el-text-color-secondary);
      text-align: center;
    }

    .count {
      font-size: 20px;
      font-weight: bold;
      line-height: 1.2;
      text-align: center;
    }
  }
}

// "货已备齐"状态标签
.stock-status-tag {
  font-size: 14px;
  padding: 8px 16px;
  border-radius: 4px;
  margin-bottom: 8px;
  width: 110px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;

  &.el-tag--success {
    background-color: #67c23a;
    border-color: #67c23a;
    color: #fff;
  }

  &.el-tag--warning {
    background-color: #e6a23c;
    border-color: #e6a23c;
    color: #fff;
  }
}

.status-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;

  .urgent-status-tag {
    margin: 0;
    padding: 2px 12px;
    height: 24px;
    line-height: 20px;
    background-color: #f56c6c;
    color: white;
    border: 1px solid #f56c6c;
    font-weight: bold;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(245, 108, 108, 0.2);

    &:hover {
      background-color: #f78989;
      border-color: #f78989;
    }
  }

  .status-tag {
    margin: 0;
  }
}
</style>
