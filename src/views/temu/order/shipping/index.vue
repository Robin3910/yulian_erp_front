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
          <el-form-item>
            <el-button @click="handleQuery">
              <Icon icon="ep:search" class="mr-5px" />
              搜索
            </el-button>
            <el-button @click="resetQuery">
              <Icon icon="ep:refresh" class="mr-5px" />
              刷新
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
      <el-table-column label="物流单号" align="center" min-width="200" fixed="left">
        <template #default="{ row, $index }">
          <template v-if="spanArr[$index] !== 0">
            <div class="tracking-number-cell">
              <span class="tracking-number">{{ (row as any).trackingNumber || '-' }}</span>
              <el-button
                v-if="row.expressOutsideImageUrl"
                size="small"
                type="primary"
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
        label="订单编号" 
        prop="orderNo" 
        min-width="120" 
        class-name="text-left-column" 
      />

      <!-- 3. 商品图片 -->
      <el-table-column label="商品图片" align="center" prop="productImgUrl" min-width="100">
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

      <!-- 4. 商品标题 -->
      <el-table-column 
        label="商品标题" 
        prop="productTitle" 
        min-width="200" 
        show-overflow-tooltip
        class-name="text-left-column" 
      />

      <!-- 5. 商品属性 -->
      <el-table-column label="商品属性" prop="productProperties" align="center" min-width="150" show-overflow-tooltip>
        <template #default="{ row }">
          <div v-if="row.productProperties">{{ row.productProperties }}</div>
          <span v-else>-</span>
        </template>
      </el-table-column>

      <!-- 6. SKU信息 -->
      <el-table-column label="SKU信息" align="center" min-width="200">
        <template #default="{ row }">
          <div class="sku-info">
            <div>SKU编号：{{ row.sku || '-' }}</div>
            <div>SKC编号：{{ row.skc || '-' }}</div>
            <div>定制SKU：{{ row.customSku || '-' }}</div>
          </div>
        </template>
      </el-table-column>

      <!-- 7. 数量 -->
      <el-table-column label="数量" align="center" prop="quantity" min-width="80" />

      <!-- 8. 定制图片列表 -->
      <el-table-column label="定制图片列表" align="center" prop="customImageUrls" min-width="200">
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

      <!-- 9. 定制文字列表 -->
      <el-table-column label="定制文字列表" prop="customTextList" align="center" min-width="150" show-overflow-tooltip>
        <template #default="{ row }">
          <div v-if="row.customTextList">{{ row.customTextList }}</div>
          <span v-else>-</span>
        </template>
      </el-table-column>

      <!-- 10. 合成预览图 -->
      <el-table-column label="合成预览图" prop="effectiveImgUrl" align="center" min-width="100">
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

      <!-- 11. 订单状态 -->
      <el-table-column label="订单状态" prop="orderStatus" align="center" min-width="100">
        <template #default="{ row }">
          <el-tag :type="getOrderStatusType(row.orderStatus)">
            {{ getOrderStatusText(row.orderStatus) }}
          </el-tag>
        </template>
      </el-table-column>

      <!-- 12. 预订单创建时间 -->
      <el-table-column label="待发货订单创建时间" prop="createTime" align="center" min-width="150">
        <template #default="{ row }">
          {{ row.createTime ? formatDate(row.createTime) : '-' }}
        </template>
      </el-table-column>

      <!-- 操作列 -->
      <el-table-column label="操作" fixed="right" align="center" min-width="120">
        <template #default="{ row }">
          <div class="print-buttons">
            <el-button
              v-if="row.expressImageUrl"
              size="small"
              type="primary"
              @click.stop="handlePrint(row.expressImageUrl)"
            >
              <el-icon><Printer /></el-icon>
              打印面单
            </el-button>
            <el-button
              v-if="row.expressSkuImageUrl"
              size="small"
              type="primary"
              @click.stop="handlePrint(row.expressSkuImageUrl)"
            >
              <el-icon><Printer /></el-icon>
              打印商品条码
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
import { ElMessage } from 'element-plus'
import PrintPreview from './components/PrintPreview.vue'
import { Printer } from '@element-plus/icons-vue'
import { formatDate } from '@/utils/formatTime'

/** 订单 列表 */
defineOptions({ name: 'TemuOrderIndex' })

