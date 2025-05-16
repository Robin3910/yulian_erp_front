<template>
  <div class="shipping-container">
    <!-- 搜索工作栏 -->
    <ContentWrap>
      <el-form
        class="-mb-15px"
        :model="queryParams"
        ref="queryFormRef"
        :inline="true"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="24" :lg="6">
            <el-form-item label="店铺" prop="shopId" class="w-full">
              <el-select filterable v-model="queryParams.shopId" placeholder="请选择店铺" clearable>
                <el-option
                  v-for="(item, index) in shopList"
                  :key="index"
                  :label="item.shopName"
                  :value="item.shopId"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24" :lg="6">
            <el-form-item label="订单编号" prop="orderNo" class="w-full">
              <el-input
                v-model="queryParams.orderNo"
                placeholder="请输入订单编号"
                clearable
                @keyup.enter="handleQuery"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24" :lg="6">
            <el-form-item label="物流单号" prop="trackingNumber" class="w-full">
              <el-input
                v-model="queryParams.trackingNumber"
                placeholder="请输入物流单号"
                clearable
                @keyup.enter="handleQuery"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24" :lg="6">
            <el-form-item label="定制SKU" prop="customSku" class="w-full">
              <el-input
                v-model="queryParams.customSku"
                placeholder="请输入物流单号"
                clearable
                @keyup.enter="handleQuery"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24" :lg="6">
            <el-form-item label="订单创建时间" prop="createTime">
              <el-date-picker
                v-model="queryParams.createTime"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
                :default-time="[
                  new Date(2000, 1, 1, 0, 0, 0),
                  new Date(2000, 1, 1, 23, 59, 59)
                ]"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24" :lg="6">
            <el-form-item label="订单状态" prop="orderStatus" class="w-full">
              <el-select v-model="queryParams.orderStatus" placeholder="请选择订单状态" clearable>
                <el-option :label="'已生产待发货'" :value="3" />
                <el-option :label="'已发货'" :value="4" />
              </el-select>
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
      <el-table
        v-loading="loading"
        :data="list"
        :stripe="true"
        :show-overflow-tooltip="true"
        @selection-change="handleSelectionChange"
        :span-method="handleSpanMethod"
        class="custom-table shipping-table"
        height="calc(100vh - 280px)"
        :header-cell-style="{ background: 'var(--el-bg-color)' }"
        :row-class-name="tableRowClassName"
      >
        <!-- 物流单号列 -->
        <el-table-column
          label="物流单号"
          align="center"
          min-width="170"
          fixed="left"
          class-name="tracking-column"
        >
          <template #default="{ row, $index }">
            <template v-if="spanArr.trackingSpans[$index] !== 0">
              <div class="tracking-number-cell">
                <div class="tracking-number-wrapper">
                  <span class="tracking-number" :style="{color: `${getColor($index)}`}">{{ (row as any).trackingNumber || '-' }}</span>
                  <!-- <el-button
                    v-if="row.trackingNumber"
                    class="copy-button"
                    type="primary"
                    link
                    @click.stop="handleCopy(row.trackingNumber)"
                  >
                    <el-icon><CopyDocument /></el-icon>
                  </el-button> -->
                </div>
                <el-tooltip
                  effect="dark"
                  content="当前加急面单尚未上传，请联系相关人员及时上传！"
                  placement="top"
                  :disabled="!!row.expressOutsideImageUrl"
                  popper-class="custom-tooltip"
                  :show-after="100"
                  :hide-after="200"
                  :enterable="false"
                  :offset="20"
                >
                  <el-button
                    size="small"
                    type="primary"
                    plain
                    class="action-button urgent-print-button"
                    :disabled="!row.expressOutsideImageUrl"
                    @click.stop="handlePrint(row.expressOutsideImageUrl)"
                  >
                    <el-icon><Printer /></el-icon>
                    打印加急面单
                  </el-button>
                </el-tooltip>
                <el-button
                  v-if="canShip(row)"
                  size="small"
                  type="success"
                  class="action-button ship-button"
                  @click.stop="handleShip(row)"
                >
                  <el-icon><Van /></el-icon>
                  发货
                </el-button>
              </div>
            </template>
          </template>
        </el-table-column>

        <!-- 订单信息 -->
        <el-table-column
          label="订单信息"
          align="center"
          min-width="275"
          class-name="order-info-column"
        >
          <template #default="{ row,$index }">
            <div class="order-info">
              <div class="order-number">
                <div class="order-number-wrapper">
                  <span :style="{color: `${getColor($index)}`}">订单号：{{ row.orderNo }}</span>
                  <!-- <el-button
                    v-if="row.orderNo"
                    class="copy-button"
                    type="primary"
                    link
                    @click.stop="handleCopy(row.orderNo)"
                  >
                    <el-icon><CopyDocument /></el-icon>
                  </el-button> -->
                </div>
              </div>
              <div class="shop-info">
                <div class="shop-name">
                  <span class="label">店铺名称：</span>
                  <span :style="{color: `${getColor($index)}`}"> {{ row.shopName }}</span>

                </div>
                <div class="shop-id">
                  <span class="label">店铺ID：</span>
                  <span :style="{color: `${getColor($index)}`}">  {{ row.shopId }}</span>

                </div>
                <div class="mt-2 flex justify-center gap-2">
                  <el-tooltip
                    effect="dark"
                    content="当前面单尚未上传，请联系相关人员及时上传！"
                    placement="top"
                    :disabled="!!row.expressImageUrl"
                    popper-class="custom-tooltip"
                    :show-after="100"
                    :hide-after="200"
                    :enterable="false"
                    :offset="20"
                  >
                    <el-button
                      size="small"
                      type="primary"
                      plain
                      class="action-button urgent-print-button"
                      :disabled="!row.expressImageUrl"
                      @click.stop="handlePrint(row.expressImageUrl)"
                    >
                      <el-icon><Printer /></el-icon>
                      打印面单
                    </el-button>
                  </el-tooltip>
                  <el-tooltip
                    effect="dark"
                    content="当前商品条码尚未上传，请联系相关人员及时上传！"
                    placement="top"
                    :disabled="!!row.expressSkuImageUrl"
                    popper-class="custom-tooltip"
                    :show-after="100"
                    :hide-after="200"
                    :enterable="false"
                    :offset="20"
                  >
                    <el-button
                      size="small"
                      type="info"
                      plain
                      class="action-button urgent-print-button"
                      :disabled="!row.expressSkuImageUrl"
                      @click.stop="handlePrint(row.expressSkuImageUrl)"
                    >
                      <el-icon><Printer /></el-icon>
                      打印商品条码
                    </el-button>
                  </el-tooltip>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 订单状态 -->
        <el-table-column
          label="订单状态"
          prop="orderStatus"
          align="center"
          min-width="135"
        >
          <template #default="{ row }">
            <el-tag :type="getOrderStatusType(row.orderStatus)" class="status-tag" size="large">
              {{ getOrderStatusText(row.orderStatus) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 产品图片 -->
        <el-table-column label="产品图片" align="center" prop="productImgUrl" min-width="110">
          <template #default="{ row }">
            <el-image
              :hide-on-click-modal="true"
              :preview-teleported="true"
              :src="row.productImgUrl"
              :preview-src-list="[row.productImgUrl]"
              style="width: 80px; height: 80px"
            />
          </template>
        </el-table-column>

        <!-- 商品信息 -->
        <el-table-column
          label="商品信息"
          min-width="175"
          class-name="text-left-column"
          header-align="center"
        >
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
                <span>{{ row.originalQuantity || "--" }}</span>
              </div>
              <div class="product-quantity">
                <span class="label">制作数量：</span>
                <span>{{ row.quantity|| "--" }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- SKU信息 -->
        <el-table-column
          label="SKU信息"
          align="center"
          min-width="275"
          class-name="text-left-column"
          header-align="center"
        >
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
                <span class="label" style="font-weight: bold;">定制SKU：</span>
                <div class="custom-sku-content">
                  <span v-if="row.customSku" class="custom-sku">{{ row.customSku }}</span>
                  <span v-else>-</span>
                  <!-- <el-button
                    v-if="row.customSku"
                    class="copy-button"
                    type="primary"
                    link
                    @click.stop="handleCopy(row.customSku)"
                  >
                    <el-icon><CopyDocument /></el-icon>
                  </el-button> -->
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 定制文字列表 -->
        <el-table-column
          label="定制文字列表"
          prop="customTextList"
          align="center"
          min-width="110"
          show-overflow-tooltip
        >
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
                <el-image
                  :hide-on-click-modal="true"
                  :preview-teleported="true"
                  :src="item"
                  :preview-src-list="[item]"
                  style="width: 60px; height: 60px;"
                  fit="cover"
                />
              </div>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <!-- 合成预览图 -->
        <el-table-column label="合成预览图" prop="effectiveImgUrl" align="center" min-width="110">
          <template #default="{ row }">
            <el-image
              v-if="row.effectiveImgUrl"
              :hide-on-click-modal="true"
              :preview-teleported="true"
              :src="row.effectiveImgUrl"
              :preview-src-list="[row.effectiveImgUrl]"
              style="width: 80px; height: 80px"
              fit="cover"
            />
            <span v-else>-</span>
          </template>
        </el-table-column>

        <!-- 发货订单创建时间 -->
        <el-table-column label="发货订单创建时间" prop="createTime" align="center" min-width="140">
          <template #default="{ row }">
            <div class="create-time" v-if="row.createTime">
              <div class="date">{{ formatDate(row.createTime, 'YYYY-MM-DD') }}</div>
              <div class="time">{{ formatDate(row.createTime, 'HH:mm:ss') }}</div>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <!-- 操作列 -->
        <el-table-column label="操作" fixed="right" align="center" min-width="130">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-tooltip
                effect="dark"
                content="当前合规单尚未上传，请联系相关人员及时上传！"
                placement="left-start"
                :disabled="!!row.oldTypeUrl"
                popper-class="custom-tooltip custom-tooltip-left"
                :show-after="100"
                :hide-after="200"
                :enterable="false"
                :offset="20"
              >
                <el-button
                  size="small"
                  type="warning"
                  plain
                  class="action-button"
                  :disabled="!row.oldTypeUrl"
                  @click.stop="handlePrint(row.oldTypeUrl)"
                >
                  <el-icon><Printer /></el-icon>
                  打印合规单
                </el-button>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <!-- 分页 -->
      <Pagination
        :total="total"
        v-model:page="queryParams.pageNo"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />
    </ContentWrap>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { OrderApi, OrderVO } from '@/api/temu/order'
import { TemuCommonApi } from '@/api/temu/common'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Printer, Van } from '@element-plus/icons-vue'
import { formatDate } from '@/utils/formatTime'
import { COLOR_ARRAYS } from '@/utils/color'

declare global {
  interface Window {
    handleImageError: () => void;
  }
}

interface OrderItem {
  id: number;
  orderNo: string;
  productTitle: string;
  orderStatus: number;
  sku: string;
  skc: string;
  salePrice: number;
  customSku: string;
  quantity: number;
  productProperties: string;
  shopId: number;
  customImageUrls: string;
  customTextList: string | null;
  productImgUrl: string;
  categoryId: string;
  effectiveImgUrl: string;
  oldTypeUrl: string | null;
}

interface OrderNoGroup {
  orderNo: string;
  orderList: OrderItem[];
  expressImageUrl: string;
  expressOutsideImageUrl: string;
  expressSkuImageUrl: string;
}

interface ShippingOrder {
  id: number;
  orderNoList: OrderNoGroup[];
  trackingNumber: string;
  shopId: number;
  shopName: string;
  expressImageUrl: string;
  expressOutsideImageUrl: string;
  expressSkuImageUrl: string;
  shippingStatus: string | null;
  createTime: number;
  updateTime: number;
}

type ExtendedOrderVO = Omit<ShippingOrder, 'orderNoList'> & OrderItem;

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
  orderStatus: undefined,
  customSku:undefined
})
const queryFormRef = ref() // 搜索的表单

