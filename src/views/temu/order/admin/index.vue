<template>
  <div class="h-full flex flex-col">
    <div class="sticky top-0 z-10 bg-white dark:bg-dark-500">
      <ContentWrap>
        <!-- 搜索工作栏 -->
        <el-form
          class="-mb-15px"
          :model="queryParams"
          ref="queryFormRef"
          :inline="true"
          label-width="68px"
        >
          <el-row :gutter="20">
            <el-col :span="24" :lg="6">
              <el-form-item label="店铺" prop="shopId" class="w-full">
                <el-select
                  filterable
                  v-model="queryParams.shopId"
                  placeholder="请选择店铺"
                  clearable
                >
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
              <el-form-item label="SKU编号" prop="sku" class="w-full">
                <el-input
                  v-model="queryParams.sku"
                  placeholder="请输入SKU编号"
                  clearable
                  @keyup.enter="handleQuery"
                />
              </el-form-item>
            </el-col>
            <el-col :span="24" :lg="6">
              <el-form-item label="SKC编号" prop="skc" class="w-full">
                <el-input
                  v-model="queryParams.skc"
                  placeholder="请输入SKC编号"
                  clearable
                  @keyup.enter="handleQuery"
                />
              </el-form-item>
            </el-col>
            <el-col :span="24" :lg="6">
              <el-form-item label="定制SKU" prop="customSku" class="w-full">
                <el-input
                  v-model="queryParams.customSku"
                  placeholder="请输入定制SKU"
                  clearable
                  @keyup.enter="handleQuery"
                />
              </el-form-item>
            </el-col>
            <el-col :span="24" :lg="6">
              <el-form-item label="订单状态" prop="orderStatus" class="w-full">
                <el-select v-model="queryParams.orderStatus" placeholder="请选择订单状态" clearable>
                  <el-option
                    v-for="dict in getStrDictOptions(DICT_TYPE.TEMU_ORDER_STATUS)"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="24" :lg="6">
              <el-form-item label="类目" prop="categoryId" class="w-full">
                <el-select
                  filterable
                  v-model="queryParams.categoryId"
                  placeholder="请选择类目"
                  clearable
                  multiple
                >
                  <el-option
                    v-for="(item, index) in categoryList"
                    :key="index"
                    :label="item.categoryName"
                    :value="item.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="24" :lg="6">
              <el-form-item label="创建时间" prop="bookingTime" class="w-full">
                <el-date-picker
                  v-model="queryParams.bookingTime"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  type="daterange"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
                />
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
                <el-button @click="handleBatchSetStatus">
                  <Icon icon="ep:refresh" class="mr-5px" />
                  批量设置状态
                </el-button>
                <el-button @click="handleBatchOrder" type="primary"> 批量下单</el-button>
                <el-popconfirm
                  title="是否把选中的订单打包成一个批次?"
                  placement="top-start"
                  @confirm="handleBatchGenerate"
                >
                  <template #reference>
                    <el-button type="primary" plain>批次生成</el-button>
                  </template>
                </el-popconfirm>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </ContentWrap>
      <ContentWrap>
        <el-row class="items-center">
          <el-col :span="8" class="color-orange-500">
            <div>
              <span class="!color-dark-50 mr-1" v-if="selectedRows && selectedRows.length > 0"
                >已选中的订单数:{{ selectedRows.length }}
              </span>
              <span
                >当前筛选条件下的订单总价:￥{{
                  orderTotalPrice ? orderTotalPrice.toFixed(2) : '0.00'
                }}</span
              >
            </div>
          </el-col>
          <el-col :span="30">
            <div class="flex items-center justify-end gap-2">
              <el-tag type="info" class="status-tag" size="large">待下单</el-tag>
              <div class="flow-arrow">
                <span class="arrow-item">➤</span>
                <span class="arrow-item">➤</span>
                <span class="arrow-item">➤</span>
              </div>
              <el-tag type="primary" class="status-tag" size="large">已下单待送产</el-tag>
              <div class="flow-arrow">
                <span class="arrow-item">➤</span>
                <span class="arrow-item">➤</span>
                <span class="arrow-item">➤</span>
              </div>
              <el-tag type="warning" class="status-tag" size="large">已送产待生产</el-tag>
              <div class="flow-arrow">
                <span class="arrow-item">➤</span>
                <span class="arrow-item">➤</span>
                <span class="arrow-item">➤</span>
              </div>
              <el-tag type="process" class="status-tag" size="large">已生产待发货</el-tag>
              <div class="flow-arrow">
                <span class="arrow-item">➤</span>
                <span class="arrow-item">➤</span>
                <span class="arrow-item">➤</span>
              </div>
              <el-tag type="success" class="status-tag" size="large">已发货</el-tag>
            </div>
          </el-col>
        </el-row>
      </ContentWrap>
    </div>
    <!-- 列表 -->
    <ContentWrap class="flex-1 overflow-hidden sticky-header">
      <el-table
        v-loading="loading"
        :data="list"
        :stripe="true"
        :show-overflow-tooltip="true"
        @selection-change="handleSelectionChange"
        row-key="id"
        ref="tableRef"
        height="calc(100vh - 280px)"
        fixed-header
      >
        <!--选择-->
        <el-table-column
          type="selection"
          width="55"
          align="center"
          reserve-selection
          fixed="left"
        />
        <!--订单编号和状态-->
        <el-table-column label="订单编号/状态" align="center" min-width="160" fixed="left">
          <template #default="{ row }">
            <div class="flex flex-col items-center">
              <div class="font-bold mb-2 flex items-center">
                {{ row.orderNo }}
                <!-- <el-button
                  v-if="row.orderNo"
                  class="copy-button !ml-1"
                  type="default"
                  link
                  @click.stop="handleCopy(row.orderNo)"
                >
                  <el-icon><CopyDocument /></el-icon>
                </el-button> -->
              </div>
              <el-tag :type="getOrderStatusType(row.orderStatus)" class="status-tag" size="large">
                {{ getOrderStatusText(row.orderStatus) }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <!--店铺信息-->
        <el-table-column label="店铺信息" align="center" min-width="140" fixed="left">
          <template #default="{ row }">
            <div class="text-left">
              <div class="font-bold text-center">{{ row.shopName }}</div>
              <div class="flex items-center justify-center">
                {{ row.shopId }}
              </div>
            </div>
          </template>
        </el-table-column>
        <!--产品图片-->
        <el-table-column label="产品图片" align="center" prop="productImgUrl" width="115">
          <template #default="{ row }">
            <div class="text-left">
              <el-image
                class="w-80px h-80px"
                :hide-on-click-modal="true"
                :preview-teleported="true"
                :src="row.productImgUrl"
                :preview-src-list="[row.productImgUrl]"
              />
            </div>
          </template>
        </el-table-column>
        <!-- 商品信息 -->
<el-table-column label="商品信息" align="center" prop="productImgUrl" min-width="200">
  <template #default="{ row }">
    <div class="text-left">
      <!-- 修改标题容器 -->
      <div class="product-title mb-2">
        <span class="font-bold">产品标题：</span>{{ row.productTitle }}
      </div>

      <!-- 商品属性 -->
      <div class="flex items-start mb-2">
        <div><span class="font-bold">商品属性:</span></div>
        <div class="ml-2">{{ row.productProperties || '--' }}</div>
      </div>
    </div>
  </template>
</el-table-column>
        <!-- 类目名称 -->
        <el-table-column label="类目名称" align="center" prop="productCategoryName" min-width="235">
          <template #default="{ row }">
            <div class="text-center" v-if="row.orderStatus === 0">
              <el-select
                class="!w-[150px]"
                filterable
                v-model="row.categoryId"
                placeholder="请选择类目"
                clearable
              >
                <el-option
                  v-for="(item, index) in categoryList"
                  :key="index"
                  :label="item.categoryName"
                  :value="item.id.toString()"
                />
              </el-select>
              <el-popconfirm
                title="是否更新类目?"
                placement="top-start"
                @confirm="handleUpdateCategory(row)"
              >
                <template #reference>
                  <el-button class="ml-1" type="primary">更新</el-button>
                </template>
              </el-popconfirm>
            </div>
            <div class="text-center" v-else>
              <div>{{ row.categoryName }}</div>
            </div>
          </template>
        </el-table-column>
        <!-- 定制文字列表 -->
        <el-table-column label="定制文字" align="center" min-width="150">
          <template #default="{ row }">
            <div class="text-left" style="text-align: center">{{ row.customTextList || '' }}</div>
          </template>
        </el-table-column>
        <!-- 定制图片 -->
        <el-table-column label="定制图片" align="center" prop="customImageUrls" min-width="180">
          <template #default="{ row }">
            <div class="flex flex-wrap" v-if="row.customImageUrls">
              <div
                v-for="(item, index) in row.customImageUrls.split(',')"
                :key="index"
                class="ml-2"
              >
                <el-image
                  class="w-60px h-60px"
                  :hide-on-click-modal="true"
                  :preview-teleported="true"
                  :src="item"
                  :preview-src-list="[item]"
                />
              </div>
            </div>
          </template>
        </el-table-column>
        <!--合成预览-->
        <el-table-column label="合成预览" align="center" prop="effectiveImgUrl" min-width="120">
          <template #default="{ row }">
            <div class="text-left">
              <el-image
                class="w-60px h-60px"
                v-if="row.effectiveImgUrl"
                :hide-on-click-modal="true"
                :preview-teleported="true"
                :preview-src-list="[row.effectiveImgUrl]"
                :src="row.effectiveImgUrl"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="价格信息" min-width="120">
          <template #default="{ row }">
            <div>
              <div>
                <div>数量：{{ row.quantity || '--' }}</div>
                <div>单价：{{ row.unitPrice ? '￥' + row.unitPrice.toFixed(6) : '--' }}</div>
                <div>总价：{{ row.totalPrice ? '￥' + row.totalPrice.toFixed(2) : '--' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- <el-table-column label="商品属性" align="center" prop="productProperties" min-width="200" /> -->
        <el-table-column label="SKU信息" align="center" prop="productTitle" min-width="275">
          <template #default="{ row }">
            <div class="sku-info">
              <div class="sku-item">
                <span class="label">SKU编号：</span>
                <span>{{ row.sku || '-' }}</span>
                <!-- <el-button
                  v-if="row.sku"
                  class="copy-button !ml-1"
                  type="default"
                  link
                  @click.stop="handleCopy(row.sku)"
                >
                  <el-icon><CopyDocument /></el-icon>
                </el-button> -->
              </div>
              <div class="sku-item">
                <span class="label">SKC编号：</span>
                <span>{{ row.skc || '-' }}</span>
                <!-- <el-button
                  v-if="row.skc"
                  class="copy-button !ml-1"
                  type="default"
                  link
                  @click.stop="handleCopy(row.skc)"
                >
                  <el-icon><CopyDocument /></el-icon>
                </el-button> -->
              </div>
              <div class="sku-item custom-sku-wrapper">
                <span class="label" style="font-weight: bold;">定制SKU：</span>
                <div class="custom-sku-content">
                  <span v-if="row.customSku" class="custom-sku">{{ row.customSku }}</span>
                  <span v-else>-</span>
                  <!-- <el-button
                    v-if="row.customSku"
                    class="copy-button !ml-1"
                    type="default"
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

        <el-table-column
          label="预定单创建时间"
          align="center"
          prop="bookingTime"
          :formatter="dateFormatter"
          :show-overflow-tooltip="false"
          width="150px"
        />

        <el-table-column label="操作" fixed="right" align="center" min-width="130px">
          <template #default="{ row }">
            <div class="action-buttons">
              <!-- 待下单状态 -->
              <el-button
                v-if="row.orderStatus === 0"
                size="small"
                type="primary"
                plain
                class="action-button"
                @click="handleSingleOrder(row)"
              >
                下单
              </el-button>

              <!-- 已下单待送产状态 -->
              <template v-if="row.orderStatus === 1">
                <el-popconfirm
                  title="确认是否修改当前订单状态为已送产待生产?"
                  placement="left"
                  popper-class="custom-popconfirm"
                  @confirm="
                    handleUpdateRowStatus({
                      id: row.id,
                      orderStatus: 2
                    })
                  "
                >
                  <template #reference>
                    <el-button size="small" type="primary" plain class="action-button">
                      已送产待生产
                    </el-button>
                  </template>
                </el-popconfirm>
                <el-popconfirm
                  title="确认取消订单吗？回退到待下单状态"
                  placement="left"
                  popper-class="custom-popconfirm"
                  @confirm="
                    handleUpdateRowStatus({
                      id: row.id,
                      orderStatus: 0
                    })
                  "
                >
                  <template #reference>
                    <el-button size="small" type="info" plain class="action-button mt-2"
                      >取消订单
                    </el-button>
                  </template>
                </el-popconfirm>
              </template>

              <!-- 已送产待生产状态 -->
              <template v-if="row.orderStatus === 2">
                <el-popconfirm
                  title="确认是否修改当前订单状态为已生产待发货?"
                  placement="left"
                  popper-class="custom-popconfirm"
                  @confirm="
                    handleUpdateRowStatus({
                      id: row.id,
                      orderStatus: 3
                    })
                  "
                >
                  <template #reference>
                    <el-button size="small" type="primary" plain class="action-button">
                      已生产待发货
                    </el-button>
                  </template>
                </el-popconfirm>
                <el-popconfirm
                  title="确认取消订单吗？回退到待下单状态"
                  placement="left"
                  popper-class="custom-popconfirm"
                  @confirm="
                    handleUpdateRowStatus({
                      id: row.id,
                      orderStatus: 0
                    })
                  "
                >
                  <template #reference>
                    <el-button size="small" type="info" plain class="action-button mt-2"
                      >取消订单
                    </el-button>
                  </template>
                </el-popconfirm>
              </template>

              <!-- 已生产待发货状态 -->
              <template v-if="row.orderStatus === 3">
                <el-popconfirm
                  title="确认是否修改当前订单状态为已发货?"
                  placement="left"
                  popper-class="custom-popconfirm"
                  @confirm="
                    handleUpdateRowStatus({
                      id: row.id,
                      orderStatus: 4
                    })
                  "
                >
                  <template #reference>
                    <el-button size="small" type="primary" plain class="action-button"
                      >已发货
                    </el-button>
                  </template>
                </el-popconfirm>
                <el-popconfirm
                  title="确认取消订单吗？回退到待下单状态"
                  placement="left"
                  popper-class="custom-popconfirm"
                  @confirm="
                    handleUpdateRowStatus({
                      id: row.id,
                      orderStatus: 0
                    })
                  "
                >
                  <template #reference>
                    <el-button size="small" type="info" plain class="action-button mt-2"
                      >取消订单
                    </el-button>
                  </template>
                </el-popconfirm>
              </template>
              <el-button  size="small" type="text" @click="handlerRemark(row)">备注</el-button>
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
  <!--状态修改确认弹窗-->
  <OrderStatusPopup ref="orderStatusPopup" @confirm="handleUpdateStatus" />
  <!--批量下单组件-->
  <BatchOrderPopup
    ref="batchOrderPopup"
    @visible-event="
      (v: boolean) => {
        batchOrderPopup = v
      }
    "
    :visible="batchOrderPopup"
    v-if="batchOrderPopup"
    @confirm="getList"
  />
  <!--修改备注-->
  <OrderRemarkPopup @confirm="handlerRemarkConfirm" ref="orderRemarkPopup" />
</template>

<script setup lang="ts">
import OrderStatusPopup from '@/views/temu/order/admin/components/OrderStatusPopup.vue'
import BatchOrderPopup from '@/views/temu/order/admin/components/BatchOrderPopup.vue'
import { DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { OrderApi, OrderVO } from '@/api/temu/order'
import { TemuCommonApi } from '@/api/temu/common'
import { getStrDictOptions } from '@/utils/dict'
import { ElMessage, ElMessageBox, ElTable } from 'element-plus'
import { OrderBatchApi } from '@/api/temu/order-batch'
import OrderRemarkPopup from '@/views/temu/order/admin/components/OrderRemarkPopup.vue'
import { CopyDocument } from '@element-plus/icons-vue'

/** 订单 列表 */
defineOptions({ name: 'TemuOrderAdmin' })

const loading = ref(true) // 列表的加载中
const list = ref<OrderVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const categoryList = ref<any[]>([])
const batchOrderPopup = ref(false)
const tableRef = useTemplateRef<InstanceType<typeof ElTable>>('tableRef')
// 店铺列表
const shopList = ref<any[]>([])
// 多选
const selectedRows = ref<any[]>([])
// 批量修改弹窗引用
const orderStatusPopup = useTemplateRef('orderStatusPopup')
// 批量下单弹窗引用
const batchOrderPopupRef = useTemplateRef('batchOrderPopup')
// 备注引用
const orderRemarkPopup = useTemplateRef('orderRemarkPopup')

// 获取订单状态类型
const getOrderStatusType = (
  status: number
): 'success' | 'warning' | 'info' | 'primary' | 'process' => {
  switch (status) {
    case 0:
      return 'info' // 待下单 - 浅灰
    case 1:
      return 'primary' // 已下单待送产 - 浅蓝
    case 2:
      return 'warning' // 已送产待生产 - 浅紫
    case 3:
      return 'process' // 已生产待发货 - 浅绿
    case 4:
      return 'success' // 已发货 - 浅青
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

const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  orderNo: undefined,
  productTitle: undefined,
  orderStatus: undefined,
  sku: undefined,
  skc: undefined,
  salePrice: undefined,
  customSku: undefined,
  quantity: undefined,
  productProperties: undefined,
  bookingTime: [],
  shopId: undefined,
  createTime: [],
  customImageUrls: undefined,
  customTextList: undefined,
  productImgUrl: undefined,
  categoryId: [],
  categoryName: undefined,
  shippingInfo: undefined,
  originalInfo: undefined
})
const queryFormRef = ref() // 搜索的表单
// 订单总金额
const orderTotalPrice = ref(0)
/** 查询列表 */
const getList = async () => {
  tableRef && tableRef.value && tableRef.value.clearSelection()
  loading.value = true
  try {
    const data = await OrderApi.getOrderPageByAdmin(queryParams)
    const { totalPrice } = await OrderApi.getAdminOrderAmountStatistics(queryParams)
    orderTotalPrice.value = totalPrice
    list.value = data.list
    total.value = data.total
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
  console.log('选中的订单：', selection)
  selectedRows.value = selection
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

const handleBatchOrder = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要操作的订单')
    return
  }
  if (selectedRows.value.some((item) => !item.categoryId)) {
    ElMessage.error('存在未设置分类的订单请先设置分类')
    return
  }
  if (selectedRows.value.some((item) => item.orderStatus != 0)) {
    ElMessage.error('只允许未下单的订单进行批量下单')
    return
  }
  batchOrderPopup.value = true
  nextTick(() => {
    batchOrderPopupRef.value?.setOrderList(selectedRows.value)
  })
}

// 处理单个订单下单
const handleSingleOrder = (row: OrderVO) => {
  if (!row.categoryId) {
    ElMessage.error('请先设置分类')
    return
  }
  batchOrderPopup.value = true
  nextTick(() => {
    batchOrderPopupRef.value?.setOrderList([row])
  })
}

const handleBatchGenerate = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要操作的订单')
    return
  }
  if (selectedRows.value.some((item) => !item.categoryId)) {
    ElMessage.error('存在未设置分类的订单请先设置分类')
    return
  }
  if (selectedRows.value.some((item) => item.orderStatus != 1)) {
    ElMessage.error('只允许已下单待送产的订单进行批次生成')
    return
  }
  // 检查选中数据中的分类是否一致  如果不一致 需要弹窗让用确认如果一致则进行批次生成
  const categoryList = selectedRows.value.map((item) => item.categoryId)
  if (new Set(categoryList).size > 1) {
    await new Promise((resolve, reject) => {
      ElMessageBox.confirm('选中的订单存在不同分类是否要继续打包成一个批次？', '温馨提示', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          resolve(true)
        })
        .catch(() => {
          reject(false)
        })
    })
  }
  await OrderBatchApi.createOrderBatch({
    orderIds: selectedRows.value.map((item) => item.id)
  })
  ElMessage.success('操作成功')
  await getList()
}
const handlerRemark = async (row: OrderVO) => {
  if (orderRemarkPopup.value) {
    orderRemarkPopup.value.setVisible(true)
    orderRemarkPopup.value.formData.orderId = row.id
    orderRemarkPopup.value.formData.remark = row.remark
  }
}
const handlerRemarkConfirm = async (data: any) => {
  await OrderApi.updateOrderRemark(data)
  ElMessage.success('操作成功')
  getList()
}

// 处理复制功能
const handleCopy = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('复制成功')
  } catch (err) {
    console.error('复制失败:', err)
    ElMessage.error('复制失败')
  }
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

