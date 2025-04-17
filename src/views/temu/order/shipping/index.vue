<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
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
        <el-col :span="24" :lg="8">
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

  <!-- 列表 -->
  <ContentWrap>
    <el-table
      v-loading="loading"
      :data="list"
      :stripe="true"
      :show-overflow-tooltip="true"
      @selection-change="handleSelectionChange"
      :span-method="handleSpanMethod"
      class="custom-table"
    >
      <!-- 物流单号列 -->
      <el-table-column label="物流单号" align="center" min-width="140" fixed="left">
        <template #default="{ row, $index }">
          <template v-if="spanArr.trackingSpans[$index] !== 0">
            <div class="tracking-number-cell">
              <span class="tracking-number">{{ (row as any).trackingNumber || '-' }}</span>
              <el-button
                v-if="row.expressOutsideImageUrl"
                size="small"
                type="primary"
                plain
                class="action-button urgent-print-button"
                @click.stop="handlePrint(row.expressOutsideImageUrl)"
              >
                <el-icon><Printer /></el-icon>
                打印加急面单
              </el-button>
            </div>
          </template>
        </template>
      </el-table-column>

      <!-- 2. 订单编号 -->
      <el-table-column 
        label="订单信息" 
        prop="orderNo" 
        min-width="240" 
        class-name="text-left-column"
        :show-overflow-tooltip="false"
      >
        <template #default="{ row, $index }">
          <template v-if="spanArr.orderSpans[$index] !== 0">
            <div class="order-info">
              <div class="order-number">
                <span class="label">订单编号：</span>
                {{ (row as any).orderNo || '-' }}</div>
              <div class="shop-info">
                <div class="shop-name">
                  <span class="label">店铺名称：</span>
                  <span>{{ row.shopName || '-' }}</span>
                </div>
                <div class="shop-id">
                  <span class="label">店铺ID：</span>
                  <span>{{ row.shopId || '-' }}</span>
                </div>
              </div>
            </div>
          </template>
        </template>
      </el-table-column>

      <!-- 3. 商品图片 -->
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

      <!-- 4. 商品信息 -->
      <el-table-column 
        label="商品信息" 
        min-width="180" 
        class-name="text-left-column"
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
              <span class="label">数量：</span>
              <span>{{ row.quantity }}</span>
            </div>
          </div>
        </template>
      </el-table-column>

      <!-- 5. SKU信息 -->
      <el-table-column 
        label="SKU信息" 
        min-width="200"
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
            <div class="sku-item">
              <span class="label">定制SKU：</span>
              <span>{{ row.customSku || '-' }}</span>
            </div>
          </div>
        </template>
      </el-table-column>

      <!-- 6. 定制图片列表 -->
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

      <!-- 7. 定制文字列表 -->
      <el-table-column label="定制文字列表" prop="customTextList" align="center" min-width="110" show-overflow-tooltip>
        <template #default="{ row }">
          <div v-if="row.customTextList">{{ row.customTextList }}</div>
          <span v-else>-</span>
        </template>
      </el-table-column>

      <!-- 8. 合成预览图 -->
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

      <!-- 9. 订单状态 -->
      <el-table-column label="订单状态" prop="orderStatus" align="center" min-width="135">
        <template #default="{ row }">
          <el-tag :type="getOrderStatusType(row.orderStatus)" class="status-tag" size="large">
            {{ getOrderStatusText(row.orderStatus) }}
          </el-tag>
        </template>
      </el-table-column>

      <!-- 10. 预订单创建时间 -->
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
      <el-table-column label="操作" fixed="right" align="center" min-width="140">
        <template #default="{ row }">
          <div class="action-buttons">
            <el-button
              v-if="row.expressImageUrl"
              size="small"
              type="primary"
              plain
              class="action-button"
              @click.stop="handlePrint(row.expressImageUrl)"
            >
              <el-icon><Printer /></el-icon>
              打印面单
            </el-button>
            <el-button
              v-if="row.expressSkuImageUrl"
              size="small"
              type="info"
              plain
              class="action-button"
              @click.stop="handlePrint(row.expressSkuImageUrl)"
            >
              <el-icon><Printer /></el-icon>
              打印商品条码
            </el-button>
            <el-button
              v-if="row.orderStatus === 3"
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
  <PrintPreview ref="printPreviewRef" :url="currentPrintUrl" />
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { OrderApi, OrderVO } from '@/api/temu/order'
import { TemuCommonApi } from '@/api/temu/common'
import { ElMessage, ElMessageBox } from 'element-plus'
import PrintPreview from './components/PrintPreview.vue'
import { Printer, Van } from '@element-plus/icons-vue'
import { formatDate } from '@/utils/formatTime'

declare global {
  interface Window {
    handleImageError: () => void;
  }
}

interface ExtendedOrderVO extends OrderVO {
  orderId: number;
}

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
  orderStatus: undefined
})
const queryFormRef = ref() // 搜索的表单

interface SpanInfo {
  trackingSpans: number[]
  orderSpans: number[]
}