const loading = ref(true) // 列表的加载中
const list = ref<OrderVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const categoryList = ref<any[]>([])

// 店铺列表
const shopList = ref<any[]>([])
// 多选
const selectedRows = ref<any[]>([])
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  orderNo: undefined,
  trackingNumber: undefined,
  shopId: undefined,
  createTime: []
})
const queryFormRef = ref() // 搜索的表单
const spanArr = ref<number[]>([]) // 用于存储合并信息

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await OrderApi.getShippingOrderPage(queryParams)
    
    // 按物流单号分组处理数据
    const groupedData: OrderVO[] = []
    const trackingGroups = new Map<string, OrderVO[]>()
    
    // 按物流单号分组
    data.list.forEach(item => {
      const trackingNumber = (item as any).trackingNumber || ''
      if (trackingNumber) {
        if (!trackingGroups.has(trackingNumber)) {
          trackingGroups.set(trackingNumber, [])
        }
        trackingGroups.get(trackingNumber)?.push(item)
      } else {
        // 没有物流单号的数据直接添加到结果中
        groupedData.push(item)
      }
    })

    // 将分组数据展平
    trackingGroups.forEach((orders) => {
      groupedData.push(...orders)
    })

    list.value = groupedData
    total.value = data.total

    // 计算合并信息
    const tempSpanArr: number[] = []
    let pos = 0
    let currentTrackingNumber = ''
    
    groupedData.forEach((item, index) => {
      if (index === 0) {
        pos = 0
        currentTrackingNumber = (item as any).trackingNumber || ''
        tempSpanArr.push(1)
      } else {
        if ((item as any).trackingNumber && (item as any).trackingNumber === currentTrackingNumber) {
          tempSpanArr[pos] += 1
          tempSpanArr.push(0)
        } else {
          pos = index
          currentTrackingNumber = (item as any).trackingNumber || ''
          tempSpanArr.push(1)
        }
      }
    })
    
    spanArr.value = tempSpanArr
  } catch (error) {
    console.error('获取数据失败:', error)
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

// 处理表格合并
const handleSpanMethod = ({ rowIndex, columnIndex }: { rowIndex: number, columnIndex: number }) => {
  if (columnIndex === 0) { // 物流单号列
    const rowSpan = spanArr.value[rowIndex]
    if (rowSpan === 0) {
      // 被合并的行，不显示内容
      return {
        rowspan: 0,
        colspan: 0
      }
    }
    // 合并的起始行，显示合并后的内容
    return {
      rowspan: rowSpan,
      colspan: 1
    }
  }
  // 其他列不合并
  return {
    rowspan: 1,
    colspan: 1
  }
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
    default:
      return '未知状态'
  }
}

</script>

<style lang="scss" scoped>
.custom-table {
  :deep(.el-table__cell) {
    border: none;
  }
  
  // 移除表格边框
  :deep(.el-table__inner-wrapper::before) {
    display: none;
  }
  
  // 移除底部边框
  :deep(.el-table__border-bottom-cell) {
    border-bottom: none;
  }
}

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

.sku-info {
  text-align: center;
  
  > div {
    line-height: 1.8;
  }
}

.tracking-number-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px 0;

  .tracking-number {
    font-size: 14px;
    line-height: 1.5;
  }

  :deep(.el-button) {
    width: 120px;
    margin: 0;
  }
}

.print-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  
  :deep(.el-button) {
    width: 120px;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .el-icon {
      margin-right: 4px;
    }
  }
}

:deep(.el-table__cell) {
  .cell {
    padding: 0;
    display: flex;
    justify-content: center;
  }
}

.el-tag {
  margin: 0 2px;
}

:deep(.el-image) {
  border-radius: 4px;
  transition: transform 0.2s;
  
  &:hover {
    transform: scale(1.05);
  }
}

:deep(.el-date-editor) {
  width: 100%;
}

:deep(.text-left-column) {
  .cell {
    justify-content: flex-start !important;
    padding-left: 16px !important;
  }
}

// 如果上面的样式不生效，可以尝试这个更强的选择器
:deep(.el-table) {
  .text-left-column {
    .cell {
      justify-content: flex-start !important;
      padding-left: 16px !important;
    }
  }
}

</style>