// 操作按钮样式
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px;

  .action-button {
    width: 95px;
    height: 30px;
    margin: 0;
    border-radius: 4px;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    opacity: 1;
    font-size: 13px;
  }
}

// 状态流转指示器样式
.status-flow-indicator {
  background-color: #fff;
  transition: all 0.3s ease;

  .status-node {
    padding: 4px 8px;
    color: #838282;
    font-weight: 500;
    position: relative;

    &:hover {
      color: #409eff;
    }
  }

  .status-arrow {
    color: #818080;
    margin: 0 4px;
    font-weight: 500;
  }

  &:hover {
    border-color: #666464;
    box-shadow: 0 2px 12px 0 rgba(165, 163, 163, 0.1);
  }
}

// 适配暗黑模式
.dark {
  .status-flow-indicator {
    background-color: #1a1a1a;
    border-color: rgba(24, 23, 23, 0.5);

    .status-node {
      color: #e0e0e0;

      &:hover {
        color: #79bbff;
      }
    }

    .status-arrow {
      color: #696767;
    }
  }
}

.flow-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  overflow: hidden;

  .arrow-item {
    font-size: 16px;
    color: #474646;
    margin: 0 -2px;
    animation: flowAnimation 8s infinite;
    opacity: 0.3;

    &:nth-child(2) {
      animation-delay: 0.2s;
      opacity: 0.6;
    }

    &:nth-child(3) {
      animation-delay: 0.4s;
      opacity: 0.9;
    }
  }
}

@keyframes flowAnimation {
  0% {
    transform: translateX(-100%);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translateX(100%);
    opacity: 0;
  }
}

// 暗黑模式适配
.dark {
  .flow-arrow {
    .arrow-item {
      color: #d6d0d0;
    }
  }
}

// SKU信息样式
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
        flex: 1;

        .custom-sku {
          font-weight: 700;
          color: #409EFF;
          background-color: #ecf5ff;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 14px;
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
</style>