const spanArr = ref<SpanInfo>({ trackingSpans: [], orderSpans: [] })

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    // 获取所有数据
    const data = await OrderApi.getShippingOrderPage({
      ...queryParams,
      pageNo: 1,
      pageSize: 999999 // 获取所有数据以便进行分组处理
    })
    
    if (!data.list || data.list.length === 0) {
      list.value = []
      total.value = 0
      spanArr.value = { trackingSpans: [], orderSpans: [] }
      return
    }

    // 转换数据为ExtendedOrderVO
    const extendedList = data.list.map(item => ({
      ...item,
      orderId: item.id
    })) as ExtendedOrderVO[]

    // 按物流单号和订单编号分组处理数据
    const trackingGroups = new Map<string, Map<string, ExtendedOrderVO[]>>()
    
    // 第一步：按物流单号和订单编号双重分组
    extendedList.forEach(item => {
      const trackingNumber = item.trackingNumber || ''
      const orderNo = item.orderNo || ''
      
      if (trackingNumber) {
        if (!trackingGroups.has(trackingNumber)) {
          trackingGroups.set(trackingNumber, new Map())
        }
        const orderGroup = trackingGroups.get(trackingNumber)!
        if (!orderGroup.has(orderNo)) {
          orderGroup.set(orderNo, [])
        }
        orderGroup.get(orderNo)!.push(item)
      }
    })

    // 第二步：对每个分组内的数据按createTime排序
    trackingGroups.forEach(orderGroups => {
      orderGroups.forEach(items => {
        items.sort((a, b) => {
          const aTime = Number((a as any).createTime) || 0
          const bTime = Number((b as any).createTime) || 0
          return bTime - aTime // 降序排序
        })
      })
    })

    // 第三步：将物流单号组转换为数组并排序
    const sortedTrackingGroups = Array.from(trackingGroups.entries())
      .sort(([_, aOrders], [__, bOrders]) => {
        const aTime = Number((Array.from(aOrders.values())[0]?.[0] as any)?.createTime) || 0
        const bTime = Number((Array.from(bOrders.values())[0]?.[0] as any)?.createTime) || 0
        return bTime - aTime // 降序排序
      })

    // 更新总数为物流单号的数量
    total.value = trackingGroups.size

    // 第四步：计算当前页需要显示的物流单号范围
    const pageSize = queryParams.pageSize
    const currentPage = queryParams.pageNo
    const startGroupIndex = (currentPage - 1) * pageSize
    const endGroupIndex = startGroupIndex + pageSize
    
    // 第五步：只获取当前页的物流单号组
    const currentPageGroups = sortedTrackingGroups.slice(startGroupIndex, endGroupIndex)
    
    // 第六步：展平当前页的数据
    const groupedData: ExtendedOrderVO[] = []
    const spanInfo: SpanInfo = {
      trackingSpans: [],
      orderSpans: []
    }

    currentPageGroups.forEach(([_, orderGroups]) => {
      // 对每个物流单号内的订单按时间降序排序
      const sortedOrders = Array.from(orderGroups.entries())
        .sort(([_, aItems], [__, bItems]) => {
          const aTime = Number((aItems[0] as any)?.createTime) || 0
          const bTime = Number((bItems[0] as any)?.createTime) || 0
          return bTime - aTime // 降序排序
        })

      // 计算当前物流单号下的所有订单数量
      let totalItemsInTracking = 0
      sortedOrders.forEach(([_, items]) => {
        totalItemsInTracking += items.length
      })

      // 添加物流单号的合并信息
      spanInfo.trackingSpans.push(totalItemsInTracking)
      spanInfo.trackingSpans.push(...Array(totalItemsInTracking - 1).fill(0))
      
      // 处理每个订单组
      sortedOrders.forEach(([_, items]) => {
        // 为每个订单组添加合并信息
        spanInfo.orderSpans.push(items.length)
        spanInfo.orderSpans.push(...Array(items.length - 1).fill(0))
        groupedData.push(...items)
      })
    })

    list.value = groupedData
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
  console.log(selection)
  selectedRows.value = selection.map(item => ({
    ...item,
    orderId: item.id
  })) as ExtendedOrderVO[]
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

const printPreviewRef = useTemplateRef('printPreviewRef')
const currentPrintUrl = ref('')