interface SpanInfo {
  trackingSpans: number[]
  orderSpans: number[]
}

const spanArr = ref<SpanInfo>({ trackingSpans: [], orderSpans: [] })
const getColor=(index:number)=>{
  let randomIndex = Math.floor(Math.random() * 8);
  console.log('>>>>>>>>>>索引位置',index,randomIndex)
  if(index<0){
    return COLOR_ARRAYS[0][randomIndex]||"";
  }
  return COLOR_ARRAYS[index][randomIndex]||"";
}
/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await OrderApi.getShippingOrderPageByUser({
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

    ;(data.list as ShippingOrder[]).forEach((shippingOrder) => {
      if (shippingOrder.orderNoList && shippingOrder.orderNoList.length > 0) {
        let totalItemsInTracking = 0
        let hasValidOrders = false

        // 计算该物流单号下的所有有效订单项总数
        shippingOrder.orderNoList.forEach(orderNoGroup => {
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
            productProperties: '',
            customImageUrls: '',
            customTextList: null,
            productImgUrl: '',
            categoryId: '',
            effectiveImgUrl: '',
            oldTypeUrl: null,
            // 添加URL字段
            expressImageUrl: shippingOrder.orderNoList[0]?.expressImageUrl || '',
            expressOutsideImageUrl: shippingOrder.orderNoList[0]?.expressOutsideImageUrl || '',
            expressSkuImageUrl: shippingOrder.orderNoList[0]?.expressSkuImageUrl || ''
          } as ExtendedOrderVO)
        } else {
          // 添加物流单号的合并信息
          spanInfo.trackingSpans.push(totalItemsInTracking)
          spanInfo.trackingSpans.push(...Array(totalItemsInTracking - 1).fill(0))

          // 处理每个订单组
          shippingOrder.orderNoList.forEach(orderNoGroup => {
            if (orderNoGroup.orderList && orderNoGroup.orderList.length > 0) {
              // 为每个订单组添加合并信息
              const orderItemCount = orderNoGroup.orderList.length
              spanInfo.orderSpans.push(orderItemCount)
              spanInfo.orderSpans.push(...Array(orderItemCount - 1).fill(0))

              // 添加订单项
              orderNoGroup.orderList.forEach(orderItem => {
                const { orderNoList, ...restShippingData } = shippingOrder
                extendedList.push({
                  ...restShippingData,
                  ...orderItem,
                  // 添加URL字段
                  expressImageUrl: orderNoGroup.expressImageUrl || '',
                  expressOutsideImageUrl: orderNoGroup.expressOutsideImageUrl || '',
                  expressSkuImageUrl: orderNoGroup.expressSkuImageUrl || ''
                } as ExtendedOrderVO)
              })
            }
          })
        }
      }
    })

    list.value = extendedList
    total.value = data.total
    spanArr.value = spanInfo
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
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

// 处理多选
const handleSelectionChange = (selection: OrderVO[]) => {
  selectedRows.value = selection.map(item => {
    const { orderNoList, ...rest } = item as unknown as ShippingOrder
    return {
      ...rest,
      ...(orderNoList?.[0]?.orderList?.[0] || {}),
      orderId: item.id
    }
  }) as ExtendedOrderVO[]
}
// 批量设置状态
const handleBatchSetStatus = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要操作的订单')
    return
  }
  if (orderStatusPopup && orderStatusPopup.value) {
    console.log('>>>>>>>>orderStatusPopup.value', orderStatusPopup.value)
    orderStatusPopup.value.setVisible(true)
  }
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
const handleSpanMethod = ({ rowIndex, columnIndex }: { rowIndex: number, columnIndex: number }) => {
  if (!spanArr.value?.trackingSpans || !spanArr.value?.orderSpans) {
    return { rowspan: 1, colspan: 1 }
  }

  if (columnIndex === 0) { // 物流单号列
    const rowSpan = spanArr.value.trackingSpans[rowIndex]
    if (rowSpan === 0) {
      return { rowspan: 0, colspan: 0 }
    }
    return { rowspan: rowSpan, colspan: 1 }
  } else if (columnIndex === 1) { // 订单编号列
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
const getOrderStatusType = (status: number): 'success' | 'warning' | 'info' | 'primary' | 'danger' => {
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
  // 检查当前物流单号下是否有状态为3的订单
  const sameTrackingOrders = list.value.filter(item =>
    item.trackingNumber === row.trackingNumber &&
    item.orderStatus === 3
  )
  return sameTrackingOrders.length > 0
}

// 修改发货处理方法
const handleShip = async (row: ExtendedOrderVO) => {
  try {
    // 获取同一物流单号下的所有可发货订单
    const sameTrackingOrders = list.value.filter(item =>
      item.trackingNumber === row.trackingNumber &&
      item.orderStatus === 3
    )

    const orderIds = sameTrackingOrders.map(item => item.id)

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
const handlePrint = async (url: string) => {
  // 检查URL是否存在
  if (!url) {
    ElMessage.error('打印失败：未找到打印文件')
    return
  }

  // 处理URL中的@前缀
  const printUrl = url.startsWith('@') ? url.substring(1) : url

  try {
    // 先尝试预加载文件
    const response = await fetch(printUrl)
    if (!response.ok) {
      throw new Error(`文件加载失败: ${response.status}`)
    }
    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)

    // 判断是否为PDF文件
    const isPDF = printUrl.toLowerCase().endsWith('.pdf')

    // 创建隐藏的iframe用于打印
    const printFrame = document.createElement('iframe')
    printFrame.style.position = 'fixed'
    printFrame.style.right = '0'
    printFrame.style.bottom = '0'
    printFrame.style.width = '0'
    printFrame.style.height = '0'
    printFrame.style.border = '0'
    document.body.appendChild(printFrame)

    if (isPDF) {
      // PDF文件
      printFrame.src = objectUrl
      printFrame.onload = () => {
        try {
          printFrame.contentWindow?.focus()
          printFrame.contentWindow?.print()
        } catch (error) {
          console.error('打印触发失败:', error)
          ElMessage.error('打印失败，请重试')
        }
      }
    } else {
      // 图片文件
      printFrame.contentWindow?.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>打印</title>
            <style>
              @media print {
                @page {
                  margin: 0;
                  size: auto;
                }
                html, body {
                  margin: 0;
                  padding: 0;
                  height: 100%;
                }
                img {
                  max-width: 100%;
                  max-height: 100%;
                  object-fit: contain;
                }
              }
            </style>
          </head>
          <body>
            <img
              src="${objectUrl}"
              onload="window.print()"
              onerror="window.parent.handleImageError()"
            />
          </body>
        </html>
      `)
      printFrame.contentWindow?.document.close()
    }

    // 监听打印对话框关闭
    const cleanup = () => {
      if (document.body.contains(printFrame)) {
        document.body.removeChild(printFrame)
        URL.revokeObjectURL(objectUrl)
      }
    }

    // 设置延时清理
    setTimeout(cleanup, 10000) // 10秒后清理资源

    // 添加全局错误处理函数
    window.handleImageError = () => {
      cleanup()
      ElMessage.error('打印失败：图片加载失败')
    }

  } catch (error) {
    console.error('打印错误:', error)
    ElMessage.error('打印失败：' + (error instanceof Error ? error.message : '未知错误'))
  }
}

// 添加行类名处理函数
const tableRowClassName = ({ row, rowIndex }: { row: any; rowIndex: number }) => {
  if (rowIndex === 0) return ''

  const prevRow = list.value[rowIndex - 1]
  const classes = []

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

</script>

<style lang="scss" scoped>
.shipping-container {
  .custom-table {
    // 设置表头样式
    :deep(.el-table__header-wrapper) {
      position: sticky;
      top: 0;
      z-index: 1;
    }
  }
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
      border-bottom: 1px solid #EBEEF5 !important;
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
    tr.hover-row > td.el-table__cell {
      background-color: inherit !important;
    }

    tr:hover > td.el-table__cell {
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
        color: #409EFF;
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
    background: #F5F7FA;
    border: 1px solid #DCDFE6;
    color: #606266;
    height: 32px;
    font-size: 13px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: #fff;
      border-color: #c6e2ff;
      color: #409EFF;
    }

    &:disabled {
      background: #F5F7FA;
      border-color: #DCDFE6;
      color: #C0C4CC;
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
    background: #67C23A;
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
          color: #409EFF;
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
    font-size: 15px;
    font-weight: 400;
    color: var(--el-text-color-primary);
    margin-bottom: 8px;
    line-height: 1.4;
  }

  .product-props,
  .product-quantity {
    font-size: 15px;
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
          color: #409EFF;
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
            color: #409EFF;
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
      color: #F0F4F8;
    }
  }

  // 已下单待送产状态
  &.el-tag--primary {
    background: #E0F2FE;
    border: 1px solid #E0F2FE;
    color: #082F49;

    &:hover {
      background: #0EA5E9;
      color: #E0F2FE;
    }

    &::before {
      content: '';
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #0EA5E9;
      margin-right: 8px;
      animation: pulse 1s infinite;
    }
  }

  // 已送产待生产状态
  &.el-tag--warning {
    background: #E0E7FF;
    border: 1px solid #E0E7FF;
    color: #1E1B4B;

    &:hover {
      background: #6366F1;
      color: #E0E7FF;
    }

    &::before {
      content: '';
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #6366F1;
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
      color: #DCFCE7;
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
    width: 110px;
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
      background: #F5F7FA;
      border: 1px solid #DCDFE6;
      color: #606266;

      &:hover {
        background: #fff;
        border-color: #c6e2ff;
        color: #409EFF;
      }

      &:disabled {
        background: #F5F7FA;
        border-color: #DCDFE6;
        color: #C0C4CC;
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

    // 所有行边框
    .el-table__body-wrapper {
      td {
        border-bottom: 1px solid var(--el-border-color-darker) !important;
      }

      tr.same-order-divider td {
        border-bottom: 1px solid var(--el-border-color-darker) !important;
      }

      tr.order-divider td {
        border-bottom: 1px solid var(--el-border-color-darker) !important;
      }

      tr.tracking-divider td {
        border-bottom: 1px solid var(--el-border-color-darker) !important;
      }
    }

    // 垂直分隔线
    .tracking-column::after,
    .order-info-column::after {
      background-color: var(--el-border-color-darker) !important;
      opacity: 0.8;
    }
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
  background: #F5F7FA;
  border: 1px solid #DCDFE6;
  color: #606266;
  height: 32px;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #fff;
    border-color: #c6e2ff;
    color: #409EFF;
  }

  &:disabled {
    background: #F5F7FA;
    border-color: #DCDFE6;
    color: #C0C4CC;
  }

  .el-icon {
    margin-right: 4px;
    vertical-align: middle;
  }
}
</style>