// 打印处理函数
const handlePrint = (url: string) => {
  // 检查URL是否存在
  if (!url) {
    ElMessage.error('打印失败：未找到打印文件')
    return
  }

  // 处理URL中的@前缀
  const printUrl = url.startsWith('@') ? url.substring(1) : url
  
  // 创建一个隐藏的iframe
  const iframe = document.createElement('iframe')
  iframe.style.display = 'none'
  document.body.appendChild(iframe)
  
  try {
    // 写入打印内容
    iframe.contentWindow?.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>打印面单</title>
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
              body {
                display: flex;
                justify-content: center;
                align-items: center;
              }
              img {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
              }
              ::-webkit-scrollbar {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <img 
            src="${printUrl}" 
            onload="setTimeout(() => { window.print(); window.parent.document.body.removeChild(window.frameElement); }, 100)"
            onerror="window.parent.handleImageError()"
          >
        </body>
      </html>
    `)
    iframe.contentWindow?.document.close()

    // 添加全局错误处理函数
    window.handleImageError = () => {
      ElMessage.error('打印失败：图片加载失败')
      document.body.removeChild(iframe)
    }

    // 设置超时检查
    const timeout = setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe)
        ElMessage.error('打印失败：加载超时')
      }
    }, 10000) // 10秒超时

    // 图片加载成功后清除超时检查
    iframe.contentWindow?.document.querySelector('img')?.addEventListener('load', () => {
      clearTimeout(timeout)
    })

  } catch (error) {
    document.body.removeChild(iframe)
    ElMessage.error('打印失败：' + (error instanceof Error ? error.message : '未知错误'))
  }
}

// 清理全局函数
onUnmounted(() => {
  // @ts-ignore
  delete window.handleImageError
})

// 获取订单状态类型
const getOrderStatusType = (status: number) => {
  switch (status) {
    case 0:
      return 'info'
    case 1:
      return 'warning'
    case 2:
      return 'success'
    case 3:
      return 'warning'
    case 4:
      return 'success'
    default:
      return 'info'
  }
}

// 获取订单状态文本
const getOrderStatusText = (status: number) => {
  switch (status) {
    case 0:
      return '待生产'
    case 1:
      return '生产中'
    case 2:
      return '已生产'
    case 3:
      return '已生产待发货'
    case 4:
      return '已发货'
    default:
      return '未知状态'
  }
}

// 处理发货
const handleShip = async (row: OrderVO) => {
  try {
    await ElMessageBox.confirm('确认发货吗？该操作确认后无法撤回', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await OrderApi.updateOrderShipping({
      orderId: row.id,
      orderStatus: 4
    })
    ElMessage.success('发货成功')
    getList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('发货失败')
    }
  }
}

</script>

<style lang="scss" scoped>
.custom-table {
  :deep(.el-table__row) {
    transition: all 0.3s ease;
    border-left: 3px solid transparent;

    &:nth-child(odd) {
      background-color: #ffffff;
    }
    
    &:nth-child(even) {
      background-color: #f0f2f5;
    }
    
    &:hover {
      background-color: #ecf5ff;
      transform: translateX(1px);
      border-left: 3px solid #409eff;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
      
      td {
        background-color: transparent !important;
        
        .el-button {
          opacity: 1;
        }
      }
    }
  }

  :deep(.el-table__cell) {
    border-bottom: 1px solid #ebeef5;
    transition: all 0.3s ease;
  }

  :deep(.el-table__body) {
    tr.hover-row > td.el-table__cell {
      background-color: transparent;
    }
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

  .tracking-number {
    font-size: 14px;
    line-height: 1.5;
    font-weight: 500;
    color: #303133;
  }

  .urgent-print-button {
    width: 120px;
    margin: 0;
    border-radius: 20px;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.2));
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      
      &::before {
        opacity: 1;
      }
    }

    &:active {
      transform: translateY(1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .el-icon {
      margin-right: 4px;
      vertical-align: middle;
    }
  }
}

// 订单信息
.order-info {
  padding: 8px;
  text-align: left;

  .order-number {
    font-size: 14px;
    font-weight: 500;
    color: #303133;
    margin-bottom: 8px;
    line-height: 1.4;
    word-break: break-all;
    white-space: normal;
  }

  .shop-info {
    .shop-name,
    .shop-id {
      font-size: 13px;
      color: #606266;
      margin-top: 4px;
      line-height: 1.4;

      .label {
        color: #909399;
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
    font-weight: 500;
    color: #303133;
    margin-bottom: 8px;
    line-height: 1.4;
  }

  .product-props,
  .product-quantity {
    font-size: 13px;
    color: #606266;
    margin-top: 4px;
    line-height: 1.4;

    .label {
      color: #909399;
      margin-right: 4px;
    }
  }
}

// SKU信息
.sku-info {
  padding: 8px;
  text-align: left;

  .sku-item {
    font-size: 13px;
    color: #606266;
    margin-top: 4px;
    line-height: 1.4;

    &:first-child {
      margin-top: 0;
    }

    .label {
      color: #909399;
      margin-right: 4px;
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

// 状态标签
.status-tag {
  font-size: 14px;
  padding: 8px 10px;
  border-radius: 20px;
  font-weight: 550;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
}

// 操作按钮
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px;

  .action-button {
    width: 120px;
    margin: 0;
    border-radius: 20px;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    opacity: 0.85;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.2));
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      
      &::before {
        opacity: 1;
      }
    }

    &:active {
      transform: translateY(1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .el-icon {
      margin-right: 4px;
      vertical-align: middle;
    }

    &.ship-button {
      background: linear-gradient(135deg, #67c23a, #85ce61);
      border: none;
      color: white;
      font-weight: 500;
      
      &:hover {
        background: linear-gradient(135deg, #85ce61, #95d475);
      }
    }
  }
}
</style>